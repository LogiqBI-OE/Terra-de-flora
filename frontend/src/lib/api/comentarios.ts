// API client para comentarios de proyecto. Acceso L5+.
import { request } from './client'

export interface Comentario {
  id: number
  proyecto_id: number
  user_id: number
  user_nombre: string
  user_iniciales: string
  user_email: string
  texto: string
  created_at: string
}

export interface ComentarioCreatePayload {
  texto: string
}

export const comentariosApi = {
  list: (pid: number) => request<Comentario[]>(`/proyectos/${pid}/comentarios`),
  create: (pid: number, p: ComentarioCreatePayload) =>
    request<Comentario>(`/proyectos/${pid}/comentarios`, {
      method: 'POST',
      body: JSON.stringify(p),
    }),
  delete: (pid: number, cid: number) =>
    request<void>(`/proyectos/${pid}/comentarios/${cid}`, { method: 'DELETE' }),
}
