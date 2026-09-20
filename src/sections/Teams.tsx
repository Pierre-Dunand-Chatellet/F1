import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Reveal, SectionHeader, Stat } from '../components/ui.tsx'
import { nationality } from '../data/labels.ts'
import type { Team } from '../lib/types.ts'

// Ressort plutot que duree fixe : si on ouvre puis ferme aussitot, l'animation
// repart de sa position courante avec sa velocite, sans repartir de zero.
const SPRING = { type: 'spring', duration: 0.5, bounce: 0.15 } as const

export function Teams({ teams }: { teams: Team[] }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const open = teams.find((t) => t.constructorId === openId) ?? null

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <section id="ecuries" className="relative px-[var(--gutter)] py-[12vh]">
      <SectionHeader
        index="01 — Grille"
        title="Écuries"
        lede="Onze constructeurs au championnat. Classement, palmarès et pilotes engagés, mis à jour à chaque Grand Prix."
      />

      <ul className="mt-14 grid gap-px bg-[var(--grid-line)] sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team, i) => (
          <Reveal as="li" key={team.constructorId} delay={Math.min(i * 45, 360)}>
            <TeamCard team={team} onOpen={() => setOpenId(team.constructorId)} />
          </Reveal>
        ))}
      </ul>

      <AnimatePresence>
        {open && <TeamDetail team={open} onClose={() => setOpenId(null)} />}
      </AnimatePresence>
    </section>
  )
}

function TeamCard({ team, onOpen }: { team: Team; onOpen: () => void }) {
  return (
    <motion.button
      layoutId={`team-${team.constructorId}`}
      transition={SPRING}
      onClick={onOpen}
      aria-label={`Fiche de l'écurie ${team.name}`}
      className="pressable hover-rise group relative flex h-full w-full flex-col items-start gap-6 bg-void p-6 text-left"
    >
      <motion.span
        layoutId={`livery-${team.constructorId}`}
        transition={SPRING}
        style={{ background: team.colour }}
        className="absolute inset-y-0 left-0 w-[3px]"
      />

      <div className="flex w-full items-baseline justify-between">
        <span className="tabular tech text-carbon-300">P{team.position}</span>
        <span className="tabular tech text-carbon-300">{team.points} pts</span>
      </div>

      <motion.h3
        layoutId={`name-${team.constructorId}`}
        transition={SPRING}
        className="display text-[clamp(1.5rem,3.2vw,2.25rem)]"
      >
        {team.name}
      </motion.h3>

      <ul className="mt-auto w-full space-y-1.5">
        {team.drivers.map((d) => (
          <li key={d.driverId} className="flex items-baseline justify-between text-sm">
            <span>
              <span className="text-carbon-300">{d.firstName} </span>
              {d.lastName}
            </span>
            <span className="tabular tech text-carbon-500">{d.number ?? '—'}</span>
          </li>
        ))}
      </ul>
    </motion.button>
  )
}

function TeamDetail({ team, onClose }: { team: Team; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Sans ca, l'ouverture laisse le focus sur la carte, derriere la surcouche :
  // au clavier, la fiche est invisible et Echap est le seul recours.
  // A la fermeture, le focus revient sur la carte d'ou l'on vient.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => previous?.focus?.()
  }, [])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-void/85 backdrop-blur-sm"
      />

      <motion.div
        layoutId={`team-${team.constructorId}`}
        transition={SPRING}
        role="dialog"
        aria-modal="true"
        aria-label={team.name}
        className="relative w-full max-w-2xl overflow-hidden border border-carbon-700 bg-carbon-900 p-8"
      >
        <motion.span
          layoutId={`livery-${team.constructorId}`}
          transition={SPRING}
          style={{ background: team.colour }}
          className="absolute inset-y-0 left-0 w-[3px]"
        />

        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Fermer"
          className="pressable absolute right-5 top-5 text-carbon-300 transition-colors duration-150 hover:text-ink"
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        <p className="tech text-carbon-300">{nationality(team.nationality)}</p>
        <motion.h3
          layoutId={`name-${team.constructorId}`}
          transition={SPRING}
          className="display mt-3 text-[clamp(2rem,6vw,3.5rem)]"
        >
          {team.name}
        </motion.h3>

        <div className="mt-8 grid grid-cols-3 gap-6 border-t border-[var(--grid-line)] pt-6">
          <Stat label="Championnat" value={`P${team.position}`} accent />
          <Stat label="Points" value={String(team.points)} />
          <Stat label="Victoires" value={String(team.wins)} />
        </div>

        <ul className="mt-8 space-y-px bg-[var(--grid-line)]">
          {team.drivers.map((d) => (
            <li key={d.driverId} className="flex items-center gap-5 bg-carbon-900 py-4">
              <span
                className="tabular display w-16 text-[2rem] leading-none"
                style={{ color: team.colour }}
              >
                {d.number ?? '--'}
              </span>
              <span className="flex-1">
                <span className="block text-base">
                  <span className="text-carbon-300">{d.firstName} </span>
                  {d.lastName}
                </span>
                <span className="tech text-carbon-500">
                  {d.code} · {nationality(d.nationality)}
                  {d.otherTeams.length > 0 && ` · aussi ${d.otherTeams.join(', ')}`}
                </span>
              </span>
              <span className="text-right">
                <span className="tabular block text-base">P{d.position}</span>
                <span className="tech text-carbon-500">{d.points} pts</span>
              </span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  )
}
