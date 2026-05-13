import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import Badge from '../ui/Badge'

export default function Topbar({ title }: { title: string }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header
      className="h-14 shrink-0 border-b border-white/5 px-6 flex items-center justify-between"
      style={{ background: 'rgba(11,15,8,0.8)' }}
    >
      <h1 className="text-base font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-3 text-sm">
        <div className="text-right leading-tight">
          <div className="text-white">{user?.full_name ?? user?.email}</div>
          <div className="text-[11px] text-slate-500">{user?.email}</div>
        </div>
        <Badge tone={user?.role === 'admin' ? 'green' : 'blue'}>{user?.role}</Badge>
        <button onClick={handleLogout} className="text-oleo-green hover:underline font-semibold">
          Salir
        </button>
      </div>
    </header>
  )
}
