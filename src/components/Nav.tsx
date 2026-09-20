import { useLayoutEffect, useRef, useState } from 'react'
import { useActiveSection } from '../lib/hooks.ts'

const LINKS = [
  { id: 'ecuries', label: 'Écuries' },
  { id: 'calendrier', label: 'Calendrier' },
  { id: 'histoire', label: 'Histoire' },
]
// 'hero' est observe sans etre un lien : sinon l'indicateur s'allume sur la
// premiere section alors qu'on est encore en haut de page.
const IDS = ['hero', ...LINKS.map((l) => l.id)]

/**
 * Indicateur de section actif.
 *
 * La liste est dupliquee : la copie est peinte en rouge par-dessus l'originale,
 * puis masquee au clip-path sur le seul element actif. Animer `color` d'un
 * element a l'autre donnerait deux teintes qui se croisent a mi-chemin ; ici la
 * couleur ne change jamais, c'est la fenetre qui glisse.
 */
export function Nav() {
  const active = useActiveSection(IDS)
  const items = useRef<(HTMLAnchorElement | null)[]>([])
  const list = useRef<HTMLUListElement>(null)
  const [clip, setClip] = useState('inset(0 100% 0 0)')

  useLayoutEffect(() => {
    const measure = () => {
      const index = LINKS.findIndex((l) => l.id === active)
      const box = list.current
      if (index < 0) {
        setClip('inset(0 100% 0 0)')
        return
      }
      const el = items.current[index]
      if (!el || !box) return

      const left = el.offsetLeft
      const right = box.offsetWidth - (el.offsetLeft + el.offsetWidth)
      setClip(`inset(-50% ${right}px -50% ${left}px)`)
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [active])

  return (
    <nav className="fixed inset-x-0 top-0 z-40 border-b border-[var(--grid-line)] bg-void/80 backdrop-blur-md">
      <div className="flex h-[var(--nav-h)] items-center justify-between px-[var(--gutter)]">
        <a href="#hero" className="tech pressable text-ink">
          F1<span className="text-accent">.</span>
        </a>

        <div className="relative">
          <ul ref={list} className="flex gap-6">
            {LINKS.map((link, i) => (
              <li key={link.id}>
                <a
                  ref={(el) => {
                    items.current[i] = el
                  }}
                  href={`#${link.id}`}
                  className="tech pressable block text-carbon-300"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Copie active, decoupee sur l'element courant. */}
          <ul
            aria-hidden
            className="pointer-events-none absolute inset-0 flex gap-6 text-accent"
            style={{ clipPath: clip, transition: 'clip-path 0.3s var(--ease-in-out)' }}
          >
            {LINKS.map((link) => (
              <li key={link.id}>
                <span className="tech block">{link.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}
