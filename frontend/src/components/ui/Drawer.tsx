// Drawer: panel que entra desde la derecha. Overlay oscuro detrás.
// Cierra con click en overlay, X, o Esc.
//
// Layout:
//   - position: fixed, top:0 + bottom:0 garantiza ocupar 100% del viewport
//     (h-full / height:100% falla en algunos contextos)
//   - flex-col: header (shrink-0) + body (flex-1 + min-h-0 + overflow-y-auto)
//     + footer (shrink-0). El footer queda pegado al fondo del PANEL, no del
//     viewport, así "se siente" anclado al contenido.

import { useEffect, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}

export default function Drawer({ open, onClose, title, children, footer, width = 520 }: Props) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onEsc)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 transition-opacity"
        style={{
          background: 'rgba(0, 0, 0, 0.45)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          zIndex: 90,
        }}
      />

      <aside
        role="dialog"
        aria-label={title}
        className="fixed right-0 top-0 bottom-0 border-l flex flex-col overflow-hidden transition-transform"
        style={{
          width,
          maxWidth: '100vw',
          background: 'var(--bg-page-2)',
          borderColor: 'var(--border)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          zIndex: 100,
          boxShadow: open ? '-16px 0 40px rgba(0, 0, 0, 0.25)' : 'none',
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

        {/* Body — min-h-0 es CRÍTICO para que flex-1 + overflow funcionen */}
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
