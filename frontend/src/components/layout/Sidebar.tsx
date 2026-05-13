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

export default function Sidebar() {
  const { user } = useAuth()
  const role = user?.role

  return (
    <aside
      className="w-60 shrink-0 border-r flex flex-col"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}
    >
      <div
        className="px-5 py-5 flex items-center gap-2 border-b"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        <SproutIcon size={26} className="text-accent" />
        <span className="text-xl font-semibold tracking-tight text-accent lowercase">oleolab</span>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-1 text-sm">
        {NAV_ITEMS.filter((i) => role && i.roles.includes(role)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg transition ${
                isActive ? 'font-semibold' : 'text-app-secondary hover:text-app'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'rgba(168, 208, 96, 0.15)' : 'transparent',
              color: isActive ? 'var(--accent-text)' : undefined,
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div
        className="px-5 py-4 border-t text-[11px] text-app-muted"
        style={{ borderColor: 'var(--border-soft)' }}
      >
        Coberturas · v0.2
      </div>
    </aside>
  )
}
