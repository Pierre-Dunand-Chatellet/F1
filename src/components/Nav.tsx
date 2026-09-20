import { useLayoutEffect, useRef, useState } from 'react'
import { ROUTES, currentRoute, href } from '../lib/routes.ts'

/**
 * Indicateur de page active.
 *
 * La liste est dupliquee : la copie est peinte en rouge par-dessus l'originale,
 * puis masquee au clip-path sur le seul element actif. Animer `color` d'un
 * element a l'autre donnerait deux teintes qui se croisent a mi-chemin ; ici la
 * couleur ne change jamais, c'est la fenetre qui glisse.
 */
export function Nav() {
  const items = useRef<(HTMLAnchorElement | null)[]>([])
  const list = useRef<HTMLUListElement>(null)
  const [clip, setClip] = useState('inset(0 100% 0 0)')

  useLayoutEffect(() => {
    const measure = () => {
      const active = currentRoute()
      const index = active ? ROUTES.indexOf(active) : -1
      const box = list.current

      // Sur l'accueil, aucune entree n'est active : la fenetre reste fermee.
      if (index < 0 || !box) {
        setClip('inset(0 100% 0 0)')
        return
      }

      const el = items.current[index]
      if (!el) return

      const left = el.offsetLeft
      const right = box.offsetWidth - (el.offsetLeft + el.offsetWidth)
      setClip(`inset(-50% ${right}px -50% ${left}px)`)
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-[var(--grid-line)] bg-void/80 backdrop-blur-md">
      <div className="flex h-[var(--nav-h)] items-center justify-between px-[var(--gutter)]">
        <a href={href('')} className="tech pressable text-ink" aria-label="Accueil">
          F1<span className="text-accent">.</span>
        </a>

        <div className="relative">
          <ul ref={list} className="flex gap-6">
            {ROUTES.map((route, i) => (
              <li key={route.path}>
                <a
                  ref={(el) => {
                    items.current[i] = el
                  }}
                  href={href(route.path)}
                  className="tech pressable block text-carbon-300"
                >
                  {route.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Copie active, decoupee sur l'entree courante. */}
          <ul
            aria-hidden
            className="pointer-events-none absolute inset-0 flex gap-6 text-accent"
            style={{ clipPath: clip, transition: 'clip-path 0.3s var(--ease-in-out)' }}
          >
            {ROUTES.map((route) => (
              <li key={route.path}>
                <span className="tech block">{route.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}
