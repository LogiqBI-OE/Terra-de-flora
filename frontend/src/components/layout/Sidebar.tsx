import { NavLink } from 'react-router-dom'
import SproutIcon from '../SproutIcon'
import { useAuth } from '../../lib/auth'

// Para añadir/quitar links del menú: edita NAV_ITEMS abajo.
const NAV_ITEMS: { to: string; label: string; roles: Array<'admin' | 'cliente'> }[] = [
  { to: '/cobertura', label: 'Cobertura', roles: ['admin', 'cliente'] },
  { to: '/snapshots', label: 'Snapshots', roles: ['admin', 'cliente'] },
  { to: '/uploads', label: 'Subir datos', roles: ['admin', 'cliente'] },
  { to: '/admin', label: 'Administración', roles: ['admin'] },
]

// Tokens del Sidebar — fijos en ambos temas (definidos en index.css como --sidebar-*).
const STYLES = {
  aside: { background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' } as const,
  header: { borderColor: 'var(--sidebar-border)' } as const,
  brand: { color: 'var(--sidebar-active-text)' } as const,
  footer: { borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-muted)' } as const,
}

function navLinkStyle(isActive: boolean): React.CSSProperties {
  return {
    background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
    color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text-secondary)',
    fontWeight: isActive ? 600 : 400,
  }
}

export default function Sidebar() {
  const { user } = useAuth()
  const role = user?.role

  return (
    <aside className="w-60 shrink-0 border-r flex flex-col" style={STYLES.aside}>
      <div className="px-5 py-5 flex items-center gap-2 border-b" style={STYLES.header}>
        <SproutIcon size={26} style={STYLES.brand} />
        <span className="text-xl font-semibold tracking-tight lowercase" style={STYLES.brand}>oleolab</span>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1 text-sm">
        {NAV_ITEMS.filter((i) => role && i.roles.includes(role)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="block px-3 py-2 rounded-lg transition"
            style={({ isActive }) => navLinkStyle(isActive)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t text-[11px]" style={STYLES.footer}>
        Coberturas · v0.2
      </div>
    </aside>
  )
}
