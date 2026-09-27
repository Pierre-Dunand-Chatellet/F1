import { useMemo } from 'react'
import { Reveal, SectionHeader } from '../components/ui.tsx'
import type { Team, TeamDriver } from '../lib/types.ts'

type Row = TeamDriver & { team: string; colour: string }

/** Au-dela, la liste ecrase le reste de l'accueil : la suite est repliee. */
const VISIBLE = 10

/**
 * Classement pilotes du championnat. Aucune requete en plus : il se deduit des
 * ecuries deja chargees, ou chaque pilote porte sa position et ses points.
 */
export function Classement({ teams, round }: { teams: Team[]; round: string }) {
  const rows = useMemo<Row[]>(
    () =>
      teams
        .flatMap((t) => t.drivers.map((d) => ({ ...d, team: t.name, colour: t.colour })))
        .sort((a, b) => a.position - b.position),
    [teams],
  )

  if (rows.length === 0) return null

  return (
    <section id="classement" className="px-[var(--gutter)] pt-[12vh]">
      <SectionHeader
        index="Championnat"
        title="Classement"
        lede={round ? `Pilotes, après la manche ${round}.` : 'Pilotes.'}
      />

      <Reveal>
        <ol className="mt-12 space-y-px bg-[var(--grid-line)]">
          {rows.slice(0, VISIBLE).map((r) => (
            <DriverRow key={r.driverId} row={r} />
          ))}
        </ol>

        {rows.length > VISIBLE && (
          <details className="group">
            <summary className="pressable tech cursor-pointer list-none py-5 text-carbon-300 transition-colors duration-150 hover:text-ink">
              <span className="group-open:hidden">Voir les {rows.length - VISIBLE} autres pilotes</span>
              <span className="hidden group-open:inline">Replier</span>
            </summary>
            <ol start={VISIBLE + 1} className="space-y-px bg-[var(--grid-line)]">
              {rows.slice(VISIBLE).map((r) => (
                <DriverRow key={r.driverId} row={r} />
              ))}
            </ol>
          </details>
        )}
      </Reveal>
    </section>
  )
}

function DriverRow({ row }: { row: Row }) {
  const leader = row.position === 1

  return (
    <li className="flex items-center gap-4 bg-void py-3.5">
      <span
        className={`tabular tech w-7 shrink-0 text-right ${leader ? 'text-accent' : 'text-carbon-300'}`}
      >
        {row.position}
      </span>
      <span aria-hidden className="h-5 w-[3px] shrink-0" style={{ background: row.colour }} />
      <span className="min-w-0 flex-1 truncate">
        <span className="hidden text-carbon-300 sm:inline">{row.firstName} </span>
        {row.lastName}
        <span className="tech ml-3 hidden text-carbon-500 sm:inline">{row.team}</span>
      </span>
      {row.wins > 0 && (
        <span className="tabular tech hidden shrink-0 text-carbon-500 sm:block">
          {row.wins} victoire{row.wins > 1 ? 's' : ''}
        </span>
      )}
      <span className={`tabular display w-16 shrink-0 text-right ${leader ? 'text-accent' : ''}`}>
        {row.points}
      </span>
    </li>
  )
}
