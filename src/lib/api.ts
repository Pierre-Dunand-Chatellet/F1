// Acces aux donnees de la saison : une seule passe de requetes au demarrage,
// partagee par toutes les sections. Si une API tombe, on sert l'instantane
// genere au build plutot qu'une page vide.

import { useEffect, useState } from 'react'
import { SEASON_SNAPSHOT } from '../data/season.snapshot.ts'
import { TOP_FINISHERS, buildTeams, dedupeDrivers } from './season.ts'
import type {
  ConstructorStanding,
  DriverStanding,
  OpenF1Driver,
  Race,
  RaceWithResults,
  SeasonSnapshot,
  Team,
} from './types.ts'

interface JolpicaRaces {
  MRData: { RaceTable: { Races: Race[] } }
}
interface JolpicaResults {
  MRData: { RaceTable: { Races: RaceWithResults[] } }
}
interface JolpicaStandings<K extends string, T> {
  MRData: { StandingsTable: { StandingsLists: ({ round: string } & Record<K, T[]>)[] } }
}
type ConstructorStandings = JolpicaStandings<'ConstructorStandings', ConstructorStanding>
type DriverStandings = JolpicaStandings<'DriverStandings', DriverStanding>

const SEASON = 2026
const JOLPICA = `https://api.jolpi.ca/ergast/f1/${SEASON}`
const OPENF1 = 'https://api.openf1.org/v1'

export interface SeasonData {
  races: Race[]
  teams: Team[]
  round: string
  /** true quand au moins une API n'a pas repondu et qu'on sert l'instantane. */
  stale: boolean
  loading: boolean
}

async function getJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json() as Promise<T>
}

function fromSnapshot(snapshot: SeasonSnapshot, stale: boolean): Omit<SeasonData, 'loading'> {
  return {
    races: snapshot.races,
    teams: buildTeams(
      snapshot.constructorStandings?.ConstructorStandings ?? [],
      snapshot.driverStandings?.DriverStandings ?? [],
      snapshot.drivers,
    ),
    round: snapshot.driverStandings?.round ?? '',
    stale,
  }
}

export function useSeason(): SeasonData {
  // Premier rendu immediat depuis l'instantane : la page n'est jamais vide,
  // et les traces de circuits s'animent sans attendre le reseau.
  const [data, setData] = useState<Omit<SeasonData, 'loading'>>(() =>
    fromSnapshot(SEASON_SNAPSHOT, false),
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function load() {
      try {
        const [races, constructors, drivers, openF1] = await Promise.all([
          getJSON<JolpicaRaces>(`${JOLPICA}/races/?format=json&limit=50`, signal),
          getJSON<ConstructorStandings>(
            `${JOLPICA}/constructorstandings/?format=json&limit=60`,
            signal,
          ),
          getJSON<DriverStandings>(`${JOLPICA}/driverstandings/?format=json&limit=60`, signal),
          getJSON<OpenF1Driver[]>(`${OPENF1}/drivers?meeting_key=latest`, signal),
        ])

        const constructorStandings =
          constructors.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? []
        const driverStandings =
          drivers.MRData.StandingsTable.StandingsLists[0]?.DriverStandings ?? []

        setData({
          races: races.MRData.RaceTable.Races,
          teams: buildTeams(constructorStandings, driverStandings, dedupeDrivers(openF1)),
          round: drivers.MRData.StandingsTable.StandingsLists[0]?.round ?? '',
          stale: false,
        })
      } catch (err) {
        if (signal.aborted) return
        // Panne d'API : on garde l'instantane et on le signale a l'utilisateur
        // plutot que de faire passer des donnees figees pour du temps reel.
        console.warn('Donnees live indisponibles, repli sur l instantane du build.', err)
        setData(fromSnapshot(SEASON_SNAPSHOT, true))
      } finally {
        if (!signal.aborted) setLoading(false)
      }
    }

    void load()
    return () => controller.abort()
  }, [])

  return { ...data, loading }
}

// --- Classement d'arrivee --------------------------------------------------

export type ResultsState =
  | { status: 'loading' }
  | { status: 'ready'; race: RaceWithResults; stale: boolean }
  /** La course a eu lieu mais Jolpica n'a pas encore publie son classement. */
  | { status: 'pending' }
  | { status: 'error' }

/**
 * Une requete par course et par chargement de page : rouvrir une ligne du
 * calendrier ne relance pas le reseau. On garde la promesse plutot que le
 * resultat, pour que deux demandes simultanees partagent la meme requete.
 */
const resultsCache = new Map<string, Promise<RaceWithResults | null>>()

function fetchResults(which: string): Promise<RaceWithResults | null> {
  let pending = resultsCache.get(which)
  if (!pending) {
    pending = getJSON<JolpicaResults>(
      `${JOLPICA}/${which}/results/?format=json&limit=${TOP_FINISHERS}`,
    ).then((r) => r.MRData.RaceTable.Races[0] ?? null)
    // Un echec ne doit pas rester en cache : on retentera a la prochaine ouverture.
    pending.catch(() => resultsCache.delete(which))
    resultsCache.set(which, pending)
  }
  return pending
}

/** Classement tire de la sauvegarde du build, quand l'API ne repond pas. */
function snapshotResults(which: string): RaceWithResults | null {
  const saved = SEASON_SNAPSHOT.results ?? {}
  const round =
    which === 'last'
      ? String(Math.max(0, ...Object.keys(saved).map(Number)))
      : which
  const results = saved[round]
  const race = SEASON_SNAPSHOT.races.find((r) => r.round === round)
  return results?.length && race ? { ...race, Results: results } : null
}

/**
 * Les premiers classes d'une course : `which` est un numero de manche, ou
 * 'last' pour la derniere course dont le classement est publie.
 */
export function useRaceResults(which: string): ResultsState {
  const [state, setState] = useState<ResultsState>({ status: 'loading' })

  useEffect(() => {
    // Pas d'AbortController : la requete est partagee via le cache, la couper
    // pour un composant demonte la couperait pour tous. On ignore la reponse.
    let cancelled = false
    setState({ status: 'loading' })

    fetchResults(which).then(
      (race) => {
        if (!cancelled) setState(race ? { status: 'ready', race, stale: false } : { status: 'pending' })
      },
      (err) => {
        if (cancelled) return
        console.warn('Classement indisponible, repli sur l instantane du build.', err)
        const saved = snapshotResults(which)
        setState(saved ? { status: 'ready', race: saved, stale: true } : { status: 'error' })
      },
    )

    return () => {
      cancelled = true
    }
  }, [which])

  return state
}
