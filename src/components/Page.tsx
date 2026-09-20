import type { ReactNode } from 'react'
import { Nav } from './Nav.tsx'
import { Magnetic } from './ui.tsx'
import { useReducedMotion, useSmoothScroll } from '../lib/hooks.ts'
import { ROUTES, href } from '../lib/routes.ts'

/**
 * Habillage commun aux quatre pages : barre de navigation, bandeau d'alerte,
 * pied de page. Chaque page est un document independant, donc cet habillage
 * est monte a chaque chargement — il doit rester leger.
 */
export function Page({
  children,
  stale = false,
  bleed = false,
}: {
  children: ReactNode
  /** Vrai quand les donnees affichees viennent de l'instantane du build. */
  stale?: boolean
  /** L'accueil passe sous la barre fixe ; les autres pages s'en ecartent. */
  bleed?: boolean
}) {
  const reduced = useReducedMotion()
  // Le defilement lisse est un confort, pas une fonctionnalite : on le coupe
  // des que l'utilisateur demande moins de mouvement.
  useSmoothScroll(!reduced)

  return (
    <>
      <Nav />
      {stale && <StaleBanner />}
      <main className={bleed || stale ? undefined : 'pt-[var(--nav-h)]'}>{children}</main>
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
    <footer className="border-t border-[var(--grid-line)] px-[var(--gutter)] py-14 text-sm text-carbon-300">
      <nav aria-label="Pages du site">
        <ul className="flex flex-wrap gap-x-8 gap-y-2">
          {ROUTES.map((route) => (
            <li key={route.path}>
              <a href={href(route.path)} className="pressable text-ink hover-rise inline-block">
                <span className="tech mr-2 text-carbon-500">{route.index}</span>
                {route.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <p className="tech mt-12 text-carbon-500">Sources</p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        <Source
          url="https://jolpi.ca/"
          name="Jolpica-F1"
          detail="Calendrier, classements pilotes et constructeurs"
        />
        <Source url="https://openf1.org/" name="OpenF1" detail="Grille et couleurs d’écurie" />
        <Source
          url="https://multiviewer.app/"
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

function Source({ url, name, detail }: { url: string; name: string; detail: string }) {
  return (
    <li>
      <a
        href={url}
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
