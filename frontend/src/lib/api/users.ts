// API client para CRUD de usuarios (solo level 9 puede llamar).
import { request } from './client'

export interface LevelDef {
  level: number
  label: string
  reserved: boolean
}

export interface PermissionsCatalog {
  levels: LevelDef[]
  permissions: string[]
  restricted: string[]
  defaults_by_level: Record<number, string[]>
}

export interface UserDetail {
  id: number
  email: string
  username: string | null
  first_name: string | null
  last_name_paterno: string | null
  last_name_materno: string | null
  full_name: string | null
  level: number
  level_label: string
  role: string
  permissions: string[]
  effective_permissions: string[]
  is_active: boolean
  created_at: string
}

export interface UserCreatePayload {
  email: string
  username: string  // obligatorio, debe ser único
  first_name: string
  last_name_paterno?: string
  last_name_materno?: string
  password: string
  level: number
  permissions: string[]
}

export interface UserUpdatePayload {
  username?: string
  first_name?: string
  last_name_paterno?: string
  last_name_materno?: string
  password?: string
  level?: number
  permissions?: string[]
  is_active?: boolean
}

export interface LoginEvent {
  id: number
  user_id: number | null
  user_email: string | null
  user_full_name: string | null
  identifier_used: string
  success: boolean
  failure_reason: string | null
  ip: string | null
  user_agent: string | null
  created_at: string
}

export interface LoginEventsFilters {
  user_id?: number
  success?: boolean
  failure_reason?: string
  limit?: number
  offset?: number
}

const json = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) })
const patch = (body: unknown) => ({ method: 'PATCH', body: JSON.stringify(body) })

export const usersApi = {
  list: () => request<UserDetail[]>('/users'),
  catalog: () => request<PermissionsCatalog>('/users/_catalog'),
  create: (p: UserCreatePayload) => request<UserDetail>('/users', json(p)),
  update: (id: number, p: UserUpdatePayload) => request<UserDetail>(`/users/${id}`, patch(p)),
  delete: (id: number) => request<void>(`/users/${id}`, { method: 'DELETE' }),
  resetPassword: (id: number) =>
    request<{ user_id: number; used_standard: boolean }>(`/users/${id}/reset-password`, { method: 'POST' }),
  loginEvents: (id: number, limit = 50) =>
    request<LoginEvent[]>(`/users/${id}/login-events?limit=${limit}`),
  allLoginEvents: (filters: LoginEventsFilters = {}) => {
    const params = new URLSearchParams()
    if (filters.user_id !== undefined) params.set('user_id', String(filters.user_id))
    if (filters.success !== undefined) params.set('success', String(filters.success))
    if (filters.failure_reason) params.set('failure_reason', filters.failure_reason)
    params.set('limit', String(filters.limit ?? 200))
    params.set('offset', String(filters.offset ?? 0))
    return request<LoginEvent[]>(`/users/_login-events?${params}`)
  },
}
