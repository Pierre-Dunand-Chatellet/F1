import { useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'

/** Respecte le reglage systeme "reduire les animations", et suit ses changements. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/**
 * Defilement lisse. Lenis interpole le scroll dans une boucle rAF sur le main
 * thread : c'est un compromis assume, il rend la page plus douce au detriment
 * d'un peu de reactivite au trackpad. Desactive quand l'utilisateur demande
 * moins de mouvement — la, le scroll natif est le bon choix.
 */
export function useSmoothScroll(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 })
    let frame = 0

    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [enabled])
}

/**
 * Pose data-reveal="in" quand l'element entre dans le viewport, une seule fois.
 * L'animation elle-meme est en CSS : elle tourne hors main thread et ne saute
 * pas de frames pendant que les requetes API arrivent.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          el.dataset.reveal = 'in'
          io.disconnect()
        }
      },
      { rootMargin: '-64px 0px -10% 0px' },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return ref
}

/**
 * Horloge a la seconde pour les comptes a rebours.
 * Recalcule depuis Date.now() a chaque tick plutot que de decrementer : un
 * onglet en arriere-plan ralentit les timers, un compteur decremente derive.
 * Se met en pause quand l'onglet est cache, et se resynchronise au retour.
 */
export function useNow(active = true, everyMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!active) return

    let id: number | undefined

    const stop = () => {
      if (id !== undefined) window.clearInterval(id)
      id = undefined
    }
    // Idempotent : un evenement visibilitychange qui arrive alors que l'horloge
    // tourne deja laisserait sinon un intervalle orphelin a chaque bascule.
    const start = () => {
      stop()
      setNow(Date.now())
      id = window.setInterval(() => setNow(Date.now()), everyMs)
    }
    const onVisibility = () => (document.hidden ? stop() : start())

    start()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [active, everyMs])

  return now
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Enferme le focus dans un element modal, et le rend a son point de depart.
 *
 * Sans ca, une fiche ouverte laisse le focus sur la carte qui l'a declenchee :
 * au clavier, la fiche est inatteignable et Tab promene l'utilisateur dans une
 * page qu'il ne voit plus, derriere la surcouche.
 *
 * L'ecoute est posee sur le document, pas sur la boite : si le focus s'est
 * deja echappe, un ecouteur local ne se declencherait jamais.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!active) return
    const box = ref.current
    if (!box) return

    const previous = document.activeElement as HTMLElement | null
    const focusables = () => [...box.querySelectorAll<HTMLElement>(FOCUSABLE)]

    focusables()[0]?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const items = focusables()
      const first = items[0]
      const last = items.at(-1)
      if (!first || !last) {
        e.preventDefault()
        return
      }

      // Le focus a fui hors de la boite (clic ailleurs, ordre inattendu) : on le
      // ramene plutot que de laisser Tab continuer dans la page masquee.
      if (!box.contains(document.activeElement)) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
        return
      }

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [active])

  return ref
}

/** Suit la section visible pour l'indicateur de navigation. */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActive(visible.target.id)
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )

    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    }

    return () => io.disconnect()
  }, [ids])

  return active
}
