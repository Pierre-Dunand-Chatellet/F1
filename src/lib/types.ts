// Types des trois APIs publiques consommees par le site.
// Volontairement partiels : on ne declare que les champs qu'on lit.

/** Trace vectoriel d'un circuit, normalise dans un viewBox 1000x1000. */
export interface CircuitTrace {
  name: string
  /** Path SVG ferme, pret a poser dans un <path d="...">. */
  path: string
  corners: { n: number; x: number; y: number }[]
}

// --- Jolpica (successeur d'Ergast) ---

export interface Session {
  date: string
  time?: string
}

export interface Circuit {
  circuitId: string
  circuitName: string
  url: string
  Location: { lat: string; long: string; locality: string; country: string }
}

export interface Race {
  season: string
  round: string
  raceName: string
  url: string
  Circuit: Circuit
  date: string
  time?: string
  FirstPractice?: Session
  SecondPractice?: Session
  ThirdPractice?: Session
  Qualifying?: Session
  Sprint?: Session
  SprintQualifying?: Session
}

export interface Constructor {
  constructorId: string
  name: string
  nationality: string
  url: string
}

export interface Driver {
  driverId: string
  permanentNumber?: string
  code?: string
  givenName: string
  familyName: string
  nationality: string
  url: string
}

export interface DriverStanding {
  position: string
  points: string
  wins: string
  Driver: Driver
  Constructors: Constructor[]
}

export interface ConstructorStanding {
  position: string
  points: string
  wins: string
  Constructor: Constructor
}

export interface StandingsList<T> {
  season: string
  round: string
  DriverStandings?: T extends DriverStanding ? DriverStanding[] : never
  ConstructorStandings?: T extends ConstructorStanding ? ConstructorStanding[] : never
}

// --- OpenF1 ---

export interface OpenF1Driver {
  driver_number: number
  full_name: string
  first_name: string | null
  last_name: string | null
  name_acronym: string
  team_name: string
  /** Hexadecimal sans le '#'. */
  team_colour: string | null
}

// --- Donnees agregees servies a l'application ---

export interface SeasonSnapshot {
  generatedAt: string
  season: string
  races: Race[]
  driverStandings: { season: string; round: string; DriverStandings: DriverStanding[] } | null
  constructorStandings:
    | { season: string; round: string; ConstructorStandings: ConstructorStanding[] }
    | null
  drivers: OpenF1Driver[]
}

/** Une ecurie telle qu'affichee : classement Jolpica + identite visuelle OpenF1. */
export interface Team {
  constructorId: string
  name: string
  nationality: string
  /** Couleur de livree, '#RRGGBB'. */
  colour: string
  position: number
  points: number
  wins: number
  drivers: TeamDriver[]
}

export interface TeamDriver {
  driverId: string
  firstName: string
  lastName: string
  code: string
  number: number | null
  nationality: string
  position: number
  points: number
  wins: number
  /** Autres ecuries pour lesquelles il a couru cette saison, s'il en a change. */
  otherTeams: string[]
}

/** Une seance d'un week-end de course, horodatee. */
export interface WeekendSession {
  label: string
  /** null si l'API ne donne pas d'heure pour cette seance. */
  start: Date | null
  kind: 'practice' | 'qualifying' | 'sprint' | 'race'
}

/** Une ligne du classement d'une course, telle que Jolpica la renvoie. */
export interface RaceResult {
  position: string
  /** '1'..'22', ou 'R' abandon, 'W' non partant, 'D' disqualifie. */
  positionText: string
  points: string
  laps: string
  status: string
  Driver: Driver
  Constructor: Constructor
  Time?: { time: string }
  FastestLap?: { rank: string }
}
