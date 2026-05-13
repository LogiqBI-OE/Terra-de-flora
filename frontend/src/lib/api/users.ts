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
  full_name: string | null
  level: number
  level_label: string
  role: string
  permissions: string[]
  effective_permissions: string[]
  customer_id: number | null
  is_active: boolean
  created_at: string
}

export interface UserCreatePayload {
  email: string
  full_name: string
  password: string
  level: number
  permissions: string[]
  customer_id?: number | null
}

export interface UserUpdatePayload {
  full_name?: string
  password?: string
  level?: number
  permissions?: string[]
  customer_id?: number | null
  is_active?: boolean
}

const json = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) })
const patch = (body: unknown) => ({ method: 'PATCH', body: JSON.stringify(body) })

export const usersApi = {
  list: () => request<UserDetail[]>('/users'),
  catalog: () => request<PermissionsCatalog>('/users/_catalog'),
  create: (p: UserCreatePayload) => request<UserDetail>('/users', json(p)),
  update: (id: number, p: UserUpdatePayload) => request<UserDetail>(`/users/${id}`, patch(p)),
  delete: (id: number) => request<void>(`/users/${id}`, { method: 'DELETE' }),
}
