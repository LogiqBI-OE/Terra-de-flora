import { API_URL, ApiError, request } from './client'

export type TipoUpload = 'inventario' | 'produccion' | 'compras' | 'demanda'

export interface UploadError {
  fila: number | null
  columna: string | null
  detalle: string
}

export interface UploadResult {
  tipo: TipoUpload
  archivo: string
  filas_ok: number
  filas_err: number
  errores: UploadError[]
}

export const uploadsApi = {
  async upload(snapshotId: number, tipo: TipoUpload, file: File): Promise<UploadResult> {
    const fd = new FormData()
    fd.append('file', file)
    // Usamos fetch directo porque request() pone Content-Type JSON.
    const token = JSON.parse(localStorage.getItem('oleolab.session') || 'null')?.token
    const res = await fetch(`${API_URL}/snapshots/${snapshotId}/upload/${tipo}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    })
    if (!res.ok) {
      let detail = res.statusText
      try {
        const body = await res.json()
        if (body?.detail) detail = body.detail
      } catch {
        /* ignore */
      }
      throw new ApiError(res.status, detail)
    }
    return res.json()
  },

  listTipos: () => request<Record<TipoUpload, { columnas: string[] }>>('/templates/'),
}
