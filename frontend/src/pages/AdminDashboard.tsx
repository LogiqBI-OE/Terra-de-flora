import { useNavigate } from 'react-router-dom'
import SproutIcon from '../components/SproutIcon'
import { useAuth } from '../lib/auth'

export default function AdminDashboard() {
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
            COBERTURAS · ADMIN
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
        <h1 className="text-4xl font-bold text-white mb-2">Panel de Administración</h1>
        <p className="text-slate-400 mb-10">Gestión de coberturas, usuarios y configuración del workspace.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { t: 'Clientes', v: '—' },
            { t: 'Coberturas activas', v: '—' },
            { t: 'Próximos vencimientos', v: '—' },
            { t: 'Solicitudes pendientes', v: '—' },
          ].map((card) => (
            <div
              key={card.t}
              className="rounded-xl border border-white/5 p-6"
              style={{ background: 'rgba(19,26,15,0.6)' }}
            >
              <div className="text-xs tracking-widest uppercase text-slate-500 mb-2">{card.t}</div>
              <div className="text-4xl font-bold text-oleo-green">{card.v}</div>
              <div className="text-xs text-slate-500 mt-3">Próximamente</div>
            </div>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Módulos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Gestión de clientes', 'Catálogo de coberturas', 'Reportes / BI'].map((m) => (
              <div
                key={m}
                className="rounded-lg border border-white/5 px-5 py-4 text-slate-300 hover:border-oleo-green/40 transition"
                style={{ background: 'rgba(19,26,15,0.6)' }}
              >
                {m}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
