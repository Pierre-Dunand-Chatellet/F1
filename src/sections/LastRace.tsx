import { useMemo } from 'react'
import { ResultsNote } from '../components/Results.tsx'
import { Reveal } from '../components/ui.tsx'
import { localise } from '../data/labels.ts'
import { useRaceResults } from '../lib/api.ts'
import { TOP_FINISHERS, coloursByTeam, raceStart, topFinishers } from '../lib/season.ts'
import type { Finisher, Team } from '../lib/types.ts'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

/**
 * Arrivee de la derniere course dont le classement est publie. On demande
 * 'last' a Jolpica plutot que de deduire la manche du calendrier : dans les
 * heures qui suivent le drapeau a damier, la course est passee mais son
 * classement n'existe pas encore, et on afficherait un bloc vide.
 */
export function LastRace({ teams }: { teams: Team[] }) {
  const state = useRaceResults('last')
  const colours = useMemo(() => coloursByTeam(teams), [teams])

  // Aucune course courue : la saison n'a pas commence, il n'y a rien a annoncer.
  if (state.status === 'pending') return null

  const race = state.status === 'ready' ? state.race : null
  const label = race ? localise(race) : null
  const start = race ? raceStart(race) : null

  return (
    <section
      aria-labelledby="dernier-gp"
      aria-busy={state.status === 'loading'}
      className="px-[var(--gutter)] pt-[12vh]"
    >
      <Reveal>
        <p className="tech flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 text-accent">
          <span>Dernier Grand Prix{race && ` · Manche ${race.round}`}</span>
          {state.status === 'ready' && state.stale && (
            <span className="text-carbon-500">Sauvegarde</span>
          )}
        </p>
      </Reveal>
      <Reveal delay={60}>
        <h2 id="dernier-gp" className="display mt-4 text-[clamp(2rem,5.5vw,4rem)]">
          {label?.name ?? 'Arrivée'}
        </h2>
      </Reveal>
      {label && (
        <Reveal delay={120}>
          <p className="mt-3 text-carbon-300">
            {label.locality}, {label.country}
            {start && ` — ${dateFmt.format(start)}`}
          </p>
        </Reveal>
      )}

      {state.status === 'error' && <ResultsNote>Classement indisponible pour le moment.</ResultsNote>}

      {state.status === 'loading' && (
        <ol aria-hidden className="mt-10 grid grid-cols-2 gap-px bg-[var(--grid-line)] lg:grid-cols-3">
          {Array.from({ length: TOP_FINISHERS }, (_, i) => (
            <li key={i} className="bg-void p-5 sm:p-6">
              <span className="block h-[clamp(2.25rem,5vw,3.5rem)] w-10 animate-pulse bg-carbon-800" />
              <span className="mt-5 block h-4 w-3/4 animate-pulse bg-carbon-800" />
              <span className="mt-2 block h-2.5 w-1/3 animate-pulse bg-carbon-800" />
            </li>
          ))}
        </ol>
      )}

      {state.status === 'ready' && (
        <ol className="mt-10 grid grid-cols-2 gap-px bg-[var(--grid-line)] lg:grid-cols-3">
          {topFinishers(state.race.Results, colours).map((f, i) => (
            <Reveal as="li" key={f.driverId} delay={Math.min(i * 45, 225)}>
              <FinisherCard finisher={f} />
            </Reveal>
          ))}
        </ol>
      )}
    </section>
  )
}

function FinisherCard({ finisher: f }: { finisher: Finisher }) {
  return (
    <div className="relative flex h-full flex-col gap-5 bg-void p-5 sm:p-6">
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: f.colour }} />

      <div className="flex items-baseline justify-between gap-3">
        <span
          className={`tabular display text-[clamp(2.25rem,5vw,3.5rem)] ${f.position === 1 ? 'text-accent' : ''}`}
        >
          <span className="sr-only">Position </span>
          {f.position}
        </span>
        <span className="tabular tech text-right text-carbon-300">{f.gap}</span>
      </div>

      <div className="mt-auto">
        <p className="text-[1.05rem] leading-snug">
          <span className="text-carbon-300">{f.firstName} </span>
          {f.lastName}
        </p>
        <p className="tech mt-1 text-carbon-500">{f.team}</p>
      </div>
    </div>
  )
}
