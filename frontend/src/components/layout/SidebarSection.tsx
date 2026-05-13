// Sección del sidebar: header + lista de items filtrados por permisos/nivel.

import { useAuth } from '../../lib/auth'
import type { NavSection } from './navConfig'
import SidebarItem from './SidebarItem'

interface Props {
  section: NavSection
}

export default function SidebarSection({ section }: Props) {
  const { user, can } = useAuth()
  if (!user) return null

  const visibles = section.items.filter((i) => {
    if (i.requiresPermission && !can(i.requiresPermission)) return false
    if (i.minLevel !== undefined && user.level < i.minLevel) return false
    return true
  })
  if (visibles.length === 0) return null

  return (
    <div className="mb-1">
      <div
        className="px-3 pt-4 pb-1 text-[10px] font-semibold tracking-[0.18em] uppercase"
        style={{ color: 'var(--sidebar-section-title)' }}
      >
        {section.title}
      </div>
      <div className="px-1 space-y-0.5">
        {visibles.map((item) => (
          <SidebarItem key={item.to} item={item} />
        ))}
      </div>
    </div>
  )
}
