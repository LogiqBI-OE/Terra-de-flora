// Tabs horizontales reutilizables. Usado en Drawer de Usuarios y en Catálogos.
// Controlado: el padre maneja el state del tab activo.

interface Tab<K extends string> {
  key: K
  label: string
  badge?: string | number
  disabled?: boolean
}

interface Props<K extends string> {
  tabs: Tab<K>[]
  active: K
  onChange: (key: K) => void
}

export default function Tabs<K extends string>({ tabs, active, onChange }: Props<K>) {
  return (
    <div
      className="flex items-center gap-1 border-b overflow-x-auto"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      {tabs.map((t) => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            onClick={() => !t.disabled && onChange(t.key)}
            disabled={t.disabled}
            className="px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition"
            style={{
              color: t.disabled
                ? 'var(--text-faint)'
                : isActive
                  ? 'var(--accent-text)'
                  : 'var(--text-secondary)',
              borderColor: isActive ? 'var(--accent)' : 'transparent',
              cursor: t.disabled ? 'not-allowed' : 'pointer',
              opacity: t.disabled ? 0.5 : 1,
            }}
          >
            {t.label}
            {t.badge !== undefined && (
              <span
                className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-mono"
                style={{ background: 'var(--bg-toggle)', color: 'var(--text-muted)' }}
              >
                {t.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
