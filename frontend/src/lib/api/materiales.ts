// API client para /materiales. Acceso L5+.
// Los Decimals del backend llegan como strings JSON — los convertimos a number en el UI.
import { request } from './client'

export interface Material {
  id: number
  codigo: string | null
  nombre: string
  familia: string
  unidad: string
  contenido_por_paquete: number | string
  precio_paquete: number | string
  precio_unitario: number | string
  proveedor_id: number | null
  proveedor_nombre: string | null
  notas: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MaterialCreatePayload {
  codigo?: string | null
  nombre: string
  familia: string
  unidad: string
  contenido_por_paquete: number
  precio_paquete: number
  proveedor_id?: number | null
  notas?: string | null
}

export interface MaterialUpdatePayload extends Partial<MaterialCreatePayload> {
  is_active?: boolean
}

export interface MaterialCatalog {
  familias: string[]
  unidades: string[]
}

export const materialesApi = {
  list: () => request<Material[]>('/materiales'),
  catalog: () => request<MaterialCatalog>('/materiales/_catalog'),
  create: (p: MaterialCreatePayload) =>
    request<Material>('/materiales', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: number, p: MaterialUpdatePayload) =>
    request<Material>(`/materiales/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
  delete: (id: number) => request<void>(`/materiales/${id}`, { method: 'DELETE' }),
}
