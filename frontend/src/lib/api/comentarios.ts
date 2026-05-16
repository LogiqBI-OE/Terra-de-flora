// API client para comentarios de proyecto. Acceso L5+.
import { request } from './client'

// Lista cerrada de emojis permitidos (mirror del backend)
export const ALLOWED_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '👀'] as const
export type AllowedEmoji = typeof ALLOWED_EMOJIS[number]

export interface ParentSnippet {
  id: number
  user_nombre: string
  texto: string
}

export interface ReaccionAgg {
  emoji: string
  count: number
  by_me: boolean
}

export interface Comentario {
  id: number
  proyecto_id: number
  user_id: number
  user_nombre: string
  user_iniciales: string
  user_email: string
  texto: string
  created_at: string
  edited_at: string | null
  parent_id: number | null
  parent: ParentSnippet | null
  reacciones: ReaccionAgg[]
}

export interface ComentarioCreatePayload {
  texto: string
  parent_id?: number | null
}

export interface ComentarioUpdatePayload {
  texto: string
}

export const comentariosApi = {
  list: (pid: number) => request<Comentario[]>(`/proyectos/${pid}/comentarios`),
  create: (pid: number, p: ComentarioCreatePayload) =>
    request<Comentario>(`/proyectos/${pid}/comentarios`, {
      method: 'POST',
      body: JSON.stringify(p),
    }),
  update: (pid: number, cid: number, p: ComentarioUpdatePayload) =>
    request<Comentario>(`/proyectos/${pid}/comentarios/${cid}`, {
      method: 'PATCH',
      body: JSON.stringify(p),
    }),
  delete: (pid: number, cid: number) =>
    request<void>(`/proyectos/${pid}/comentarios/${cid}`, { method: 'DELETE' }),
  toggleReaccion: (pid: number, cid: number, emoji: string) =>
    request<Comentario>(`/proyectos/${pid}/comentarios/${cid}/reaccion`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),
}
