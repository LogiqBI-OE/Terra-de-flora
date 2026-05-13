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

const STORAGE_KEY = 'oleolab.session'

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
    // Si el token está expirado/inválido, limpiamos la sesión y mandamos al login.
    // Así no se quedan tablas "vacías" silenciosamente por culpa de un 401.
    if (res.status === 401) {
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    let detail = res.statusText
    try {
      const body = await res.json()
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
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
