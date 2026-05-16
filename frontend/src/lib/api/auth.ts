import { request } from './client'

export type Role = 'admin' | 'cliente'

export interface LoginPayload {
  // Acepta email o username. Backend resuelve.
  identifier: string
  password: string
  // El toggle del frontend se quitó. Ya no enviamos role.
  role?: Role
}

export interface LoginResponse {
  access_token: string
  token_type: string
  role: Role
  user_id: number
  email: string
  username: string | null
  full_name: string | null
  level: number
  level_label: string
  permissions: string[]
}

export const authApi = {
  login: (payload: LoginPayload) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
