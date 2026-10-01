import { motion, useMotionTemplate, useScroll, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Reveal, SectionHeader } from '../components/ui.tsx'
import { ARCHIVE } from '../data/archive.ts'
import { ERAS, type Era } from '../data/eras.ts'
import { useReducedMotion } from '../lib/hooks.ts'
import { href } from '../lib/routes.ts'

/**
 * Frise horizontale pilotee par le scroll vertical. La section est haute ;
 * on la maintient collee et on translate la piste a l'interieur.
 *
 * En mouvement reduit, le defilement lateral force est desagreable et
 * desorientant : on retombe alors sur un empilement vertical classique.
 */
export function History() {
  const reduced = useReducedMotion()
  return (
    <>
      {reduced ? <HistoryStacked /> : <HistoryScroller />}
      <ArchiveStrip />
    </>
  )
}

/**
 * Bande d'archives. Deux photos seulement, et c'est assume : ce sont les seules
 * dont le sujet a ete verifie (voir src/data/archive.ts). Mieux vaut deux
 * images justes qu'une illustration par epoque dont la moitie serait a cote.
 */
function ArchiveStrip() {
  return (
    <section className="px-[var(--gutter)] pb-[12vh]">
      <p className="tech border-t border-[var(--grid-line)] pt-6 text-carbon-300">Archives</p>

      <ul className="mt-8 grid gap-10 sm:grid-cols-2">
        {ARCHIVE.map((photo, i) => (
          <Reveal as="li" key={photo.src} delay={i * 80}>
            <figure>
              <img
                // Resolu contre la base : un chemin relatif pointerait vers
                // /f1/histoire/img/… puisque cette section a sa propre page.
                src={href(photo.src)}
                alt={photo.alt}
                width={1280}
                height={photo.src.includes('pionniers') ? 1000 : 844}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full bg-carbon-900 object-cover"
              />
              <figcaption className="mt-3">
                <span className="block text-sm text-carbon-300">{photo.caption}</span>
                <a
                  href={photo.source}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="tech mt-1 inline-block text-carbon-500 transition-colors duration-150 hover:text-accent"
                >
                  {photo.credit} · {photo.licence}
                </a>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}

function HistoryScroller() {
  const ref = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [travel, setTravel] = useState(0)

  // Distance reelle a parcourir : largeur de la piste moins celle de l'ecran.
  // Mesuree plutot que devinee, pour que la frise s'arrete pile a la fin.
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const measure = () => setTravel(Math.max(0, track.scrollWidth - window.innerWidth))
    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(track)
    window.addEventListener('resize', measure)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 110, damping: 26, mass: 0.4 })
  const x = useTransform(smooth, [0, 1], [0, -travel])
  // Chaine transform complete : les raccourcis x/y de framer-motion ne sont pas
  // accelere materiellement et sautent des frames sous charge.
  const transform = useMotionTemplate`translate3d(${x}px, 0, 0)`
  const progress = useTransform(smooth, [0, 1], ['0%', '100%'])

  return (
    <section id="histoire" ref={ref} style={{ height: `${ERAS.length * 70}vh` }} className="relative">
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden py-10">
        {/* En-tete compact : dans un conteneur colle a la hauteur de l'ecran,
            chaque pixel pris ici est un pixel retire aux panneaux. */}
        <header className="shrink-0 px-[var(--gutter)]">
          <p className="tech text-accent">03 — Archives</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <h1 className="display text-[clamp(1.5rem,3.6vw,2.6rem)]">Soixante-quinze ans</h1>
            <p className="text-sm text-carbon-300">
              Chaque époque tient dans une rupture technique et un duel.
            </p>
          </div>
        </header>

        {/* La piste prend toute la hauteur restante : les panneaux s'y ajustent
            au lieu de deborder d'une hauteur devinee en vh. */}
        <motion.div
          ref={trackRef}
          style={{ transform }}
          className="mt-8 flex min-h-0 flex-1 gap-px pl-[var(--gutter)]"
        >
          {ERAS.map((era) => (
            <EraPanel key={era.id} era={era} />
          ))}
        </motion.div>

        <div aria-hidden className="mx-[var(--gutter)] mt-8 h-px shrink-0 bg-[var(--grid-line)]">
          <motion.div style={{ width: progress }} className="h-px bg-accent" />
        </div>
      </div>
    </section>
  )
}

function HistoryStacked() {
  return (
    <section id="histoire" className="px-[var(--gutter)] py-[12vh]">
      <SectionHeader
        as="h1"
        index="03 — Archives"
        title="Soixante-quinze ans"
        lede="Chaque époque de la Formule 1 tient dans une rupture technique et un duel."
      />
      <div className="mt-12 space-y-px">
        {ERAS.map((era) => (
          <EraPanel key={era.id} era={era} stacked />
        ))}
      </div>
    </section>
  )
}

function EraPanel({ era, stacked }: { era: Era; stacked?: boolean }) {
  return (
    <article
      className={`flex shrink-0 flex-col justify-between overflow-hidden border-l border-[var(--grid-line)] bg-void p-7 ${
        stacked ? 'w-full' : 'h-full w-[min(90vw,34rem)]'
      }`}
    >
      <div>
        <p className="tabular tech text-accent">{era.years}</p>
        <h3 className="display mt-3 text-[clamp(1.3rem,2.6vw,1.9rem)]">{era.title}</h3>

        <dl className="mt-4 space-y-2 border-y border-[var(--grid-line)] py-3">
          <div>
            <dt className="tech text-carbon-500">Rupture</dt>
            <dd className="mt-1 text-sm text-carbon-300">{era.breakthrough}</dd>
          </div>
          <div>
            <dt className="tech text-carbon-500">Duel</dt>
            <dd className="mt-1 text-sm text-carbon-300">{era.rivalry}</dd>
          </div>
        </dl>

        <p className="mt-4 text-[0.82rem] leading-[1.5] text-carbon-300">{era.text}</p>
      </div>

      <p className="mt-5 shrink-0">
        <span className="tabular display block text-[clamp(2rem,4.5vw,3rem)] text-accent">
          {era.figure.value}
        </span>
        <span className="tech mt-1 block text-carbon-500">{era.figure.label}</span>
      </p>
    </article>
  )
}
