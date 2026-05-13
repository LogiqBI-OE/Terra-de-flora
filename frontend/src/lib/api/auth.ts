import { request } from './client'

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

export const authApi = {
  login: (payload: LoginPayload) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
