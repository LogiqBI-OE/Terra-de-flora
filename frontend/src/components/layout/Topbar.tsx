// Topbar: título de la página a la izquierda, controles a la derecha.
//   Controles: Help · Bell · Theme · UserMenu (avatar + nombre + nivel + chevron)

import { IconBell, IconHelp } from '../icons/Icons'
import IconButton from '../ui/IconButton'
import ThemeToggle from '../ui/ThemeToggle'
import UserMenu from '../ui/UserMenu'

export default function Topbar({ title }: { title: string }) {
  return (
    <header
      className="h-14 shrink-0 border-b px-6 flex items-center justify-between"
      style={{
        background: 'var(--bg-elevated-strong)',
        borderColor: 'var(--border-soft)',
      }}
    >
      <h1 className="text-base font-semibold text-app">{title}</h1>

      <div className="flex items-center gap-1">
        <IconButton icon={<IconHelp size={16} />} label="Ayuda · Pronto" />
        <IconButton icon={<IconBell size={16} />} label="Notificaciones · Pronto" dot />
        <ThemeToggle />
        <div className="ml-1">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
