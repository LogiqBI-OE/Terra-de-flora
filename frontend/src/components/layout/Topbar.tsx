import ThemeToggle from '../ui/ThemeToggle'
import UserMenu from '../ui/UserMenu'

export default function Topbar({ title }: { title: string }) {
  return (
    <header
      className="h-14 shrink-0 border-b px-6 flex items-center justify-between"
      style={{ background: 'var(--bg-elevated-strong)', borderColor: 'var(--border-soft)' }}
    >
      <h1 className="text-base font-semibold text-app">{title}</h1>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
