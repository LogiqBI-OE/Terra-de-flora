// Drawer: panel que entra desde la derecha. Overlay oscuro detrás.
// Cierra con click en overlay, X, o Esc.
//
// Se renderiza via createPortal en document.body para escapar cualquier
// stacking context / overflow del padre. Esto garantiza que position:fixed
// cubra el viewport completo (top:0 to bottom:0, sin huecos).

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}

export default function Drawer({ open, onClose, title, children, footer, width = 520 }: Props) {
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    if (!open) {
      setAnimateIn(false)
      return
    }
    // doble RAF: garantiza que React/Browser ya pintó con translateX(100%)
    // antes de aplicar translateX(0) y por tanto la transición se vea.
    const r1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimateIn(true))
    })
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(r1)
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const content = (
    <>
      {/* Overlay — cubre 100% del viewport */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          opacity: animateIn ? 1 : 0,
          transition: 'opacity 0.2s ease',
          zIndex: 90,
        }}
      />
      {/* Panel — pegado a top:0 / bottom:0 a la derecha */}
      <aside
        role="dialog"
        aria-label={title}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width,
          maxWidth: '100vw',
          background: 'var(--bg-page-2)',
          borderLeft: '1px solid var(--border)',
          transform: animateIn ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 100,
          boxShadow: '-16px 0 40px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
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

  return createPortal(content, document.body)
}
