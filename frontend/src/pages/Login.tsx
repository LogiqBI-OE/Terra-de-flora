import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import SproutIcon from '../components/SproutIcon'
import { ApiError } from '../lib/api/index'
import { useAuth } from '../lib/auth'

// "Recuérdame": guardamos solo el email (NUNCA el password) para precargar
// el form la próxima vez. Si el usuario lo desmarca, borramos.
const REMEMBER_KEY = 'oleolab.remember_email'

function loadRememberedEmail(): string {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? ''
  } catch {
    return ''
  }
}

export default function Login() {
  const navigate = useNavigate()
  const { login, loading } = useAuth()

  const rememberedEmail = loadRememberedEmail()
  const [email, setEmail] = useState(rememberedEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  // Si había email guardado, asumimos que el usuario quiere seguir recordándolo.
  const [remember, setRemember] = useState(rememberedEmail !== '')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const cleanEmail = email.trim().toLowerCase()
      await login({ email: cleanEmail, password })

      // Persistir/limpiar email según la elección del usuario.
      try {
        if (remember) localStorage.setItem(REMEMBER_KEY, cleanEmail)
        else localStorage.removeItem(REMEMBER_KEY)
      } catch { /* ignore */ }

      navigate('/hallazgos', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Error inesperado. Intenta de nuevo.')
    }
  }

  return (
    <div className="bg-hero min-h-screen flex items-center justify-center p-4">
      <div
        className="w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border"
        style={{ background: 'var(--bg-card-soft)', borderColor: 'var(--border-soft)', backdropFilter: 'blur(20px)' }}
      >
        {/* LEFT — FORM */}
        <div
          className="p-10 md:p-14 flex flex-col justify-center"
          style={{ background: 'var(--bg-card)' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <SproutIcon size={34} className="text-accent" />
            <span className="text-3xl font-semibold tracking-tight text-accent lowercase">oleolab</span>
          </div>

          <h1 className="text-4xl font-bold text-app mb-2 tracking-tight">Bienvenido</h1>
          <p className="text-sm text-app-secondary mb-6">Ingresa tus credenciales para continuar.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold tracking-widest uppercase text-app-secondary">Correo</label>
              <input
                type="email"
                required
                placeholder="usuario@oleolab.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="oleo-input"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-widest uppercase text-app-secondary">Contraseña</label>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app p-1"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-app-secondary">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--accent)' }}
                />
                Recuérdame
              </label>
              <a href="#" className="text-sm font-semibold text-accent hover:underline">¿Olvidaste tu contraseña?</a>
            </div>

            {error && (
              <div
                className="rounded-lg border px-4 py-3 text-sm"
                style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)', color: 'var(--danger)' }}
              >
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-oleo mt-2">
              {loading ? 'INGRESANDO...' : 'INICIAR SESIÓN'}
            </button>

            <p className="text-center text-sm text-app-muted pt-2">
              ¿Necesitas ayuda?{' '}
              <a href="#" className="font-semibold text-accent hover:underline">Contacta a soporte</a>
            </p>
          </form>

          <div className="mt-8 pt-5 border-t flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--border-soft)' }}>
            <span className="text-app-muted">Powered by</span>
            <span className="font-bold tracking-wider text-app-secondary">
              LOGIQ <span className="font-normal text-app-muted">· Business Intelligence</span>
            </span>
          </div>
        </div>

        {/* RIGHT — BRAND HERO (fijo en oscuro, tokens --brand-hero-*) */}
        <div
          className="hidden md:flex relative p-10 flex-col justify-between overflow-hidden"
          style={{ background: 'var(--brand-hero-bg)' }}
        >
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl"
            style={{ background: 'var(--brand-hero-accent-bg)' }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl"
            style={{ background: 'var(--brand-hero-accent-bg-soft)' }}
          />

          <div className="relative flex items-center gap-2 text-xs font-bold tracking-[0.3em]">
            <span className="w-8 h-px" style={{ background: 'var(--brand-hero-divider)' }} />
            <span style={{ color: 'var(--brand-hero-text-secondary)' }}>OLEOLAB</span>
            <span style={{ color: 'var(--brand-hero-accent)' }}>WORKSPACE</span>
          </div>

          <div className="relative flex flex-col items-center justify-center text-center">
            <SproutIcon size={90} className="mb-3" style={{ color: 'var(--brand-hero-accent)' }} />
            <div
              className="text-6xl md:text-7xl font-semibold tracking-tight lowercase leading-none"
              style={{ color: 'var(--brand-hero-accent)' }}
            >
              oleolab
            </div>
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px w-10" style={{ background: 'var(--brand-hero-divider)' }} />
              <div
                className="tracking-[0.3em] text-xs font-semibold"
                style={{ color: 'var(--brand-hero-text-secondary)' }}
              >
                COBERTURAS
              </div>
              <div className="h-px w-10" style={{ background: 'var(--brand-hero-divider)' }} />
            </div>
            <p
              className="text-xs mt-3 italic max-w-xs"
              style={{ color: 'var(--brand-hero-text-muted)' }}
            >
              Identidad operativa para gestión industrial.
            </p>
          </div>

          <div className="relative text-sm" style={{ color: 'var(--brand-hero-text-secondary)' }}>
            <div className="border-l-2 pl-4" style={{ borderColor: 'var(--brand-hero-quote-border)' }}>
              "Visibilidad total de tus coberturas, en un solo lugar."
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
