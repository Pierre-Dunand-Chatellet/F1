import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useRef, useState } from 'react'
import { TrackMap } from '../components/TrackMap.tsx'
import { Reveal, SectionHeader } from '../components/ui.tsx'
import { localise } from '../data/labels.ts'
import { FALLBACK_COLOURS, TEAM_SHORT } from '../data/teams.ts'
import { useRaceResults } from '../lib/api.ts'
import { useNow, useReducedMotion } from '../lib/hooks.ts'
import {
  buildWeekend,
  isSprintWeekend,
  nextRace,
  raceStart,
  resultGap,
  splitDuration,
} from '../lib/season.ts'
import type { Race, RaceResult, WeekendSession } from '../lib/types.ts'

const pad = (n: number) => String(n).padStart(2, '0')

// Les horaires arrivent en UTC : on les rend dans le fuseau du visiteur.
const dateFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

export function Calendar({ races }: { races: Race[] }) {
  // Horloge lente : cette liste sert seulement a savoir quels GP sont passes.
  // La faire battre a la seconde re-rendrait 23 lignes par seconde pour rien —
  // le compte a rebours a sa propre horloge, a l'interieur de NextRace.
  const now = useNow(true, 60_000)
  const upcoming = nextRace(races, new Date(now))
  const listRef = useRef<HTMLOListElement>(null)
  const reduced = useReducedMotion()
  const [openRounds, setOpenRounds] = useState<string[]>([])

  // Sur telephone, un seul GP deroule a la fois : deux fiches ouvertes font
  // plusieurs ecrans de haut et on perd la liste. Sur grand ecran, on laisse
  // comparer. Lu au clic plutot qu'en hook : aucun rendu ne depend de la largeur.
  const toggle = (round: string) =>
    setOpenRounds((rounds) =>
      rounds.includes(round)
        ? rounds.filter((r) => r !== round)
        : window.matchMedia('(max-width: 767px)').matches
          ? [round]
          : [...rounds, round],
    )

  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ['start 80%', 'end 60%'],
  })
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 })

  return (
    <section id="calendrier" className="relative px-[var(--gutter)] py-[12vh]">
      <SectionHeader
        as="h1"
        index="02 — Saison"
        title="Calendrier"
        lede="Vingt-trois Grands Prix, six week-ends sprint. Les horaires sont convertis dans votre fuseau."
      />

      {upcoming && <NextRace race={upcoming} />}

      <ol ref={listRef} className="relative mt-16">
        {/* Rail de progression : rempli par le scroll, ancre en haut. */}
        <span aria-hidden className="absolute bottom-0 left-0 top-0 w-px bg-[var(--grid-line)]" />
        <motion.span
          aria-hidden
          style={{ scaleY: reduced ? 1 : fill, transformOrigin: 'top' }}
          className="absolute bottom-0 left-0 top-0 w-px bg-accent"
        />

        {races.map((race) => (
          <RaceRow
            key={race.round}
            race={race}
            past={(raceStart(race)?.getTime() ?? 0) < now}
            next={race.round === upcoming?.round}
            open={openRounds.includes(race.round)}
            onToggle={() => toggle(race.round)}
          />
        ))}
      </ol>
    </section>
  )
}

export function NextRace({ race }: { race: Race }) {
  // Horloge rapide confinee ici : seul ce bloc se re-rend chaque seconde.
  const now = useNow()
  const start = raceStart(race)
  const left = start ? splitDuration(start.getTime() - now) : null
  const label = localise(race)

  return (
    <Reveal>
      <div
        className="mt-14 grid items-center gap-10 border-y border-[var(--grid-line)] py-10 md:grid-cols-[1fr_minmax(0,22rem)]"
      >
        <div>
          <p className="tech text-accent">Prochain Grand Prix · Manche {race.round}</p>
          <h3 className="display mt-4 text-[clamp(2rem,5.5vw,4rem)]">{label.name}</h3>
          <p className="mt-3 text-carbon-300">
            {race.Circuit.circuitName} — {label.locality}, {label.country}
          </p>

          {left && (
            <div className="tabular display mt-8 flex gap-6 text-[clamp(1.6rem,4vw,2.6rem)]">
              <Unit value={left.d} label="jours" />
              <Unit value={left.h} label="heures" />
              <Unit value={left.m} label="min" />
              <Unit value={left.s} label="sec" accent />
            </div>
          )}
        </div>

        <TrackMap
          circuitId={race.Circuit.circuitId}
          className="aspect-square w-full"
        />
      </div>
    </Reveal>
  )
}

function Unit({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  return (
    <span className="flex flex-col">
      <span className={accent ? 'text-accent' : ''}>{pad(value)}</span>
      <span className="tech mt-1 text-carbon-500">{label}</span>
    </span>
  )
}

function RaceRow({
  race,
  past,
  next,
  open,
  onToggle,
}: {
  race: Race
  past: boolean
  next: boolean
  open: boolean
  onToggle: () => void
}) {
  const rowRef = useRef<HTMLLIElement>(null)
  const results = useRaceResults(race.round, open && past)
  const weekend = buildWeekend(race)
  const start = raceStart(race)
  const label = localise(race)

  return (
    <li ref={rowRef} className="scroll-mt-[var(--nav-h)] border-b border-[var(--grid-line)]">
      <button
        onClick={() => {
          onToggle()
          if (open) return
          // Si la fiche refermee etait au-dessus, la ligne cliquee remonte hors
          // de l'ecran : on la ramene sous la barre une fois le repli fini.
          window.setTimeout(() => {
            const top = rowRef.current?.getBoundingClientRect().top ?? 0
            if (top < 0) rowRef.current?.scrollIntoView({ block: 'start' })
          }, 320)
        }}
        aria-expanded={open}
        className={`pressable flex w-full items-center gap-5 py-5 pl-7 text-left transition-opacity duration-200 ${
          // Un GP passe est estompe — sauf quand on vient de l'ouvrir pour le lire.
          past && !next && !open ? 'opacity-40' : ''
        }`}
      >
        <span className="tabular tech w-8 shrink-0 text-carbon-500">{race.round}</span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[1.05rem]">{label.name}</span>
          <span className="tech text-carbon-500">
            {label.locality} · {label.country}
          </span>
        </span>

        {isSprintWeekend(race) && (
          <span className="tech hidden shrink-0 border border-accent px-2 py-0.5 text-accent sm:block">
            Sprint
          </span>
        )}

        <span className="tabular tech hidden shrink-0 text-carbon-300 sm:block">
          {start ? dateFmt.format(start) : '—'}
        </span>

        <ChevronDown
          size={18}
          strokeWidth={1.5}
          aria-hidden
          className="shrink-0 text-carbon-500 transition-transform duration-200 ease-out"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="grid gap-8 pb-10 pl-7 pt-2 md:grid-cols-[minmax(0,24rem)_1fr]">
              <TrackMap
                circuitId={race.Circuit.circuitId}
                showCorners
                className="aspect-square w-full"
              />
              {/* Course passee : le classement remplace un programme devenu inutile. */}
              {past ? <Results results={results} /> : <Weekend sessions={weekend} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

function Weekend({ sessions }: { sessions: WeekendSession[] }) {
  return (
    <div>
      <p className="tech text-carbon-300">Programme du week-end</p>
      <ul className="mt-4 space-y-px bg-[var(--grid-line)]">
        {sessions.map((s) => (
          <li key={s.label} className="flex items-baseline justify-between gap-4 bg-void py-3">
            <span className={s.kind === 'race' ? 'text-ink' : 'text-carbon-300'}>{s.label}</span>
            <span className="tabular text-sm text-carbon-300">
              {s.start ? `${dateFmt.format(s.start)} · ${timeFmt.format(s.start)}` : 'horaire à venir'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Results({ results }: { results: RaceResult[] | null | 'erreur' }) {
  if (results === null) return <p className="tech text-carbon-500">Chargement du classement…</p>
  if (results === 'erreur')
    return <p className="tech text-carbon-500">Classement indisponible pour le moment.</p>
  if (results.length === 0)
    return <p className="tech text-carbon-500">Classement pas encore publié.</p>

  const winnerLaps = Number(results[0]?.laps ?? 0)

  return (
    <div>
      <p className="tech text-carbon-300">Classement de la course</p>
      <ol className="mt-4 space-y-px bg-[var(--grid-line)]">
        {results.map((r) => {
          const classified = /^\d+$/.test(r.positionText)
          return (
            <li key={r.Driver.driverId} className="flex items-center gap-4 bg-void py-2.5">
              <span
                className={`tabular tech w-6 shrink-0 text-right ${
                  r.position === '1' ? 'text-accent' : 'text-carbon-300'
                }`}
              >
                {classified ? r.positionText : '—'}
              </span>
              <span
                aria-hidden
                className="h-4 w-[3px] shrink-0"
                style={{ background: FALLBACK_COLOURS[r.Constructor.constructorId] ?? '#8A8F98' }}
              />
              <span className="min-w-0 flex-1 truncate">
                <span className="hidden text-carbon-300 sm:inline">{r.Driver.givenName} </span>
                {r.Driver.familyName}
                <span className="tech ml-2 hidden text-carbon-500 sm:inline">
                  {TEAM_SHORT[r.Constructor.constructorId] ?? r.Constructor.name}
                </span>
                {r.FastestLap?.rank === '1' && (
                  <span className="tech ml-2 text-accent" title="Meilleur tour en course">
                    MT
                  </span>
                )}
              </span>
              <span className="tabular shrink-0 text-sm text-carbon-300">{resultGap(r, winnerLaps)}</span>
              <span className="tabular tech w-12 shrink-0 text-right text-carbon-500">
                {Number(r.points) > 0 ? `+${r.points}` : ''}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
