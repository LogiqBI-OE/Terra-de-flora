// API client para /calendario. Acceso L5+.
import { request } from './client'

export type TipoEvento = 'junta' | 'llamada' | 'pendiente' | 'custom'
export type EventoKind = 'evento' | 'proyecto'

export interface ParticipanteEvento {
  user_id: number
  nombre: string
  iniciales: string
}

export interface Evento {
  id: number
  kind: EventoKind
  tipo: TipoEvento | null  // null para sintéticos
  titulo: string
  descripcion: string | null
  start_at: string
  end_at: string | null
  all_day: boolean
  proyecto_id: number | null
  proyecto_codigo: string | null
  proyecto_nombre: string | null
  owner_id: number | null
  owner_nombre: string | null
  is_done: boolean
  is_mine: boolean
  can_edit: boolean
  participantes: ParticipanteEvento[]
}

export interface EventoCreatePayload {
  tipo?: TipoEvento
  titulo: string
  descripcion?: string | null
  start_at: string
  end_at?: string | null
  all_day?: boolean
  proyecto_id?: number | null
  participante_ids?: number[]
  is_done?: boolean
}

export interface EventoUpdatePayload {
  tipo?: TipoEvento
  titulo?: string
  descripcion?: string | null
  start_at?: string
  end_at?: string | null
  all_day?: boolean
  proyecto_id?: number | null
  participante_ids?: number[]
  is_done?: boolean
}

export const eventosApi = {
  /** Lista de eventos en un rango (YYYY-MM-DD inclusivo). */
  list: (from: string, to: string) =>
    request<Evento[]>(`/calendario?from=${from}&to=${to}`),
  create: (p: EventoCreatePayload) =>
    request<Evento>('/calendario', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: number, p: EventoUpdatePayload) =>
    request<Evento>(`/calendario/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
  delete: (id: number) => request<void>(`/calendario/${id}`, { method: 'DELETE' }),
}
