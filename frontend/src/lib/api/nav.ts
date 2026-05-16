// API client para /nav. Acceso autenticado para GET /nav; L9 para admin.
import { request } from './client'

export interface NavItemDTO {
  key: string
  to: string
  icon: string
  label: string
  orden: number
  section_id: number | null
  is_disabled: boolean
  hint: string | null
}

export interface NavSectionDTO {
  id: number
  key: string
  label: string
  orden: number
  items: NavItemDTO[]
}

export interface NavConfig {
  sections: NavSectionDTO[]
}

export interface NavItemAdminDTO extends NavItemDTO {
  min_level: number
  is_hidden: boolean
  in_registry: boolean
}

export interface NavSectionAdminDTO {
  id: number
  key: string
  label: string
  orden: number
  items: NavItemAdminDTO[]
}

export interface NavAdminConfig {
  sections: NavSectionAdminDTO[]
}

export interface NavSectionCreatePayload {
  key: string
  label: string
  orden?: number
}

export interface NavSectionUpdatePayload {
  label?: string
  orden?: number
}

export interface NavItemUpdatePayload {
  section_id?: number | null
  label?: string
  orden?: number
  min_level?: number
  is_hidden?: boolean
  is_disabled?: boolean
  hint?: string | null
}

export const navApi = {
  get: () => request<NavConfig>('/nav'),
  getAdmin: () => request<NavAdminConfig>('/nav/admin'),
  createSection: (p: NavSectionCreatePayload) =>
    request<NavSectionAdminDTO>('/nav/admin/sections', { method: 'POST', body: JSON.stringify(p) }),
  updateSection: (id: number, p: NavSectionUpdatePayload) =>
    request<NavSectionAdminDTO>(`/nav/admin/sections/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
  deleteSection: (id: number) =>
    request<void>(`/nav/admin/sections/${id}`, { method: 'DELETE' }),
  updateItem: (id: number, p: NavItemUpdatePayload) =>
    request<NavItemAdminDTO>(`/nav/admin/items/${id}`, { method: 'PATCH', body: JSON.stringify(p) }),
}
