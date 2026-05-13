// Sección del sidebar = header + lista de items filtrados por rol.

import type { Role } from '../../lib/api'
import type { NavSection } from './navConfig'
import SidebarItem from './SidebarItem'

interface Props {
  section: NavSection
  role: Role
}

export default function SidebarSection({ section, role }: Props) {
  const visibles = section.items.filter((i) => i.roles.includes(role))
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
