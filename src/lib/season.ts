// Logique de saison : horaires de week-end, prochaine seance, agregation des ecuries.
// Fonctions pures, sans acces reseau — testees par src/lib/lib.check.ts.

import type {
  ConstructorStanding,
  DriverStanding,
  Finisher,
  OpenF1Driver,
  Race,
  RaceResult,
  Team,
  TeamDriver,
  WeekendSession,
} from './types.ts'
import { FALLBACK_COLOURS, TEAM_NAME_TO_ID, TEAM_SHORT } from '../data/teams.ts'

/** Les horaires Jolpica sont en UTC ('04:00:00Z'), la date seule sinon. */
function parseSession(date: string | undefined, time: string | undefined): Date | null {
  if (!date) return null
  const iso = time ? `${date}T${time.endsWith('Z') ? time : `${time}Z`}` : `${date}T00:00:00Z`
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

const SESSION_FIELDS = [
  ['FirstPractice', 'Essais libres 1', 'practice'],
  ['SecondPractice', 'Essais libres 2', 'practice'],
  ['ThirdPractice', 'Essais libres 3', 'practice'],
  ['SprintQualifying', 'Qualifications sprint', 'qualifying'],
  ['Sprint', 'Sprint', 'sprint'],
  ['Qualifying', 'Qualifications', 'qualifying'],
] as const

/**
 * Programme complet d'un week-end, trie chronologiquement.
 * Le tri par date plutot que par ordre fixe gere les deux formats de week-end
 * (classique et sprint) sans les distinguer.
 */
export function buildWeekend(race: Race): WeekendSession[] {
  const sessions: WeekendSession[] = []

  for (const [field, label, kind] of SESSION_FIELDS) {
    const s = race[field]
    if (s) sessions.push({ label, kind, start: parseSession(s.date, s.time) })
  }
  sessions.push({ label: 'Course', kind: 'race', start: parseSession(race.date, race.time) })

  return sessions.sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0))
}

export const isSprintWeekend = (race: Race): boolean => Boolean(race.Sprint)

/** Instant de depart de la course, utilise pour trancher passe / futur. */
export const raceStart = (race: Race): Date | null => parseSession(race.date, race.time)

/**
 * Prochaine seance a venir, toutes courses confondues.
 * Renvoie null quand la saison est terminee.
 */
export function nextSession(
  races: Race[],
  now: Date = new Date(),
): { race: Race; session: WeekendSession } | null {
  return upcomingIn(sessionTimeline(races), now.getTime())
}

export interface TimelineEntry {
  race: Race
  session: WeekendSession
  /** Horodatage de debut, en millisecondes. */
  t: number
}

/**
 * Toutes les seances de la saison, a plat et triees.
 *
 * A construire une fois par calendrier, puis a memoriser : sans ca, un compte
 * a rebours qui bat la seconde reconstruit les 23 week-ends et alloue une
 * centaine d'objets Date a chaque battement.
 */
export function sessionTimeline(races: Race[]): TimelineEntry[] {
  const entries: TimelineEntry[] = []

  for (const race of races) {
    for (const session of buildWeekend(race)) {
      if (session.start) entries.push({ race, session, t: session.start.getTime() })
    }
  }

  return entries.sort((a, b) => a.t - b.t)
}

/** Premiere seance a venir dans une frise deja triee. */
export function upcomingIn(timeline: TimelineEntry[], now: number): TimelineEntry | null {
  return timeline.find((e) => e.t > now) ?? null
}

/** Prochain Grand Prix (la course elle-meme, pas les essais). */
export function nextRace(races: Race[], now: Date = new Date()): Race | null {
  const upcoming = races
    .filter((r) => {
      const start = raceStart(r)
      return start !== null && start.getTime() > now.getTime()
    })
    .sort((a, b) => raceStart(a)!.getTime() - raceStart(b)!.getTime())

  return upcoming[0] ?? null
}

/** OpenF1 renvoie une ligne par session : on ne garde qu'une entree par pilote. */
export function dedupeDrivers(drivers: OpenF1Driver[]): OpenF1Driver[] {
  return [...new Map(drivers.map((d) => [d.driver_number, d])).values()]
}

/** constructorId -> '#RRGGBB', depuis OpenF1, avec repli sur les teintes figees. */
export function teamColours(drivers: OpenF1Driver[]): Record<string, string> {
  const colours = { ...FALLBACK_COLOURS }

  for (const d of drivers) {
    const id = TEAM_NAME_TO_ID[d.team_name]
    if (id && d.team_colour) colours[id] = `#${d.team_colour.replace(/^#/, '')}`
  }

  return colours
}

/**
 * Assemble la grille affichable : classement constructeurs + pilotes rattaches
 * a leur ecurie + couleur de livree.
 */
export function buildTeams(
  constructorStandings: ConstructorStanding[],
  driverStandings: DriverStanding[],
  openF1Drivers: OpenF1Driver[],
): Team[] {
  const colours = teamColours(dedupeDrivers(openF1Drivers))
  const byTeam = new Map<string, TeamDriver[]>()

  for (const s of driverStandings) {
    // Un pilote ayant change d'ecurie en cours de saison apparait avec plusieurs
    // constructeurs. On le rattache au dernier, et on garde les autres pour
    // pouvoir l'indiquer : sans ca, une ecurie affiche trois pilotes sans raison.
    const constructorId = s.Constructors.at(-1)?.constructorId
    if (!constructorId) continue

    const entry: TeamDriver = {
      driverId: s.Driver.driverId,
      firstName: s.Driver.givenName,
      lastName: s.Driver.familyName,
      code: s.Driver.code ?? s.Driver.familyName.slice(0, 3).toUpperCase(),
      number: s.Driver.permanentNumber ? Number(s.Driver.permanentNumber) : null,
      nationality: s.Driver.nationality,
      position: Number(s.position),
      points: Number(s.points),
      wins: Number(s.wins),
      otherTeams: s.Constructors.slice(0, -1).map((c) => TEAM_SHORT[c.constructorId] ?? c.name),
    }

    byTeam.set(constructorId, [...(byTeam.get(constructorId) ?? []), entry])
  }

  return constructorStandings.map((s) => ({
    constructorId: s.Constructor.constructorId,
    name: TEAM_SHORT[s.Constructor.constructorId] ?? s.Constructor.name,
    nationality: s.Constructor.nationality,
    colour: colours[s.Constructor.constructorId] ?? '#8A8F98',
    position: Number(s.position),
    points: Number(s.points),
    wins: Number(s.wins),
    drivers: (byTeam.get(s.Constructor.constructorId) ?? []).sort((a, b) => a.position - b.position),
  }))
}

/** constructorId -> couleur, depuis la grille deja assemblee. */
export const coloursByTeam = (teams: Team[]): Record<string, string> =>
  Object.fromEntries(teams.map((t) => [t.constructorId, t.colour]))

/** Nombre de pilotes retenus au classement d'arrivee. */
export const TOP_FINISHERS = 6

/**
 * Retard d'un pilote sans temps publie. Jolpica ecrit '+1 Lap' / '+2 Laps'
 * sur les saisons anciennes et 'Lapped' depuis 2025 : on traduit les deux.
 * Toute autre valeur est une cause d'abandon — un pilote peut etre classe
 * sans avoir fini, s'il a couvert 90 % de la distance.
 */
function statusLabel(status: string): string {
  const laps = /^\+(\d+) Laps?$/.exec(status)
  if (laps) return `+${laps[1]} ${laps[1] === '1' ? 'tour' : 'tours'}`
  if (status === 'Lapped') return 'Doublé'
  if (status === 'Finished') return '—'
  return 'Abandon'
}

/**
 * Les premiers de l'arrivee, dans l'ordre. Le tri est refait ici plutot que
 * suppose : `position` est une chaine, et '10' < '2' en ordre lexical.
 */
export function topFinishers(
  results: RaceResult[],
  colours: Record<string, string>,
  count: number = TOP_FINISHERS,
): Finisher[] {
  return results
    .map((r) => ({ r, position: Number(r.position) }))
    .filter(({ position }) => Number.isInteger(position) && position >= 1 && position <= count)
    .sort((a, b) => a.position - b.position)
    .map(({ r, position }) => ({
      position,
      driverId: r.Driver.driverId,
      firstName: r.Driver.givenName,
      lastName: r.Driver.familyName,
      team: TEAM_SHORT[r.Constructor.constructorId] ?? r.Constructor.name,
      colour: colours[r.Constructor.constructorId] ?? FALLBACK_COLOURS[r.Constructor.constructorId] ?? '#8A8F98',
      gap: r.Time?.time ?? statusLabel(r.status),
    }))
}

/** Decompose un intervalle en jours / heures / minutes / secondes. */
export function splitDuration(ms: number): { d: number; h: number; m: number; s: number } {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  }
}
