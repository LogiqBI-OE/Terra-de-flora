// Sidebar principal. Estructura compuesta:
//   - BrandHeader (logo)
//   - Sections (definidas en navConfig.tsx)
//   - Footer (versión)
//
// El sidebar siempre va en oscuro (zinc-900): consume tokens --sidebar-* fijos.

import SproutIcon from '../SproutIcon'
import { useAuth } from '../../lib/auth'
import { NAV_SECTIONS } from './navConfig'
import SidebarSection from './SidebarSection'

const STYLES = {
  aside: {
    background: 'var(--sidebar-bg)',
    borderColor: 'var(--sidebar-border)',
  } as const,
  header: { borderColor: 'var(--sidebar-border)' } as const,
  brand: { color: 'var(--sidebar-active-text)' } as const,
  footer: {
    borderColor: 'var(--sidebar-border)',
    color: 'var(--sidebar-text-muted)',
  } as const,
}

export default function Sidebar() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <aside className="w-60 shrink-0 border-r flex flex-col" style={STYLES.aside}>
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-2 border-b" style={STYLES.header}>
        <SproutIcon size={26} style={STYLES.brand} />
        <span className="text-xl font-semibold tracking-tight lowercase" style={STYLES.brand}>
          terra de flora
        </span>
      </div>

      {/* Navegación por secciones */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_SECTIONS.map((section) => (
          <SidebarSection key={section.title} section={section} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t text-[11px]" style={STYLES.footer}>
        Terra de Flora · v0.1
      </div>
    </aside>
  )
}
