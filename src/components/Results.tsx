import { useMemo } from 'react'
import { useRaceResults } from '../lib/api.ts'
import { TOP_FINISHERS, coloursByTeam, topFinishers } from '../lib/season.ts'
import type { Team } from '../lib/types.ts'

/**
 * Classement d'arrivee d'une course, en liste compacte. Monte seulement quand
 * on deplie un Grand Prix passe : la requete part a l'ouverture, pas au
 * chargement du calendrier — vingt requetes d'un coup depasseraient la limite
 * de debit de Jolpica.
 */
export function RaceResults({ round, teams }: { round: string; teams: Team[] }) {
  const state = useRaceResults(round)
  const colours = useMemo(() => coloursByTeam(teams), [teams])

  return (
    <div aria-busy={state.status === 'loading'}>
      <p className="tech flex items-baseline justify-between gap-4 text-carbon-300">
        <span>Arrivée · {TOP_FINISHERS} premiers</span>
        {state.status === 'ready' && state.stale && <span className="text-carbon-500">Sauvegarde</span>}
      </p>

      {state.status === 'loading' && <ResultsSkeleton />}
      {state.status === 'pending' && <ResultsNote>Classement en attente de publication.</ResultsNote>}
      {state.status === 'error' && <ResultsNote>Classement indisponible pour le moment.</ResultsNote>}

      {state.status === 'ready' && (
        <ol className="mt-4 space-y-px bg-[var(--grid-line)]">
          {topFinishers(state.race.Results, colours).map((f) => (
            <li key={f.driverId} className="flex items-center gap-4 bg-void py-3">
              <span
                className={`tabular display w-7 shrink-0 text-[1.35rem] ${f.position === 1 ? 'text-accent' : ''}`}
              >
                <span className="sr-only">Position </span>
                {f.position}
              </span>
              <span aria-hidden className="h-8 w-[3px] shrink-0" style={{ background: f.colour }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate">
                  <span className="text-carbon-300">{f.firstName} </span>
                  {f.lastName}
                </span>
                <span className="tech text-carbon-500">{f.team}</span>
              </span>
              <span className="tabular shrink-0 text-sm text-carbon-300">{f.gap}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export function ResultsNote({ children }: { children: string }) {
  return <p className="mt-4 border-y border-[var(--grid-line)] py-4 text-sm text-carbon-300">{children}</p>
}

/** Emplacements a la hauteur des lignes finales : rien ne saute a l'arrivee des donnees. */
function ResultsSkeleton() {
  return (
    <ul aria-hidden className="mt-4 space-y-px bg-[var(--grid-line)]">
      {Array.from({ length: TOP_FINISHERS }, (_, i) => (
        <li key={i} className="flex items-center gap-4 bg-void py-3">
          <span className="h-8 w-7 shrink-0" />
          <span className="h-8 w-[3px] shrink-0 bg-carbon-700" />
          <span className="min-w-0 flex-1">
            <span className="flex h-6 items-center">
              <span className="h-3.5 w-40 max-w-full animate-pulse bg-carbon-800" />
            </span>
            <span className="flex h-4 items-center">
              <span className="h-2 w-20 animate-pulse bg-carbon-800" />
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
