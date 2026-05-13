// Drawer: panel que entra desde la derecha. Overlay oscuro detrás.
// Cierra con click en overlay, X, o Esc.
//
// Posicionamiento 100% explícito (vía style, no clases) para garantizar
// cobertura completa del viewport. height/width: 100vw/100vh + position fixed.
// El estado `mounted` evita que el drawer se vea durante el primer paint
// (cuando aún no ha aplicado el `transform: translateX(0)`).

import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}

export default function Drawer({ open, onClose, title, children, footer, width = 520 }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!open) {
      setMounted(false)
      return
    }
    // doble RAF para asegurar que el transform inicial (translateX 100%)
    // se haya pintado ANTES de que pasemos a translateX(0) y haya transición real.
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => setMounted(true))
      return () => cancelAnimationFrame(r2)
    })
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(r1)
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.55)',
    opacity: mounted ? 1 : 0,
    transition: 'opacity 0.2s ease',
    zIndex: 90,
  }

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    width,
    maxWidth: '100vw',
    height: '100vh',
    background: 'var(--bg-page-2)',
    borderLeft: '1px solid var(--border)',
    transform: mounted ? 'translateX(0)' : 'translateX(100%)',
    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 100,
    boxShadow: '-16px 0 40px rgba(0, 0, 0, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  return (
    <>
      <div onClick={onClose} style={overlayStyle} />
      <aside role="dialog" aria-label={title} style={panelStyle}>
        <header
          className="shrink-0 px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          <h3 className="text-base font-semibold text-app">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="h-8 w-8 rounded-full flex items-center justify-center text-app-secondary hover:bg-[var(--bg-hover)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer
            className="shrink-0 px-5 py-3 border-t flex justify-end gap-2"
            style={{
              borderColor: 'var(--border-soft)',
              background: 'var(--bg-page-2)',
            }}
          >
            {footer}
          </footer>
        )}
      </aside>
    </>
  )
}
