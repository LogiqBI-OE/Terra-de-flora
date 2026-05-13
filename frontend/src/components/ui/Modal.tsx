// Modal genérico centrado. Cierra con overlay click o Esc.
import { useEffect, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}

export default function Modal({ open, onClose, title, children, footer, width = 480 }: Props) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      onMouseDown={onClose}
    >
      <div
        className="rounded-xl border surface-menu w-full"
        style={{ maxWidth: width, borderColor: 'var(--border)' }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <h3 className="text-sm font-semibold text-app">{title}</h3>
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-soft)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
