// API client para /proveedores. Acceso L5+.
import { request } from './client'

export interface Proveedor {
  id: number
  nombre: string
  razon_social: string | null
  rfc: string | null
  contacto_nombre: string | null
  contacto_telefono: string | null
  contacto_email: string | null
  direccion: string | null
  notas: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProveedorCreatePayload {
  nombre: string
  razon_social?: string | null
  rfc?: string | null
  contacto_nombre?: string | null
  contacto_telefono?: string | null
  contacto_email?: string | null
  direccion?: string | null
  notas?: string | null
}

export interface ProveedorUpdatePayload extends Partial<ProveedorCreatePayload> {
  is_active?: boolean
}

export const proveedoresApi = {
  list: () => request<Proveedor[]>('/proveedores'),
  create: (p: ProveedorCreatePayload) =>
    request<Proveedor>('/proveedores', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: number, p: ProveedorUpdatePayload) =>
    request<Proveedor>(`/proveedores/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
  delete: (id: number) => request<void>(`/proveedores/${id}`, { method: 'DELETE' }),
}
