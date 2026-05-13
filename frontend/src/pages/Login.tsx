import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import SproutIcon from '../components/SproutIcon'
import { ApiError, type Role } from '../lib/api/index'
import { useAuth } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()

  const [role, setRole] = useState<Role>('cliente')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const u = await login({ email: email.trim().toLowerCase(), password, role })
      navigate(u.role === 'admin' ? '/admin' : '/cliente', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Error inesperado. Intenta de nuevo.')
    }
  }

  return (
    <div className="bg-hero min-h-screen flex items-center justify-center p-4">
      <div
        className="w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-white/5"
        style={{ background: 'rgba(11,15,8,0.6)', backdropFilter: 'blur(20px)' }}
      >
        {/* LEFT — FORM */}
        <div className="p-10 md:p-14 flex flex-col justify-center" style={{ background: 'rgba(19,26,15,0.92)' }}>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <SproutIcon size={34} className="text-oleo-green" />
            <span className="text-3xl font-semibold tracking-tight text-oleo-green lowercase">oleolab</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Bienvenido</h1>
          <p className="text-sm text-slate-400 mb-6">Ingresa tus credenciales para continuar.</p>

          {/* Role toggle */}
          <div className="relative rounded-full p-1 grid grid-cols-2 mb-6 text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="absolute top-1 bottom-1 rounded-full transition-transform duration-300 ease-out"
              style={{
                width: 'calc(50% - 4px)',
                left: 4,
                background: '#A8D060',
                boxShadow: '0 4px 12px rgba(168,208,96,0.35)',
                transform: role === 'admin' ? 'translateX(100%)' : 'translateX(0)',
              }}
            />
            <button
              type="button"
              onClick={() => setRole('cliente')}
              className="relative z-10 py-2 rounded-full transition-colors"
              style={{ color: role === 'cliente' ? '#0B0F08' : '#94a3b8' }}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className="relative z-10 py-2 rounded-full transition-colors"
              style={{ color: role === 'admin' ? '#0B0F08' : '#94a3b8' }}
            >
              Administrador
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">Correo</label>
              <input
                type="email"
                required
                placeholder={role === 'admin' ? 'admin@empresa.com' : 'usuario@oleolab.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="oleo-input"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">Contraseña</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="oleo-input pr-12"
                  style={{ marginTop: 0 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: '#A8D060' }}
                />
                Recuérdame
              </label>
              <a href="#" className="text-sm font-semibold text-oleo-green hover:underline">¿Olvidaste tu contraseña?</a>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-oleo mt-2">
              {loading ? 'INGRESANDO...' : 'INICIAR SESIÓN'}
            </button>

            <p className="text-center text-sm text-slate-500 pt-2">
              ¿Necesitas ayuda?{' '}
              <a href="#" className="font-semibold text-oleo-green hover:underline">Contacta a soporte</a>
            </p>
          </form>

          <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Powered by</span>
            <span className="font-bold tracking-wider text-slate-300">
              LOGIQ <span className="font-normal text-slate-500">· Business Intelligence</span>
            </span>
          </div>
        </div>

        {/* RIGHT — BRAND */}
        <div
          className="hidden md:flex relative p-10 flex-col justify-between overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0B0F08 0%, #131A0F 60%, #0B0F08 100%)' }}
        >
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(168,208,96,0.18)' }} />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl" style={{ background: 'rgba(168,208,96,0.08)' }} />

          <div className="relative flex items-center gap-2 text-xs font-bold tracking-[0.3em]">
            <span className="w-8 h-px bg-slate-600" />
            <span className="text-slate-300">OLEOLAB</span>
            <span className="text-oleo-green">WORKSPACE</span>
          </div>

          <div className="relative flex flex-col items-center justify-center text-center">
            <SproutIcon size={90} className="text-oleo-green mb-3" />
            <div className="text-6xl md:text-7xl font-semibold tracking-tight text-oleo-green lowercase leading-none">oleolab</div>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px w-10 bg-slate-700" />
              <div className="text-slate-400 tracking-[0.3em] text-xs font-semibold">COBERTURAS</div>
              <div className="h-px w-10 bg-slate-700" />
            </div>
            <p className="text-slate-500 text-xs mt-3 italic max-w-xs">Identidad operativa para gestión industrial.</p>
          </div>

          <div className="relative text-slate-400 text-sm">
            <div className="border-l-2 pl-4" style={{ borderColor: 'rgba(168,208,96,0.7)' }}>
              "Visibilidad total de tus coberturas, en un solo lugar."
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
