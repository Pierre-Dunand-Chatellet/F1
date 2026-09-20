import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

/** Amorce commune aux quatre pages : meme racine, memes styles. */
export function mount(node: ReactNode): void {
  const root = document.getElementById('root')
  if (!root) throw new Error('Element #root introuvable')
  createRoot(root).render(<StrictMode>{node}</StrictMode>)
}
