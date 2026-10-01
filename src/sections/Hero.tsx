import { GridLines } from '../components/ui.tsx'
import { nextRace } from '../lib/season.ts'
import type { Race } from '../lib/types.ts'
import { NextRace } from './Calendar.tsx'

export function Hero({ races }: { races: Race[] }) {
  const upcoming = nextRace(races)

  return (
    <section id="hero" className="relative flex min-h-[100svh] flex-col justify-between">
      <GridLines />

      <div className="relative px-[var(--gutter)] pt-[22vh]">
        <p className="tech text-accent line-mask">
          <span style={{ '--line-delay': '80ms' } as React.CSSProperties}>
            Championnat du monde FIA · Saison {new Date().getFullYear()}
          </span>
        </p>

        <h1 className="display mt-6 text-[clamp(1.9rem,10vw,11.5rem)]">
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

      {/* Le prochain Grand Prix ferme le premier ecran, a la place de l'ancien
          bandeau de chiffres : compte a rebours et trace au meme endroit. */}
      {upcoming && (
        <div className="relative px-[var(--gutter)]">
          <NextRace race={upcoming} />
        </div>
      )}
    </section>
  )
}
