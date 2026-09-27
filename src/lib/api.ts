// Acces aux donnees de la saison : une seule passe de requetes au demarrage,
// partagee par toutes les sections. Si une API tombe, on sert l'instantane
// genere au build plutot qu'une page vide.

import { useEffect, useState } from 'react'
import { SEASON_SNAPSHOT } from '../data/season.snapshot.ts'
import { buildTeams, dedupeDrivers } from './season.ts'
import type {
  ConstructorStanding,
  DriverStanding,
  OpenF1Driver,
  Race,
  RaceResult,
  SeasonSnapshot,
  Team,
} from './types.ts'

interface JolpicaRaces {
  MRData: { RaceTable: { Races: Race[] } }
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

async function getJSON<T>(url: string, signal: AbortSignal): Promise<T> {
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

interface JolpicaResults {
  MRData: { RaceTable: { Races: { Results: RaceResult[] }[] } }
}

/**
 * Classement d'une course passee, charge seulement quand on ouvre sa ligne :
 * 23 requetes au demarrage pour des tableaux que personne n'ouvre, non.
 * null = en cours, [] = pas encore publie, 'erreur' = API injoignable.
 */
export function useRaceResults(round: string, enabled: boolean): RaceResult[] | null | 'erreur' {
  const [results, setResults] = useState<RaceResult[] | null | 'erreur'>(null)
  const loaded = results !== null && results !== 'erreur'

  useEffect(() => {
    // Deja charge : une ligne refermee puis rouverte ne refait pas la requete.
    if (!enabled || loaded) return
    const controller = new AbortController()
    setResults(null)

    getJSON<JolpicaResults>(`${JOLPICA}/${round}/results/?format=json&limit=30`, controller.signal)
      .then((data) => setResults(data.MRData.RaceTable.Races[0]?.Results ?? []))
      .catch(() => {
        if (!controller.signal.aborted) setResults('erreur')
      })

    return () => controller.abort()
  }, [round, enabled, loaded])

  return results
}
