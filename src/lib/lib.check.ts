// Self-check de la logique non triviale. `npm run check`
// Pas de framework : des assertions, un fichier, sortie non nulle si ca casse.

import assert from 'node:assert/strict'
import {
  buildTeams,
  buildWeekend,
  dedupeDrivers,
  nextRace,
  nextSession,
  splitDuration,
  teamColours,
  topFinishers,
} from './season.ts'
// @ts-expect-error — script de build en JS, pas de declarations de types.
import { simplify, toTrace } from '../../scripts/fetch-data.mjs'
import { existsSync } from 'node:fs'
import { ARCHIVE } from '../data/archive.ts'
import { CIRCUIT_TRACES } from '../data/circuits.generated.ts'
import { SEASON_SNAPSHOT } from '../data/season.snapshot.ts'
import type { ConstructorStanding, DriverStanding, OpenF1Driver, Race, RaceResult } from './types.ts'

const constructor_ = (constructorId: string, name: string) => ({
  constructorId,
  name,
  nationality: 'X',
  url: '',
})

const standing = (
  position: string,
  driverId: string,
  ...constructorIds: string[]
): DriverStanding => ({
  position,
  points: '10',
  wins: '0',
  Driver: { driverId, givenName: 'A', familyName: 'B', nationality: 'X', url: '' },
  Constructors: constructorIds.map((id) => constructor_(id, id)),
})

const race = (over: Partial<Race> & Pick<Race, 'round' | 'date'>): Race =>
  ({
    season: '2026',
    raceName: `GP ${over.round}`,
    url: '',
    Circuit: {
      circuitId: 'x',
      circuitName: 'X',
      url: '',
      Location: { lat: '0', long: '0', locality: 'X', country: 'X' },
    },
    ...over,
  }) as Race

// --- Programme du week-end -------------------------------------------------

{
  const sprint = race({
    round: '2',
    date: '2026-03-15',
    time: '07:00:00Z',
    FirstPractice: { date: '2026-03-13', time: '03:30:00Z' },
    SprintQualifying: { date: '2026-03-13', time: '07:30:00Z' },
    Sprint: { date: '2026-03-14', time: '03:00:00Z' },
    Qualifying: { date: '2026-03-14', time: '07:00:00Z' },
  })

  assert.deepEqual(
    buildWeekend(sprint).map((s) => s.label),
    ['Essais libres 1', 'Qualifications sprint', 'Sprint', 'Qualifications', 'Course'],
    'un week-end sprint doit etre trie chronologiquement, pas selon un ordre fige',
  )

  // Les horaires arrivent en UTC : 07:00:00Z est bien 07h UTC, pas 07h locales.
  assert.equal(buildWeekend(sprint).at(-1)?.start?.toISOString(), '2026-03-15T07:00:00.000Z')
}

{
  // Une course sans heure publiee ne doit pas produire de date invalide.
  const sansHeure = buildWeekend(race({ round: '1', date: '2026-03-08' }))
  assert.equal(sansHeure.length, 1)
  assert.equal(sansHeure[0]?.start?.toISOString(), '2026-03-08T00:00:00.000Z')
}

// --- Prochaine seance / prochain GP ---------------------------------------

{
  const saison = [
    race({ round: '1', date: '2026-03-08', time: '04:00:00Z' }),
    race({
      round: '2',
      date: '2026-03-15',
      time: '07:00:00Z',
      FirstPractice: { date: '2026-03-13', time: '03:30:00Z' },
    }),
  ]

  // Entre les deux courses : la prochaine seance est les essais du GP 2, pas la course.
  const entre = nextSession(saison, new Date('2026-03-10T00:00:00Z'))
  assert.equal(entre?.session.label, 'Essais libres 1')
  assert.equal(entre?.race.round, '2')
  assert.equal(nextRace(saison, new Date('2026-03-10T00:00:00Z'))?.round, '2')

  // Course en cours : elle a commence, donc elle n'est plus "a venir".
  assert.equal(
    nextSession(saison, new Date('2026-03-08T04:30:00Z'))?.race.round,
    '2',
    'une seance commencee ne doit plus etre proposee',
  )

  // Saison terminee : null, et surtout pas un retour au premier GP.
  assert.equal(nextSession(saison, new Date('2026-12-31T00:00:00Z')), null)
  assert.equal(nextRace(saison, new Date('2026-12-31T00:00:00Z')), null)
}

// --- Pilotes et ecuries ----------------------------------------------------

{
  const brut = [
    { driver_number: 1, team_name: 'McLaren', team_colour: 'F47600' },
    { driver_number: 1, team_name: 'McLaren', team_colour: 'F47600' },
    { driver_number: 44, team_name: 'Ferrari', team_colour: null },
  ] as OpenF1Driver[]

  assert.equal(dedupeDrivers(brut).length, 2, 'OpenF1 renvoie une ligne par session')

  const couleurs = teamColours(brut)
  assert.equal(couleurs.mclaren, '#F47600', "le '#' manquant doit etre ajoute")
  assert.equal(couleurs.ferrari, '#E8002D', 'team_colour null doit retomber sur la teinte figee')
  assert.equal(couleurs.red_bull, '#3671C6', 'une ecurie absente garde sa teinte de secours')
}

{
  const constructors: ConstructorStanding[] = [
    { position: '1', points: '500', wins: '8', Constructor: constructor_('mercedes', 'Mercedes') },
    { position: '2', points: '400', wins: '2', Constructor: constructor_('red_bull', 'Red Bull') },
  ]

  const equipes = buildTeams(
    constructors,
    [
      standing('2', 'russell', 'mercedes'),
      standing('1', 'antonelli', 'mercedes'),
      standing('9', 'someone', 'unknown_team'),
    ],
    [],
  )

  assert.equal(equipes.length, 2)
  assert.deepEqual(
    equipes[0]?.drivers.map((x) => x.driverId),
    ['antonelli', 'russell'],
    'les pilotes doivent etre ordonnes par position au championnat',
  )
  assert.equal(equipes[1]?.drivers.length, 0, 'une ecurie sans pilote connu ne doit pas planter')
  assert.equal(equipes[0]?.name, 'Mercedes')
}

{
  // Changement d'ecurie en cours de saison : le pilote est rattache a la
  // derniere, et les precedentes restent affichables.
  const equipes = buildTeams(
    [
      { position: '1', points: '1', wins: '0', Constructor: constructor_('red_bull', 'Red Bull') },
      { position: '2', points: '1', wins: '0', Constructor: constructor_('rb', 'RB') },
    ],
    [standing('9', 'lawson', 'rb', 'red_bull')],
    [],
  )

  assert.equal(equipes[0]?.drivers.length, 1, 'rattache a la derniere ecurie listee')
  assert.equal(equipes[1]?.drivers.length, 0, 'et pas a la precedente')
  assert.deepEqual(equipes[0]?.drivers[0]?.otherTeams, ['Racing Bulls'])
  assert.deepEqual(
    buildTeams(
      [{ position: '1', points: '1', wins: '0', Constructor: constructor_('rb', 'RB') }],
      [standing('11', 'lindblad', 'rb')],
      [],
    )[0]?.drivers[0]?.otherTeams,
    [],
    'un pilote fidele n a pas d ecurie precedente',
  )
}

// --- Classement d'arrivee -------------------------------------------------

{
  const arrivee = (
    position: string,
    driverId: string,
    constructorId: string,
    extra: Partial<RaceResult> = {},
  ): RaceResult => ({
    position,
    points: '0',
    status: 'Finished',
    Driver: { driverId, givenName: 'Prenom', familyName: driverId, nationality: 'X', url: '' },
    Constructor: constructor_(constructorId, `Nom API ${constructorId}`),
    ...extra,
  })

  // Donne dans le desordre, avec des positions a deux chiffres : '10' < '2' en lexical.
  const brut = [
    arrivee('10', 'dixieme', 'haas'),
    arrivee('2', 'deuxieme', 'ferrari', { Time: { time: '+5.123' } }),
    arrivee('1', 'premier', 'mercedes', { Time: { time: '1:32:10.456' } }),
    arrivee('7', 'septieme', 'alpine'),
    arrivee('6', 'sixieme', 'inconnue', { status: 'Engine' }),
    arrivee('5', 'cinquieme', 'williams', { status: 'Lapped' }),
    arrivee('4', 'quatrieme', 'rb', { status: '+2 Laps' }),
    arrivee('3', 'troisieme', 'mclaren', { status: '+1 Lap' }),
  ]

  const top = topFinishers(brut, { mercedes: '#00D2BE' })

  assert.deepEqual(
    top.map((f) => f.position),
    [1, 2, 3, 4, 5, 6],
    'les six premiers, dans l ordre numerique, et pas au-dela',
  )
  assert.equal(top[0]?.driverId, 'premier')
  assert.equal(top[0]?.gap, '1:32:10.456', 'le vainqueur affiche son temps de course')
  assert.equal(top[1]?.gap, '+5.123', 'les suivants leur ecart')
  assert.equal(top[2]?.gap, '+1 tour', 'singulier')
  assert.equal(top[3]?.gap, '+2 tours', 'pluriel')
  assert.equal(top[4]?.gap, 'Doublé', 'statut Jolpica depuis 2025')
  assert.equal(top[5]?.gap, 'Abandon', 'classe sans avoir fini')

  assert.equal(top[0]?.colour, '#00D2BE', 'la couleur OpenF1 prime')
  assert.equal(top[1]?.colour, '#E8002D', 'repli sur la teinte figee')
  assert.equal(top[5]?.colour, '#8A8F98', 'ecurie inconnue : gris neutre, pas de plantage')
  assert.equal(top[3]?.team, 'Racing Bulls', 'nom court du site')
  assert.equal(top[5]?.team, 'Nom API inconnue', 'repli sur le nom de l API')

  assert.equal(topFinishers([], {}).length, 0, 'course sans classement')
  assert.equal(
    topFinishers([arrivee('R', 'abandon', 'haas'), arrivee('1', 'seul', 'haas')], {}).length,
    1,
    'une position non numerique est ignoree',
  )
}

{
  // La sauvegarde, quand elle contient des resultats, doit etre exploitable.
  for (const [round, results] of Object.entries(SEASON_SNAPSHOT.results ?? {})) {
    assert.ok(
      SEASON_SNAPSHOT.races.some((r) => r.round === round),
      `resultats de la manche ${round} sans course au calendrier`,
    )
    assert.ok(topFinishers(results, {}).length > 0, `manche ${round} : classement vide`)
  }
}

// --- Compte a rebours ------------------------------------------------------

assert.deepEqual(splitDuration(0), { d: 0, h: 0, m: 0, s: 0 })
assert.deepEqual(
  splitDuration(-5000),
  { d: 0, h: 0, m: 0, s: 0 },
  'un delai passe ne part pas en negatif',
)
assert.deepEqual(splitDuration(90_061_000), { d: 1, h: 1, m: 1, s: 1 })

// --- Geometrie des circuits ------------------------------------------------

{
  // Un carre avec des points superflus sur chaque cote : seuls les sommets survivent.
  const carre = [
    [0, 0],
    [5, 0],
    [10, 0],
    [10, 5],
    [10, 10],
    [5, 10],
    [0, 10],
    [0, 5],
  ]
  const simplifie = simplify(carre, 0.5)
  assert.ok(simplifie.length < carre.length, 'les points alignes doivent disparaitre')
  assert.deepEqual(simplifie[0], [0, 0], 'le premier point est conserve')
  assert.deepEqual(simplifie.at(-1), [0, 5], 'le dernier point est conserve')

  // Un ecart superieur a la tolerance doit survivre : c'est ce qui sauve les epingles.
  const epingle = [
    [0, 0],
    [5, 4],
    [10, 0],
  ]
  assert.equal(simplify(epingle, 0.5).length, 3, 'une epingle ne doit pas etre rabotee')
  assert.equal(simplify(epingle, 10).length, 2, 'sous une tolerance large, elle disparait')
}

{
  // toTrace doit ramener n'importe quelle echelle dans le viewBox, marges comprises.
  const trace = toTrace({
    circuitName: 'Test',
    rotation: 0,
    x: [0, 10_000, 10_000, 0],
    y: [0, 0, 5_000, 5_000],
    corners: [{ number: 1, trackPosition: { x: 10_000, y: 0 } }],
  })

  const coords = (trace.path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
  assert.ok(Math.min(...coords) >= 0 && Math.max(...coords) <= 1000, 'le trace sort du viewBox')
  assert.ok(trace.path.startsWith('M') && trace.path.endsWith('Z'), 'le path doit etre ferme')
  assert.equal(trace.corners[0].n, 1)
}

{
  // Controle sur les donnees reellement generees.
  const traces = Object.entries(CIRCUIT_TRACES)
  assert.ok(traces.length >= 20, `seulement ${traces.length} traces generes`)

  for (const [id, t] of traces) {
    const coords = (t.path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)
    assert.ok(Math.min(...coords) >= 0 && Math.max(...coords) <= 1000, `${id} sort du viewBox`)
    assert.ok(t.path.endsWith('Z'), `${id} : trace non ferme`)
    assert.ok(t.corners.length > 0, `${id} : aucun virage`)
  }

  // Un GP sans geometrie publiee est permis ; un trace vide ne l'est pas.
  for (const r of SEASON_SNAPSHOT.races) {
    const t = CIRCUIT_TRACES[r.Circuit.circuitId]
    if (t) assert.ok(t.path.length > 50, `${r.Circuit.circuitId} : trace vide`)
  }
}

// --- Photos d'archive ------------------------------------------------------

for (const photo of ARCHIVE) {
  // Chemin relatif obligatoire : il est resolu contre BASE_URL a l'affichage.
  // Un chemin commencant par '/' court-circuiterait la base et casserait le
  // jour ou le site changerait de sous-dossier.
  assert.ok(!photo.src.startsWith('/'), `${photo.src} : chemin absolu interdit`)
  assert.ok(existsSync(`public/${photo.src}`), `${photo.src} : fichier absent de public/`)
  assert.ok(photo.alt.length > 30, `${photo.src} : texte alternatif trop court`)
  assert.ok(photo.licence === 'CC0' || /public domain/i.test(photo.licence), `${photo.src} : licence non libre`)
}

console.log('check : tout passe')
