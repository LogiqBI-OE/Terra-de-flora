// API client para cotizaciones. Acceso L5+.
import { request } from './client'

export type EstadoCotizacion = 'borrador' | 'enviada' | 'aprobada' | 'rechazada'

export interface CotizacionItem {
  id: number
  seccion_id: number
  receta_id: number | null
  descripcion: string | null
  cantidad: number | string
  precio_venta_unit: number | string | null
  orden: number
  notas: string | null
  nombre: string
  costo_unit: number | string
  precio_venta_calc: number | string
  subtotal_costo: number | string
  subtotal_venta: number | string
  is_snapshot: boolean
}

export interface CotizacionSeccion {
  id: number
  cotizacion_id: number
  nombre: string
  orden: number
  notas: string | null
  items: CotizacionItem[]
  subtotal_costo: number | string
  subtotal_venta: number | string
}

export interface Cotizacion {
  id: number
  proyecto_id: number
  version: number
  nombre: string | null
  estado: EstadoCotizacion
  margen_default: number | string
  notas: string | null
  snapshot_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  secciones: CotizacionSeccion[]
  total_costo: number | string
  total_venta: number | string
  margen_real: number | string
}

export interface CotizacionSummary {
  id: number
  proyecto_id: number
  version: number
  nombre: string | null
  estado: EstadoCotizacion
  snapshot_at: string | null
  is_active: boolean
  total_venta: number | string
  total_costo: number | string
  secciones_count: number
  items_count: number
  created_at: string
  updated_at: string
}

export interface CotizacionCatalog {
  secciones_tipo: { nombre: string; emoji: string }[]
}

export interface CotizacionCreatePayload {
  nombre?: string | null
  margen_default?: number
  notas?: string | null
}

export interface CotizacionUpdatePayload {
  nombre?: string | null
  estado?: EstadoCotizacion
  margen_default?: number
  notas?: string | null
}

export interface SeccionCreatePayload {
  nombre: string
  orden?: number
  notas?: string | null
  items?: ItemCreatePayload[]
}

export interface SeccionUpdatePayload {
  nombre?: string
  orden?: number
  notas?: string | null
}

export interface ItemCreatePayload {
  receta_id?: number | null
  descripcion?: string | null
  cantidad?: number
  precio_venta_unit?: number | null
  orden?: number
  notas?: string | null
}

export interface ItemUpdatePayload extends ItemCreatePayload {}

// ── Desviación (Fase 3) ────────────────────────────────────────────────
export interface DesviacionItem {
  item_id: number
  receta_id: number | null
  nombre: string
  seccion_nombre: string
  cantidad: number | string
  costo_snapshot: number | string
  costo_actual: number | string
  delta_unit: number | string
  delta_total: number | string
  direccion: 'sube' | 'baja' | 'igual'
}

export interface DesviacionResumen {
  cotizacion_id: number
  snapshot_at: string | null
  snapshot_total_costo: number | string
  actual_total_costo: number | string
  delta_total: number | string
  delta_pct: number | string
  items: DesviacionItem[]
}

export const cotizacionesApi = {
  list: (pid: number) =>
    request<CotizacionSummary[]>(`/proyectos/${pid}/cotizaciones`),
  catalog: (pid: number) =>
    request<CotizacionCatalog>(`/proyectos/${pid}/cotizaciones/_catalog`),
  create: (pid: number, p: CotizacionCreatePayload) =>
    request<Cotizacion>(`/proyectos/${pid}/cotizaciones`, {
      method: 'POST',
      body: JSON.stringify(p),
    }),
  duplicate: (pid: number, cid: number) =>
    request<Cotizacion>(`/proyectos/${pid}/cotizaciones/${cid}/duplicar`, {
      method: 'POST',
    }),
  get: (cid: number) => request<Cotizacion>(`/cotizaciones/${cid}`),
  update: (cid: number, p: CotizacionUpdatePayload) =>
    request<Cotizacion>(`/cotizaciones/${cid}`, {
      method: 'PATCH',
      body: JSON.stringify(p),
    }),
  delete: (cid: number) =>
    request<void>(`/cotizaciones/${cid}`, { method: 'DELETE' }),

  createSeccion: (cid: number, p: SeccionCreatePayload) =>
    request<CotizacionSeccion>(`/cotizaciones/${cid}/secciones`, {
      method: 'POST',
      body: JSON.stringify(p),
    }),
  updateSeccion: (sid: number, p: SeccionUpdatePayload) =>
    request<CotizacionSeccion>(`/cotizaciones/secciones/${sid}`, {
      method: 'PATCH',
      body: JSON.stringify(p),
    }),
  deleteSeccion: (sid: number) =>
    request<void>(`/cotizaciones/secciones/${sid}`, { method: 'DELETE' }),

  createItem: (sid: number, p: ItemCreatePayload) =>
    request<CotizacionItem>(`/cotizaciones/secciones/${sid}/items`, {
      method: 'POST',
      body: JSON.stringify(p),
    }),
  updateItem: (iid: number, p: ItemUpdatePayload) =>
    request<CotizacionItem>(`/cotizaciones/items/${iid}`, {
      method: 'PATCH',
      body: JSON.stringify(p),
    }),
  deleteItem: (iid: number) =>
    request<void>(`/cotizaciones/items/${iid}`, { method: 'DELETE' }),

  getDesviacion: (cid: number) =>
    request<DesviacionResumen>(`/cotizaciones/${cid}/desviacion`),
}
