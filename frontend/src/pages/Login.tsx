import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '../lib/api/index'
import { useAuth } from '../lib/auth'
import BackgroundCarousel from '../components/BackgroundCarousel'

// "Recuérdame": guardamos solo el email (NUNCA el password) para precargar
// el form la próxima vez. Si el usuario lo desmarca, borramos.
const REMEMBER_KEY = 'terradeflora.remember_email'

// Imágenes del carrusel de fondo — viven en /public/carousel/
const CAROUSEL_IMAGES = [
  '/carousel/event-1.jpg',
  '/carousel/event-2.jpg',
  '/carousel/tons-love-1.jpg',
  '/carousel/rosa-bella.jpg',
  '/carousel/you-and-i.jpg',
  '/carousel/valentine.jpg',
  '/carousel/love-you.jpg',
  '/carousel/tons-love-2.jpg',
]

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

      navigate('/', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError('Error inesperado. Intenta de nuevo.')
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Fondo carrusel cubre todo el viewport, detras de la tarjeta del login */}
      <BackgroundCarousel
        images={CAROUSEL_IMAGES}
        intervalMs={4500}
        overlay="rgba(10, 20, 40, 0.28)"
      />

      <div
        className="relative w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border"
        style={{
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.40)',
          borderColor: 'rgba(255, 255, 255, 0.18)',
        }}
      >
        {/* LEFT — FORM (blanco translucido con glassmorphism) */}
        <div
          className="px-9 md:px-12 pt-7 pb-4 md:pt-9 md:pb-4 flex flex-col"
          style={{
            background: 'rgba(255, 255, 255, 0.32)',
            backdropFilter: 'blur(14px) saturate(135%)',
            WebkitBackdropFilter: 'blur(14px) saturate(135%)',
            color: '#0F172A',
          }}
        >
          {/* Top: TERRA DE FLORA · WORKSPACE chip */}
          <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.35em] mb-6">
            <span className="w-8 h-px" style={{ background: 'rgba(15, 23, 42, 0.35)' }} />
            <span style={{ color: '#1E293B', textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)' }}>TERRA DE FLORA</span>
            <span
              className="px-2 py-0.5 rounded shadow-sm"
              style={{
                color: '#0A1428',
                background: '#D4B996',
                letterSpacing: '0.3em',
              }}
            >
              WORKSPACE
            </span>
          </div>

          {/* Form section grows to fill */}
          <div className="flex-1 flex flex-col justify-center">
            <h1
              className="text-2xl font-bold mb-0.5 tracking-tight"
              style={{ color: '#0F172A', textShadow: '0 1px 3px rgba(255, 255, 255, 0.85)' }}
            >
              Bienvenido
            </h1>
            <p
              className="text-sm mb-4 font-medium"
              style={{ color: '#334155', textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)' }}
            >
              Ingresa tus credenciales para continuar.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#1E293B', textShadow: '0 1px 3px rgba(255, 255, 255, 0.95), 0 0 8px rgba(255, 255, 255, 0.6)' }}>Correo</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@terradeflora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 rounded-lg border transition focus:outline-none"
                  style={{
                    background: 'rgba(248, 250, 252, 0.85)',
                    borderColor: '#E2E8F0',
                    color: '#0F172A',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1A2E5A'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26, 46, 90, 0.15)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#E2E8F0'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#1E293B', textShadow: '0 1px 3px rgba(255, 255, 255, 0.95), 0 0 8px rgba(255, 255, 255, 0.6)' }}>Contraseña</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 rounded-lg border transition focus:outline-none"
                    style={{
                      background: 'rgba(248, 250, 252, 0.85)',
                      borderColor: '#E2E8F0',
                      color: '#0F172A',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#1A2E5A'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26, 46, 90, 0.15)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E2E8F0'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: '#64748B' }}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: '#1E293B', textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)' }}
                >
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: '#1A2E5A' }}
                  />
                  Recuérdame
                </label>
                <a
                  href="#"
                  className="text-sm font-bold hover:underline"
                  style={{ color: '#1A2E5A', textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)' }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {error && (
                <div
                  className="rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: 'rgba(220, 38, 38, 0.30)', background: 'rgba(220, 38, 38, 0.08)', color: '#DC2626' }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full font-semibold py-2.5 rounded-lg shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: '#1A2E5A',
                  color: '#FFFFFF',
                  boxShadow: '0 10px 24px rgba(26, 46, 90, 0.30)',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#11203F' }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#1A2E5A' }}
              >
                {loading ? 'INGRESANDO...' : 'INICIAR SESIÓN'}
              </button>

              <p
                className="text-center text-sm pt-1 font-medium"
                style={{ color: '#334155', textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)' }}
              >
                ¿Necesitas ayuda?{' '}
                <a
                  href="#"
                  className="font-bold hover:underline"
                  style={{ color: '#1A2E5A', textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)' }}
                >
                  Contacta a soporte
                </a>
              </p>
            </form>
          </div>

          {/* Footer LOGIQ — pegado al pie izquierdo */}
          <div
            className="mt-8 text-left text-[10px]"
            style={{ textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)' }}
          >
            <span style={{ color: '#334155' }}>
              Powered by{' '}
              <span className="font-bold tracking-wider" style={{ color: '#1E293B' }}>
                LOGIQ
              </span>
              <span className="font-medium" style={{ color: '#475569' }}> · Business Intelligence</span>
            </span>
          </div>
        </div>

        {/* RIGHT — BRAND HERO (navy con glassmorphism) */}
        <div
          className="hidden md:flex relative px-9 pt-8 pb-4 flex-col justify-between overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0A1428 0%, #1A2E5A 60%, #0A1428 100%)',
          }}
        >
          <div
            className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'var(--brand-hero-accent-bg)' }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full blur-3xl pointer-events-none"
            style={{ background: 'var(--brand-hero-accent-bg-soft)' }}
          />

          {/* Centered logo + workspace divider */}
          <div className="relative flex flex-col items-center justify-center text-center flex-1">
            <img
              src="/logo-full-white.png"
              alt="Terra de Flora"
              className="w-64 md:w-80 h-auto mb-3"
            />
            <div className="mt-1 flex items-center gap-3">
              <div className="h-px w-10" style={{ background: 'var(--brand-hero-divider)' }} />
              <div
                className="tracking-[0.3em] text-xs font-semibold"
                style={{ color: 'var(--brand-hero-accent)' }}
              >
                WORKSPACE
              </div>
              <div className="h-px w-10" style={{ background: 'var(--brand-hero-divider)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
