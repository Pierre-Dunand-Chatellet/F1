import { motion, useMotionTemplate, useScroll, useTransform } from 'framer-motion'
import { useMemo, useRef } from 'react'
import { GridLines } from '../components/ui.tsx'
import { localise } from '../data/labels.ts'
import { useNow, useReducedMotion } from '../lib/hooks.ts'
import { sessionTimeline, splitDuration, upcomingIn } from '../lib/season.ts'
import type { Race } from '../lib/types.ts'

const pad = (n: number) => String(n).padStart(2, '0')

export function Hero({ races, round }: { races: Race[]; round: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const now = useNow()

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // Parallaxe contenue : 72px de course au total, assez pour donner de la
  // profondeur, trop peu pour qu'on la remarque consciemment.
  const shift = useTransform(scrollYProgress, [0, 1], [0, 72])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const transform = useMotionTemplate`translate3d(0, ${shift}px, 0)`

  // La frise est construite une fois par calendrier : le compte a rebours bat
  // la seconde, il ne doit pas recalculer 23 week-ends a chaque battement.
  const timeline = useMemo(() => sessionTimeline(races), [races])
  const upcoming = upcomingIn(timeline, now)
  const left = upcoming ? splitDuration(upcoming.t - now) : null

  return (
    <section ref={ref} id="hero" className="relative flex min-h-[100svh] flex-col justify-between">
      <GridLines />

      <div className="relative px-[var(--gutter)] pt-[22vh]">
        <p className="tech text-accent line-mask">
          <span style={{ '--line-delay': '80ms' } as React.CSSProperties}>
            Championnat du monde FIA · Saison {new Date().getFullYear()}
          </span>
        </p>

        <h1 className="display mt-6 text-[clamp(3.5rem,15vw,13rem)]">
          <span className="line-mask">
            <span style={{ '--line-delay': '160ms' } as React.CSSProperties}>Formule</span>
          </span>
          <span className="line-mask">
            <span
              className="text-accent"
              style={{ '--line-delay': '240ms' } as React.CSSProperties}
            >
              Un
            </span>
          </span>
        </h1>

        <p className="line-mask mt-8 max-w-md text-[0.95rem] leading-relaxed text-carbon-300">
          <span style={{ '--line-delay': '380ms' } as React.CSSProperties}>
            Onze écuries, vingt-trois Grands Prix, soixante-quinze ans d'histoire. La saison en
            cours, mise à jour à chaque course.
          </span>
        </p>
      </div>

      {/* Bandeau télémétrique : la donnée brute, traitée comme un affichage de stand. */}
      <motion.div
        style={reduced ? undefined : { transform, opacity: fade }}
        className="relative border-t border-[var(--grid-line)] px-[var(--gutter)] py-6"
      >
        <dl className="flex flex-wrap items-end gap-x-12 gap-y-6">
          <Readout label="Manche" value={round ? `${round} / ${races.length}` : '—'} />
          <Readout label="Grands Prix" value={String(races.length)} />
          <Readout
            label={upcoming ? `Prochaine séance · ${upcoming.session.label}` : 'Saison'}
            value={
              left
                ? `${left.d}j ${pad(left.h)}:${pad(left.m)}:${pad(left.s)}`
                : 'Terminée'
            }
            accent
          />
          {upcoming && (
            <Readout label="Lieu" value={localise(upcoming.race).locality} />
          )}
        </dl>
      </motion.div>
    </section>
  )
}

function Readout({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="tech text-carbon-300">{label}</dt>
      <dd className={`tabular display mt-1.5 text-[clamp(1.1rem,2.4vw,1.75rem)] ${accent ? 'text-accent' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
