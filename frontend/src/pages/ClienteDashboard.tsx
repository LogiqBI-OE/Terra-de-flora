import { useNavigate } from 'react-router-dom'
import SproutIcon from '../components/SproutIcon'
import { useAuth } from '../lib/auth'

export default function ClienteDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="bg-hero min-h-screen">
      <header className="border-b border-white/5 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SproutIcon size={28} className="text-oleo-green" />
          <span className="text-2xl font-semibold tracking-tight text-oleo-green lowercase">oleolab</span>
          <span className="ml-3 text-xs tracking-widest text-slate-500 border-l border-slate-700 pl-3">
            COBERTURAS · CLIENTE
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">{user?.full_name ?? user?.email}</span>
          <button onClick={handleLogout} className="text-oleo-green hover:underline font-semibold">
            Salir
          </button>
        </div>
      </header>

      <main className="px-8 py-12 max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Bienvenido</h1>
        <p className="text-slate-400 mb-10">Panel de cliente — coberturas asignadas y estatus operativo.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Coberturas activas', 'Próximos vencimientos', 'Solicitudes abiertas'].map((title) => (
            <div
              key={title}
              className="rounded-xl border border-white/5 p-6"
              style={{ background: 'rgba(19,26,15,0.6)' }}
            >
              <div className="text-xs tracking-widest uppercase text-slate-500 mb-2">{title}</div>
              <div className="text-4xl font-bold text-oleo-green">—</div>
              <div className="text-xs text-slate-500 mt-3">Próximamente</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
