import { nextRace } from '../lib/season.ts'
import type { Race } from '../lib/types.ts'
import { NextRace } from './Calendar.tsx'

/**
 * Premier écran : le titre à gauche, et le prochain Grand Prix sur son badge
 * d'accréditation à droite, suspendu à son cordon (identité « pass paddock »).
 */
export function Hero({ races }: { races: Race[] }) {
  const upcoming = nextRace(races)
  const annee = new Date().getFullYear()

  return (
    <section
      id="hero"
      className="relative grid min-h-[100svh] items-center gap-12 px-[var(--gutter)] pb-16 pt-[calc(var(--nav-h)+4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)]"
    >
      <div>
        <p className="tech text-accent line-mask">
          <span style={{ '--line-delay': '80ms' } as React.CSSProperties}>
            Championnat du monde FIA, saison {annee}
          </span>
        </p>

        <h1 className="display mt-5 text-[clamp(3rem,8.5vw,8rem)]">
          <span className="line-mask">
            <span style={{ '--line-delay': '160ms' } as React.CSSProperties}>Formule 1,</span>
          </span>
          <span className="line-mask">
            <span style={{ '--line-delay': '240ms' } as React.CSSProperties}>saison {annee}</span>
          </span>
        </h1>

        <p className="line-mask mt-8 max-w-md text-[1.05rem] leading-relaxed text-carbon-300">
          <span style={{ '--line-delay': '380ms' } as React.CSSProperties}>
            Onze écuries, vingt-trois Grands Prix, soixante-quinze ans d'histoire. La saison en
            cours, mise à jour à chaque course.
          </span>
        </p>
      </div>

      {upcoming && <NextRace race={upcoming} />}
    </section>
  )
}
