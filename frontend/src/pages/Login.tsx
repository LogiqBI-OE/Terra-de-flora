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
      <BackgroundCarousel images={CAROUSEL_IMAGES} />

      <div
        className="relative w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
        style={{ boxShadow: '0 40px 80px rgba(0, 0, 0, 0.45)' }}
      >
        {/* LEFT — FORM (siempre blanco) */}
        <div
          className="p-10 md:p-14 flex flex-col justify-center"
          style={{ background: '#FFFFFF', color: '#0F172A' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <img src="/logo-seal-navy.png" alt="Terra de Flora" className="h-12 w-auto" />
            <span className="text-2xl font-semibold tracking-wide uppercase" style={{ color: '#1A2E5A' }}>
              Terra de Flora
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-2 tracking-tight" style={{ color: '#0F172A' }}>Bienvenido</h1>
          <p className="text-sm mb-6" style={{ color: '#475569' }}>Ingresa tus credenciales para continuar.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#475569' }}>Correo</label>
              <input
                type="email"
                required
                placeholder="usuario@terradeflora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-4 py-3 rounded-lg border transition focus:outline-none"
                style={{
                  background: '#F8FAFC',
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
              <label className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#475569' }}>Contraseña</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg border transition focus:outline-none"
                  style={{
                    background: '#F8FAFC',
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
              <label className="flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: '#1A2E5A' }}
                />
                Recuérdame
              </label>
              <a href="#" className="text-sm font-semibold hover:underline" style={{ color: '#1A2E5A' }}>¿Olvidaste tu contraseña?</a>
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
              className="w-full font-semibold py-3 rounded-lg shadow-lg transition mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
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

            <p className="text-center text-sm pt-2" style={{ color: '#64748B' }}>
              ¿Necesitas ayuda?{' '}
              <a href="#" className="font-semibold hover:underline" style={{ color: '#1A2E5A' }}>Contacta a soporte</a>
            </p>
          </form>

          <div className="mt-8 pt-5 border-t flex items-center justify-between text-[11px]" style={{ borderColor: '#F1F5F9' }}>
            <span style={{ color: '#64748B' }}>Powered by</span>
            <span className="font-bold tracking-wider" style={{ color: '#475569' }}>
              LOGIQ <span className="font-normal" style={{ color: '#64748B' }}>· Business Intelligence</span>
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

          <div className="relative flex items-center gap-2 text-[11px] font-bold tracking-[0.35em]">
            <span className="w-8 h-px" style={{ background: 'var(--brand-hero-divider)' }} />
            <span style={{ color: 'var(--brand-hero-text-secondary)' }}>TERRA DE FLORA</span>
            <span
              className="px-2 py-0.5 rounded"
              style={{
                color: '#0A1428',
                background: 'var(--brand-hero-accent)',
                letterSpacing: '0.3em',
              }}
            >
              WORKSPACE
            </span>
          </div>

          <div className="relative flex flex-col items-center justify-center text-center">
            <img
              src="/logo-full-white.png"
              alt="Terra de Flora"
              className="w-72 md:w-80 h-auto mb-4"
            />
            <div className="mt-2 flex items-center gap-3">
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

          <div className="relative text-sm" style={{ color: 'var(--brand-hero-text-secondary)' }}>
            <div className="border-l-2 pl-4 italic" style={{ borderColor: 'var(--brand-hero-quote-border)' }}>
              "Las flores son un hermoso regalo de la naturaleza que despiertan emociones y sentimientos positivos en quien las recibe."
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
