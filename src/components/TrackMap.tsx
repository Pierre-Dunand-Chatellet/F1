import { motion, type MotionValue } from 'framer-motion'
import { CIRCUIT_TRACES } from '../data/circuits.generated.ts'

/**
 * Trace vectoriel d'un circuit. `progress` pilote le dessin : soit une valeur
 * de scroll (MotionValue), soit rien — auquel cas le trace se dessine a
 * l'apparition.
 *
 * Un circuit sans geometrie (nouveau trace, aucune source) affiche un etat
 * vide honnete plutot qu'un trace inventé.
 */
export function TrackMap({
  circuitId,
  colour = 'var(--color-accent)',
  progress,
  showCorners = false,
  className,
}: {
  circuitId: string
  colour?: string
  progress?: MotionValue<number>
  showCorners?: boolean
  className?: string
}) {
  const trace = CIRCUIT_TRACES[circuitId]

  if (!trace) {
    return (
      <div
        className={`grid place-items-center border border-dashed border-carbon-700 ${className ?? ''}`}
      >
        <p className="tech max-w-[18ch] text-center text-carbon-500">
          Tracé vectoriel non publié pour ce circuit
        </p>
      </div>
    )
  }

  return (
    <svg viewBox="0 0 1000 1000" className={className} role="img" aria-label={`Tracé — ${trace.name}`}>
      {/* Trace fantome : le circuit reste lisible avant que le dessin ne passe. */}
      <path d={trace.path} fill="none" stroke="var(--grid-line)" strokeWidth={14} strokeLinejoin="round" />

      <motion.path
        d={trace.path}
        fill="none"
        stroke={colour}
        strokeWidth={14}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={progress ? { pathLength: progress } : undefined}
        initial={progress ? undefined : { pathLength: 0 }}
        animate={progress ? undefined : { pathLength: 1 }}
        transition={progress ? undefined : { duration: 1.4, ease: [0.77, 0, 0.175, 1] }}
      />

      {showCorners &&
        trace.corners.map((c) => (
          <g key={c.n}>
            <circle cx={c.x} cy={c.y} r={8} fill="var(--color-void)" stroke={colour} strokeWidth={4} />
            {/* Halo sombre sous le chiffre : sans lui, un numero pose sur le trace
                devient illisible des que la carte s'affiche en petit. */}
            <text
              x={c.x}
              y={c.y - 26}
              textAnchor="middle"
              className="tabular"
              fill="var(--color-ink)"
              stroke="var(--color-void)"
              strokeWidth={8}
              paintOrder="stroke"
              fontSize={42}
              fontWeight={500}
              fontFamily="var(--font-tech)"
            >
              {c.n}
            </text>
          </g>
        ))}
    </svg>
  )
}
