// Genere les donnees figees au build :
//   src/data/circuits.generated.ts  -> traces SVG des circuits
//   src/data/season.snapshot.ts     -> calendrier + grille + classements de secours
//
// A relancer a la main quand le calendrier change : `npm run fetch-data`.
// Rien de tout ca n'est fetch au runtime : le trace doit exister au premier rendu
// pour que l'animation de pathLength demarre sans saccade.

import { writeFile } from 'node:fs/promises'

const SEASON = 2026
const VIEWBOX = 1000
const PADDING = 48

// circuitId Jolpica -> circuit_key MultiViewer.
// Ecrit a la main volontairement : sur 23 entrees connues, une correspondance
// approximative sur les noms de villes ("Miami" vs "Miami Gardens", "Spa" vs
// "Spa-Francorchamps") echouerait en silence. Ici, un circuit inconnu leve une erreur.
const CIRCUIT_KEYS = {
  albert_park: 10,
  shanghai: 49,
  suzuka: 46,
  miami: 151,
  villeneuve: 23,
  monaco: 22,
  catalunya: 15,
  red_bull_ring: 19,
  silverstone: 2,
  spa: 7,
  hungaroring: 4,
  zandvoort: 55,
  monza: 39,
  madring: 153, // pas de geometrie publiee
  baku: 144,
  sepang: 12, // pas de geometrie publiee
  marina_bay: 61,
  americas: 9,
  rodriguez: 65,
  interlagos: 14,
  vegas: 152,
  losail: 150,
  yas_marina: 70,
}

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'f1-site/1.0' } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  return res.json()
}

/**
 * Ramer-Douglas-Peucker sur une polyligne ouverte : supprime les points qui
 * n'ecartent pas la ligne de plus de `tol`.
 */
function rdp(points, tol) {
  if (points.length < 3) return points
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]

  while (stack.length) {
    const [first, last] = stack.pop()
    const [ax, ay] = points[first]
    const [bx, by] = points[last]
    const dx = bx - ax
    const dy = by - ay
    const norm = Math.hypot(dx, dy) || 1
    let worst = 0
    let worstAt = -1

    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i]
      // Distance perpendiculaire du point au segment [a, b].
      const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / norm
      if (d > worst) {
        worst = d
        worstAt = i
      }
    }

    if (worst > tol && worstAt > 0) {
      keep[worstAt] = 1
      stack.push([first, worstAt], [worstAt, last])
    }
  }

  return points.filter((_, i) => keep[i])
}

/**
 * Simplifie un trace. Les longues droites fondent, les epingles (Monaco,
 * Hungaroring) sont conservees au point pres — ce qu'une decimation
 * "1 point sur 3" detruirait.
 *
 * Un circuit est une boucle fermee : son premier et son dernier point sont
 * confondus sur la ligne de depart. Le segment de reference du RDP est alors
 * degenere, toutes les distances valent zero et l'algorithme supprime le trace
 * entier (Monza s'etait reduit a un point). On coupe donc la boucle en deux au
 * point le plus eloigne du depart, et on simplifie chaque moitie separement.
 */
export function simplify(points, tol) {
  if (points.length < 3) return points

  const [fx, fy] = points[0]
  const [lx, ly] = points[points.length - 1]
  if (Math.hypot(lx - fx, ly - fy) >= tol) return rdp(points, tol)

  let cut = 0
  let farthest = -1
  for (let i = 1; i < points.length; i++) {
    const d = Math.hypot(points[i][0] - fx, points[i][1] - fy)
    if (d > farthest) {
      farthest = d
      cut = i
    }
  }

  return [...rdp(points.slice(0, cut + 1), tol), ...rdp(points.slice(cut), tol).slice(1)]
}

/**
 * Convertit le nuage de points MultiViewer en un path SVG normalise.
 * Les coordonnees sont en unites arbitraires, orientees par `rotation` (degres),
 * et l'axe Y pointe vers le haut — l'inverse du SVG, d'ou le miroir vertical.
 */
export function toTrace(raw) {
  const rad = (raw.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const rotate = (x, y) => [x * cos - y * sin, x * sin + y * cos]

  const pts = raw.x.map((x, i) => rotate(x, raw.y[i]))
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  const span = Math.max(maxX - minX, maxY - minY)
  const scale = (VIEWBOX - PADDING * 2) / span
  // Centre la forme dans le viewBox carre, et retourne Y pour le repere SVG.
  const offX = PADDING + (VIEWBOX - PADDING * 2 - (maxX - minX) * scale) / 2
  const offY = PADDING + (VIEWBOX - PADDING * 2 - (maxY - minY) * scale) / 2
  const project = ([x, y]) => [
    round(offX + (x - minX) * scale),
    round(offY + (maxY - y) * scale),
  ]

  // Simplifie dans l'espace du viewBox : la tolerance est donc en unites d'affichage.
  const shape = simplify(pts.map(project), 1.2)
  const path = shape.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.join(' ')}`).join('') + 'Z'

  const corners = raw.corners.map((c) => {
    const [x, y] = project(rotate(c.trackPosition.x, c.trackPosition.y))
    return { n: c.number, x, y }
  })

  return { name: raw.circuitName, path, corners, points: shape.length }
}

const round = (n) => Math.round(n * 10) / 10

async function main() {
  console.log(`Saison ${SEASON}\n`)

  const races = (await getJSON(`https://api.jolpi.ca/ergast/f1/${SEASON}/races/?format=json&limit=50`))
    .MRData.RaceTable.Races
  console.log(`  ${races.length} Grands Prix`)

  const unknown = races.map((r) => r.Circuit.circuitId).filter((id) => !(id in CIRCUIT_KEYS))
  if (unknown.length) {
    throw new Error(`Circuits sans circuit_key connu : ${unknown.join(', ')}.
Ajoute-les dans CIRCUIT_KEYS (cherche la cle sur api.openf1.org/v1/meetings?year=${SEASON}).`)
  }

  const traces = {}
  let missing = []
  for (const race of races) {
    const id = race.Circuit.circuitId
    const key = CIRCUIT_KEYS[id]
    const res = await fetch(`https://api.multiviewer.app/api/v1/circuits/${key}/${SEASON}`)
    if (!res.ok) {
      missing.push(id)
      continue
    }
    traces[id] = toTrace(await res.json())
  }
  const totalPts = Object.values(traces).reduce((n, t) => n + t.points, 0)
  console.log(`  ${Object.keys(traces).length} traces recuperes, ${totalPts} points apres simplification`)
  if (missing.length) console.log(`  sans geometrie publiee : ${missing.join(', ')}`)

  // Secours : si Jolpica ou OpenF1 tombe, le site sert ce instantane plutot qu'une page vide.
  const [driverStandings, constructorStandings, drivers] = await Promise.all([
    getJSON(`https://api.jolpi.ca/ergast/f1/${SEASON}/driverstandings/?format=json&limit=60`),
    getJSON(`https://api.jolpi.ca/ergast/f1/${SEASON}/constructorstandings/?format=json&limit=60`),
    getJSON('https://api.openf1.org/v1/drivers?meeting_key=latest'),
  ])

  const snapshot = {
    generatedAt: new Date().toISOString(),
    season: String(SEASON),
    races,
    driverStandings: driverStandings.MRData.StandingsTable.StandingsLists[0] ?? null,
    constructorStandings: constructorStandings.MRData.StandingsTable.StandingsLists[0] ?? null,
    // OpenF1 renvoie une ligne par session : on deduplique par numero de pilote.
    drivers: [...new Map(drivers.map((d) => [d.driver_number, d])).values()],
  }
  console.log(`  ${snapshot.drivers.length} pilotes, classement arrete au round ${snapshot.driverStandings?.round}`)

  const banner = '// Genere par scripts/fetch-data.mjs — ne pas editer a la main.\n'

  for (const t of Object.values(traces)) delete t.points

  await writeFile(
    'src/data/circuits.generated.ts',
    `${banner}import type { CircuitTrace } from '../lib/types'\n\nexport const CIRCUIT_TRACES: Record<string, CircuitTrace> = ${JSON.stringify(traces)}\n`,
  )
  await writeFile(
    'src/data/season.snapshot.ts',
    `${banner}import type { SeasonSnapshot } from '../lib/types'\n\nexport const SEASON_SNAPSHOT = ${JSON.stringify(snapshot)} as unknown as SeasonSnapshot\n`,
  )
  console.log('\nEcrit : src/data/circuits.generated.ts, src/data/season.snapshot.ts')
}

if (import.meta.filename === process.argv[1]) await main()
