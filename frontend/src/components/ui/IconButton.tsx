// Botón circular para acciones de icono en la topbar (help, bell, etc.).
// Opcionalmente muestra un dot/indicator de notificación.

import type { ReactNode, MouseEvent } from 'react'

interface Props {
  icon: ReactNode
  label: string
  dot?: boolean
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
}

export default function IconButton({ icon, label, dot, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="relative h-9 w-9 rounded-full flex items-center justify-center transition"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      {dot && (
        <span
          className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      )}
    </button>
  )
}
