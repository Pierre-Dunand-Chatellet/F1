import { motion, useMotionTemplate, useSpring } from 'framer-motion'
import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { useReducedMotion, useReveal } from '../lib/hooks.ts'

/** Apparition au scroll. L'animation est en CSS (voir [data-reveal] dans index.css). */
export function Reveal({
  children,
  delay = 0,
  as: Tag = 'div',
  className,
}: {
  children: ReactNode
  delay?: number
  as?: 'div' | 'li' | 'section' | 'article' | 'p'
  className?: string
}) {
  const ref = useReveal<HTMLDivElement>()

  return (
    <Tag
      ref={ref as never}
      data-reveal=""
      className={className}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  )
}

/** En-tete de section : numero, titre display, filet. */
export function SectionHeader({
  index,
  title,
  lede,
  as: Heading = 'h2',
}: {
  index: string
  title: string
  lede?: string
  /** 'h1' pour le titre principal d'une page qui n'a pas de hero (une seule fois par page). */
  as?: 'h1' | 'h2'
}) {
  return (
    <header className="border-t border-[var(--grid-line)] pt-6">
      <Reveal>
        <p className="tech text-accent">{index}</p>
      </Reveal>
      <Reveal delay={60}>
        <Heading className="display mt-4 text-[clamp(2.5rem,7vw,5.5rem)]">{title}</Heading>
      </Reveal>
      {lede && (
        <Reveal delay={120}>
          <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-carbon-300">{lede}</p>
        </Reveal>
      )}
    </header>
  )
}

/** Chiffre mis en avant, chasse fixe pour eviter le tressautement. */
export function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="tech text-carbon-300">{label}</p>
      <p
        className={`tabular display mt-1.5 text-[clamp(1.4rem,3vw,2.2rem)] ${
          accent ? 'text-accent' : ''
        }`}
      >
        {value}
      </p>
    </div>
  )
}

/**
 * Attraction magnetique du curseur. Purement decoratif : desactive au clavier,
 * sur ecran tactile et en mouvement reduit. Le ressort evite l'effet "colle au
 * pixel" d'un suivi direct de la souris.
 */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  const spring = { stiffness: 220, damping: 18, mass: 0.6 }
  const x = useSpring(0, spring)
  const y = useSpring(0, spring)
  // Chaine transform complete : les raccourcis x/y de framer-motion passent par
  // le main thread et sautent des frames quand le navigateur charge.
  const transform = useMotionTemplate`translate3d(${x}px, ${y}px, 0)`

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      if (reduced) return
      const box = e.currentTarget.getBoundingClientRect()
      x.set((e.clientX - (box.left + box.width / 2)) * 0.25)
      y.set((e.clientY - (box.top + box.height / 2)) * 0.25)
    },
    [reduced, x, y],
  )

  const reset = useCallback(() => {
    x.set(0)
    y.set(0)
  }, [x, y])

  return (
    <span onMouseMove={onMove} onMouseLeave={reset} className={`inline-block ${className ?? ''}`}>
      <motion.span style={reduced ? undefined : { transform }} className="inline-block">
        {children}
      </motion.span>
    </span>
  )
}

/** Filets verticaux de fond : la grille technique, discrete. */
export function GridLines() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="mx-auto flex h-full max-w-[1600px] justify-between px-[var(--gutter)]">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="w-px bg-[var(--grid-line)]" />
        ))}
      </div>
    </div>
  )
}
