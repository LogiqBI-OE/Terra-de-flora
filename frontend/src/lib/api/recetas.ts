// API client para /recetas. Acceso L5+.
import { request } from './client'

export interface RecetaItemIn {
  material_id: number
  cantidad: number
  notas?: string | null
}

export interface RecetaItem {
  id: number
  material_id: number
  material_nombre: string
  material_familia: string
  material_unidad: string
  material_precio_unitario: number | string
  cantidad: number | string
  notas: string | null
}

export interface RecetaSummary {
  id: number
  nombre: string
  descripcion: string | null
  categoria: string
  is_active: boolean
  item_count: number
  costo_estimado: number | string
  updated_at: string
}

export interface Receta {
  id: number
  nombre: string
  descripcion: string | null
  categoria: string
  is_active: boolean
  items: RecetaItem[]
  costo_estimado: number | string
  item_count: number
  created_at: string
  updated_at: string
}

export interface RecetaCreatePayload {
  nombre: string
  descripcion?: string | null
  categoria: string
  items: RecetaItemIn[]
}

export interface RecetaUpdatePayload {
  nombre?: string
  descripcion?: string | null
  categoria?: string
  is_active?: boolean
  items?: RecetaItemIn[]
}

export interface RecetaCatalog {
  categorias: string[]
}

export const recetasApi = {
  list: () => request<RecetaSummary[]>('/recetas'),
  catalog: () => request<RecetaCatalog>('/recetas/_catalog'),
  get: (id: number) => request<Receta>(`/recetas/${id}`),
  create: (p: RecetaCreatePayload) =>
    request<Receta>('/recetas', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: number, p: RecetaUpdatePayload) =>
    request<Receta>(`/recetas/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
  delete: (id: number) => request<void>(`/recetas/${id}`, { method: 'DELETE' }),
}
