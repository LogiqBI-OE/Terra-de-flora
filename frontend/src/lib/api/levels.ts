// API: niveles + matriz de permisos (solo level 9).
import { request } from './client'

export interface LevelDetail {
  level: number
  label: string
  description: string
  is_reserved: boolean
  permissions: string[]
}

export interface LevelsPayload {
  levels: LevelDetail[]
  permissions: string[]
  restricted: string[]
}

export const levelsApi = {
  list: () => request<LevelsPayload>('/system/levels'),
  updateMeta: (level: number, body: { label?: string; description?: string }) =>
    request<LevelDetail>(`/system/levels/${level}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  updateMatrix: (matrix: Record<number, string[]>) =>
    request<LevelsPayload>('/system/levels/matrix', {
      method: 'PATCH',
      body: JSON.stringify({ matrix }),
    }),
}
