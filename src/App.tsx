import { Nav } from './components/Nav.tsx'
import { Magnetic } from './components/ui.tsx'
import { useSeason } from './lib/api.ts'
import { useReducedMotion, useSmoothScroll } from './lib/hooks.ts'
import { Calendar } from './sections/Calendar.tsx'
import { Hero } from './sections/Hero.tsx'
import { History } from './sections/History.tsx'
import { Teams } from './sections/Teams.tsx'

export function App() {
  const reduced = useReducedMotion()
  // Le defilement lisse est un confort, pas une fonctionnalite : on le coupe
  // des que l'utilisateur demande moins de mouvement.
  useSmoothScroll(!reduced)

  const { races, teams, round, stale } = useSeason()

  return (
    <>
      <Nav />
      <main>
        {stale && <StaleBanner />}
        <Hero races={races} round={round} />
        <Teams teams={teams} />
        <Calendar races={races} />
        <History />
      </main>
      <Credits stale={stale} />
    </>
  )
}

function StaleBanner() {
  return (
    // Colle sous la barre fixe : place dans le flux, l'avertissement passait
    // derriere la nav et restait invisible pour qui arrive par une ancre.
    <p
      role="status"
      className="tech sticky top-[var(--nav-h)] z-30 mt-[var(--nav-h)] border-y border-accent/40 bg-[#1d0a06] px-[var(--gutter)] py-2.5 text-center text-accent"
    >
      Données temps réel indisponibles — affichage de la dernière sauvegarde
    </p>
  )
}

function Credits({ stale }: { stale: boolean }) {
  return (
    <footer
      id="credits"
      className="border-t border-[var(--grid-line)] px-[var(--gutter)] py-14 text-sm text-carbon-300"
    >
      <p className="tech text-carbon-500">Sources</p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        <Source
          href="https://jolpi.ca/"
          name="Jolpica-F1"
          detail="Calendrier, classements pilotes et constructeurs"
        />
        <Source href="https://openf1.org/" name="OpenF1" detail="Grille et couleurs d’écurie" />
        <Source
          href="https://multiviewer.app/"
          name="MultiViewer"
          detail="Géométrie des tracés, figée au build"
        />
      </ul>

      <p className="mt-8 max-w-2xl leading-relaxed text-carbon-500">
        Site non officiel, sans lien avec la Formula One World Championship Limited. Les noms
        d’écuries et de Grands Prix sont cités à titre informatif. Aucune image officielle n’est
        reproduite : les tracés sont des rendus vectoriels, les identités visuelles des compositions
        typographiques, et les deux photos d’archive proviennent du fonds Anefo, en CC0.
        {stale && ' Les données affichées proviennent actuellement d’une sauvegarde locale.'}
      </p>

      <p className="mt-8">
        <Magnetic>
          <a
            href="https://dunandchatellet.fr/mentions-legales.html"
            className="pressable inline-block border-b border-carbon-500 pb-0.5 text-ink"
          >
            Mentions légales
          </a>
        </Magnetic>
      </p>
    </footer>
  )
}

function Source({ href, name, detail }: { href: string; name: string; detail: string }) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="pressable block text-ink transition-colors duration-150 hover:text-accent"
      >
        {name}
      </a>
      <span className="text-carbon-500">{detail}</span>
    </li>
  )
}
