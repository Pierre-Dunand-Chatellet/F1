// Recupere une photo d'archive par epoque sur Wikimedia Commons.
//
// Licences acceptees : CC0 et domaine public uniquement. C'est volontairement
// restrictif — ces licences n'imposent aucune attribution, donc aucun risque
// de non-conformite si un credit saute lors d'une refonte. On credite quand
// meme dans le pied de page, par correction.
//
// `npm run fetch-images`

import { readFile, writeFile } from 'node:fs/promises'

const API = 'https://commons.wikimedia.org/w/api.php'
const UA = 'f1-site/1.0 (projet personnel; contact via dunandchatellet.fr)'
const WIDTH = 1000

// Commons limite le debit (429) : on espace les appels plutot que de marteler.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const OK_LICENCES = [/^cc0$/i, /public domain/i, /^pd/i]

// Termes calibres sur des fonds photo largement verses en CC0 (Nationaal
// Archief / Anefo pour les periodes anciennes).
// Plusieurs formulations par epoque : on garde la premiere qui donne une image
// libre. Les termes neerlandais visent le fonds Anefo, verse en CC0.
const QUERIES = {
  pionniers: ['Fangio Mercedes 1955 Zandvoort Anefo', 'Grand Prix Zandvoort 1955 Anefo'],
  'moteur-arriere': ['Jim Clark Lotus Zandvoort Anefo', 'Grote Prijs Zandvoort 1963 Anefo'],
  ailerons: [
    'Grote Prijs van Nederland 1973 Anefo',
    'Grote Prijs van Nederland 1975 Anefo',
    'autoraces Zandvoort 1971 Anefo',
  ],
  turbo: [
    'Grote Prijs van Nederland 1983 Anefo',
    'Grote Prijs van Nederland 1985 Anefo',
    'Formule 1 Zandvoort 1982 Anefo',
  ],
  electronique: [
    'Formula One 1994 Nationaal Archief',
    'Formule 1 1990 Anefo',
    'Formula One car 2004 public domain',
  ],
  aero: ['Formula One 2010 public domain'],
  hybride: ['Formula One 2016 public domain'],
}

const stripHtml = (s) =>
  (s ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Commons renvoie 429 des qu'on insiste. On patiente de plus en plus longtemps
 * plutot que d'abandonner : le but est de reussir une fois, pas d'aller vite.
 */
async function withRetry(fn, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (!String(err.message).includes('429') || i === tries - 1) throw err
      await sleep(5000 * 2 ** i)
    }
  }
}

async function search(term) {
  const url =
    `${API}?action=query&format=json&origin=*&generator=search` +
    `&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=12` +
    `&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=${WIDTH}`

  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status} sur "${term}"`)

  const pages = Object.values((await res.json()).query?.pages ?? {})
  return pages
    .map((p) => p.imageinfo?.[0])
    .filter(Boolean)
    // Commons ajoute des parametres UTM a l'URL : on teste le chemin, pas la
    // chaine complete, sinon l'extension n'est jamais en fin de texte.
    .filter((ii) => /\.jpe?g$/i.test(new URL(ii.url).pathname))
}

function pick(candidates) {
  for (const ii of candidates) {
    const meta = ii.extmetadata ?? {}
    const licence = stripHtml(meta.LicenseShortName?.value)
    if (!OK_LICENCES.some((re) => re.test(licence))) continue
    // Paysage seulement : les portraits verticaux cassent la bande d'illustration.
    const w = ii.thumbwidth ?? ii.width
    const h = ii.thumbheight ?? ii.height
    if (w && h && w / h < 1.15) continue

    return {
      url: ii.thumburl ?? ii.url,
      page: ii.descriptionurl,
      licence,
      credit: stripHtml(meta.Artist?.value) || 'auteur inconnu',
      date: stripHtml(meta.DateTimeOriginal?.value).slice(0, 40),
    }
  }
  return null
}

// On repart des images deja recuperees : un echec de debit ne doit pas effacer
// le travail des executions precedentes.
const found = JSON.parse(await readFile('scripts/images.json', 'utf8').catch(() => '{}'))

for (const [era, terms] of Object.entries(QUERIES)) {
  if (found[era]) {
    console.log(`  ${era.padEnd(16)} — deja recuperee, ignoree`)
    continue
  }
  try {
    let hit = null
    for (const term of terms) {
      hit = pick(await withRetry(() => search(term)))
      if (hit) break
      await sleep(1500)
    }
    if (!hit) {
      console.log(`  ${era.padEnd(16)} — aucune image CC0/domaine public`)
      continue
    }

    const file = `public/img/${era}.jpg`
    const img = await fetch(hit.url, { headers: { 'User-Agent': UA } })
    if (!img.ok) throw new Error(`${img.status} au telechargement`)

    await writeFile(file, Buffer.from(await img.arrayBuffer()))
    found[era] = { src: `img/${era}.jpg`, ...hit }
    console.log(`  ${era.padEnd(16)} — ${hit.licence} — ${hit.credit.slice(0, 40)}`)
    await sleep(1500)
  } catch (err) {
    console.log(`  ${era.padEnd(16)} — echec : ${err.message}`)
  }
}

await writeFile('scripts/images.json', `${JSON.stringify(found, null, 2)}\n`)
console.log(`\n${Object.keys(found).length} image(s). Metadonnees : scripts/images.json`)
