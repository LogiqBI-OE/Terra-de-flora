export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type Role = 'admin' | 'cliente'

export interface LoginPayload {
  email: string
  password: string
  role: Role
}

export interface LoginResponse {
  access_token: string
  token_type: string
  role: Role
  email: string
  full_name: string | null
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      if (body?.detail) detail = body.detail
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

export const api = {
  login: (payload: LoginPayload) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  me: (token: string) =>
    request<LoginResponse>('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),
}
