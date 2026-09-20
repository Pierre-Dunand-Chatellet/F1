import { ArrowUpRight } from 'lucide-react'
import { useMemo } from 'react'
import { Reveal } from '../components/ui.tsx'
import { ERAS } from '../data/eras.ts'
import { localise } from '../data/labels.ts'
import { ROUTES, href } from '../lib/routes.ts'
import { nextRace } from '../lib/season.ts'
import type { Race, Team } from '../lib/types.ts'

/**
 * Sommaire de l'accueil. Chaque entree annonce ce qu'elle contient avec une
 * donnee reelle plutot qu'une formule creuse : on sait ce qu'on va trouver
 * avant de cliquer.
 */
export function Sommaire({ races, teams }: { races: Race[]; teams: Team[] }) {
  const teasers = useMemo(() => {
    const upcoming = nextRace(races)
    const drivers = teams.reduce((n, t) => n + t.drivers.length, 0)

    return {
      // « classés » et non « engagés » : un pilote ayant change d'ecurie en cours
      // de saison apparait dans le classement, la ou les baquets n'ont pas bouge.
      'ecuries/': teams.length
        ? `${teams.length} écuries · ${drivers} pilotes classés`
        : 'La grille',
      'calendrier/': upcoming
        ? `Prochain : ${localise(upcoming).name}`
        : `${races.length} Grands Prix`,
      'histoire/': `${ERAS.length} époques, de 1950 à aujourd’hui`,
    } as Record<string, string>
  }, [races, teams])

  return (
    <section className="px-[var(--gutter)] py-[12vh]">
      <ul className="border-t border-[var(--grid-line)]">
        {ROUTES.map((route, i) => (
          <Reveal as="li" key={route.path} delay={i * 70}>
            <a
              href={href(route.path)}
              className="pressable group flex items-center gap-6 border-b border-[var(--grid-line)] py-8"
            >
              <span className="tabular tech w-10 shrink-0 text-carbon-500">{route.index}</span>

              <span className="min-w-0 flex-1">
                <span className="display block text-[clamp(1.8rem,5vw,3.25rem)]">{route.label}</span>
                <span className="mt-1 block text-sm text-carbon-300">{teasers[route.path]}</span>
              </span>

              <ArrowUpRight
                size={26}
                strokeWidth={1.25}
                aria-hidden
                className="shrink-0 text-carbon-500 transition-all duration-200 ease-out group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent"
              />
            </a>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
