import { request } from './client'
import type { ColorCobertura } from '../colors'

export interface CoberturaCell {
  balance: number
  color: ColorCobertura
}

export interface CoberturaRow {
  producto_id: number
  sku: string
  producto: string
  unidad: string
  celdas: CoberturaCell[]
}

export interface CoberturaMatrix {
  snapshot_id: number
  granularidad: 'semanal' | 'mensual'
  planta: string
  buckets: string[]   // ISO dates
  filas: CoberturaRow[]
}

export interface CoberturaParams {
  granularidad?: 'semanal' | 'mensual'
  planta?: string         // 'TODAS' o código
  n_buckets?: number
}

export const coberturaApi = {
  get: (snapshotId: number, params: CoberturaParams = {}) => {
    const qs = new URLSearchParams()
    if (params.granularidad) qs.set('granularidad', params.granularidad)
    if (params.planta) qs.set('planta', params.planta)
    if (params.n_buckets) qs.set('n_buckets', String(params.n_buckets))
    const q = qs.toString()
    return request<CoberturaMatrix>(`/snapshots/${snapshotId}/cobertura${q ? '?' + q : ''}`)
  },
}
