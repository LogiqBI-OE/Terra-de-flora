// Cliente HTTP base. Centraliza:
//  - URL del backend (VITE_API_URL)
//  - inyección de Authorization Bearer (lo lee de localStorage)
//  - manejo de errores → ApiError

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// Traduce errores de Pydantic v2 (422 validation) a mensajes legibles.
// FastAPI devuelve {detail: [{type, loc, msg, input, ctx}, ...]} para validation errors.
function formatErrorDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const msgs = detail.map((e: any) => {
      // loc viene como ['body', 'password'] o ['query', 'limit']
      const field = Array.isArray(e?.loc)
        ? e.loc.filter((x: any) => x !== 'body' && x !== 'query' && x !== 'path').join('.')
        : ''
      const niceField = FIELD_LABELS[field] ?? field
      const msg = friendlyValidationMsg(e?.type, e?.msg, e?.ctx)
      return niceField ? `${niceField}: ${msg}` : msg
    })
    return msgs.join(' · ')
  }
  try { return JSON.stringify(detail) } catch { return 'Error desconocido' }
}

// Etiquetas amigables para campos comunes
const FIELD_LABELS: Record<string, string> = {
  email: 'Correo',
  username: 'Usuario',
  password: 'Contraseña',
  first_name: 'Nombre',
  last_name_paterno: 'Apellido paterno',
  last_name_materno: 'Apellido materno',
  level: 'Nivel',
  nombre: 'Nombre',
  rfc: 'RFC',
  telefono: 'Teléfono',
  cliente_id: 'Cliente',
  vendedor_id: 'Vendedor',
  fecha_evento: 'Fecha del evento',
  valor_estimado: 'Valor estimado',
  cant_invitados: 'Cantidad de invitados',
  precio_paquete: 'Precio del paquete',
  contenido_por_paquete: 'Contenido por paquete',
  cantidad: 'Cantidad',
}

function friendlyValidationMsg(type: string, msg: string, ctx: any): string {
  switch (type) {
    case 'string_too_short':
      return `requiere al menos ${ctx?.min_length ?? 1} caracter${(ctx?.min_length ?? 1) === 1 ? '' : 'es'}`
    case 'string_too_long':
      return `máximo ${ctx?.max_length} caracteres`
    case 'value_error.email':
    case 'value_error':
      return msg
    case 'missing':
      return 'es obligatorio'
    case 'int_parsing':
    case 'int_type':
      return 'debe ser un número entero'
    case 'decimal_parsing':
    case 'float_parsing':
      return 'debe ser un número'
    case 'greater_than':
      return `debe ser mayor a ${ctx?.gt}`
    case 'greater_than_equal':
      return `debe ser ≥ ${ctx?.ge}`
    case 'less_than_equal':
      return `debe ser ≤ ${ctx?.le}`
    default:
      return msg || 'inválido'
  }
}

const STORAGE_KEY = 'terradeflora.session'

function getToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.token ?? null
  } catch {
    return null
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...((init.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (!res.ok) {
    // Si HABÍA token y el server lo rechaza (expirado/inválido) en un endpoint
    // que NO sea el propio login, limpiamos sesión y mandamos a /login.
    // OJO: no aplica si nunca hubo token (caso login con creds malas).
    if (res.status === 401 && token && !path.startsWith('/auth/login')) {
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    let detail = res.statusText
    try {
      const body = await res.json()
      if (body?.detail) {
        detail = formatErrorDetail(body.detail)
      }
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail)
  }
  // 204 No Content
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// Para descargas binarias (Excel templates, etc.)
export async function requestBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const token = getToken()
  const headers: Record<string, string> = { ...((init.headers as Record<string, string>) || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (!res.ok) throw new ApiError(res.status, res.statusText)
  return res.blob()
}
