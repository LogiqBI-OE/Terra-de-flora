// API client para /clientes. Acceso L5+.
import { request } from './client'

export type TipoCliente = 'PF' | 'PM'

export interface Cliente {
  id: number
  nombre: string
  tipo: TipoCliente
  razon_social: string | null
  rfc: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  notas: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ClienteCreatePayload {
  nombre: string
  tipo: TipoCliente
  razon_social?: string | null
  rfc?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  notas?: string | null
}

export interface ClienteUpdatePayload extends Partial<ClienteCreatePayload> {
  is_active?: boolean
}

export const clientesApi = {
  list: () => request<Cliente[]>('/clientes'),
  create: (p: ClienteCreatePayload) =>
    request<Cliente>('/clientes', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: number, p: ClienteUpdatePayload) =>
    request<Cliente>(`/clientes/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
  delete: (id: number) => request<void>(`/clientes/${id}`, { method: 'DELETE' }),
}
