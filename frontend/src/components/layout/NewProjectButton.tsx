// CTA "Nuevo Proyecto" en el sidebar. Borde con color de acento.
// onClick navega a una ruta (cuando exista) o ejecuta callback.

import { IconPlus } from '../icons/Icons'

interface Props {
  onClick?: () => void
  label?: string
}

export default function NewProjectButton({ onClick, label = 'Nuevo Proyecto' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition group"
      style={{
        borderColor: 'var(--sidebar-active-text)',
        color: 'var(--sidebar-active-text)',
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--sidebar-active-bg)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <IconPlus size={16} />
      <span className="text-sm font-semibold">{label}</span>
    </button>
  )
}
