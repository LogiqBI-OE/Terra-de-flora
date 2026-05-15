// API client para pagos. Acceso L5+.
import { request } from './client'

export type TipoPago = 'deposito' | 'pago'
export type StatusPago = 'pendiente' | 'pagado' | 'vencido' | 'por_regresar' | 'regresado'

export interface PagoRow {
  id: number
  proyecto_id: number
  tipo: TipoPago
  orden: number
  monto: number | string
  fecha: string | null
  metodo: string | null
  status: StatusPago
  status_efectivo: StatusPago
  notas: string | null
  created_at: string
  updated_at: string
}

export interface PagosResumen {
  cotizacion_final: number | string
  cotizacion_id: number | null
  cotizacion_version: number | null
  cotizacion_origen: 'aprobada' | 'enviada' | 'sin_cotizacion'
  total_pagado: number | string
  pendiente: number | string
  alerta_regresar_deposito: boolean
}

export interface PagosTabResponse {
  resumen: PagosResumen
  deposito: PagoRow
  pagos: PagoRow[]
}

export interface PagoCreatePayload {
  monto?: number
  fecha?: string | null
  metodo?: string | null
  notas?: string | null
}

export interface PagoUpdatePayload {
  monto?: number
  fecha?: string | null
  metodo?: string | null
  status?: StatusPago
  notas?: string | null
}

export interface MetodoPago {
  id: number
  nombre: string
  orden: number
  is_active: boolean
}

export const pagosApi = {
  getTab: (pid: number) =>
    request<PagosTabResponse>(`/proyectos/${pid}/pagos`),
  createPago: (pid: number, p: PagoCreatePayload) =>
    request<PagoRow>(`/proyectos/${pid}/pagos`, {
      method: 'POST',
      body: JSON.stringify(p),
    }),
  update: (id: number, p: PagoUpdatePayload) =>
    request<PagoRow>(`/pagos/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
  delete: (id: number) =>
    request<void>(`/pagos/${id}`, { method: 'DELETE' }),

  listMetodos: () => request<MetodoPago[]>('/metodos-pago'),
}
