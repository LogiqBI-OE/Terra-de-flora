import { request } from './client'

export type SnapshotStatus = 'draft' | 'uploading' | 'ready' | 'calculated' | 'error'

export interface Snapshot {
  id: number
  nombre: string
  status: SnapshotStatus
  notas: string | null
  usuario_id: number
  created_at: string
  calculated_at: string | null
  rows_inventario: number
  rows_produccion: number
  rows_compras: number
  rows_demanda: number
}

export const snapshotsApi = {
  list: () => request<Snapshot[]>('/snapshots'),

  create: (nombre: string, notas?: string) =>
    request<Snapshot>('/snapshots', {
      method: 'POST',
      body: JSON.stringify({ nombre, notas }),
    }),

  get: (id: number) => request<Snapshot>(`/snapshots/${id}`),

  delete: (id: number) =>
    request<void>(`/snapshots/${id}`, { method: 'DELETE' }),
}
