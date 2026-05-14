// API client para /proyectos. Acceso L5+.
import { request } from './client'

export type TipoProyecto = 'boda' | 'iglesia' | 'bautizo' | 'cumple' | 'xv' | 'corporativo' | 'otro'
export type EstadoProyecto = 'cotizando' | 'aprobado' | 'produccion' | 'montaje' | 'entregado' | 'cancelado'

export interface ProyectoRow {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  cliente_id: number
  cliente_nombre: string
  cliente_tipo: string
  cliente_telefono: string | null
  vendedor_id: number | null
  vendedor_nombre: string | null
  vendedor_username: string | null
  tipo: TipoProyecto
  estado: EstadoProyecto
  fecha_evento: string | null
  direccion_evento: string | null
  valor_estimado: number | string
  notas: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProyectoCreatePayload {
  nombre: string
  descripcion?: string | null
  cliente_id: number
  vendedor_id?: number | null
  tipo: TipoProyecto
  estado?: EstadoProyecto
  fecha_evento?: string | null
  direccion_evento?: string | null
  valor_estimado?: number
  notas?: string | null
}

export interface ProyectoUpdatePayload extends Partial<ProyectoCreatePayload> {
  is_active?: boolean
}

export interface TipoMeta { id: TipoProyecto; label: string; emoji: string }
export interface EstadoMeta { id: EstadoProyecto; label: string; emoji: string }
export interface VendedorOption { id: number; nombre: string; username: string | null; level: number }

export interface ProyectoCatalog {
  tipos: TipoMeta[]
  estados: EstadoMeta[]
  vendedores: VendedorOption[]
}

export const proyectosApi = {
  list: () => request<ProyectoRow[]>('/proyectos'),
  catalog: () => request<ProyectoCatalog>('/proyectos/_catalog'),
  get: (id: number) => request<ProyectoRow>(`/proyectos/${id}`),
  create: (p: ProyectoCreatePayload) =>
    request<ProyectoRow>('/proyectos', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: number, p: ProyectoUpdatePayload) =>
    request<ProyectoRow>(`/proyectos/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
  delete: (id: number) => request<void>(`/proyectos/${id}`, { method: 'DELETE' }),
}
