// API client para /system-config (solo level 9).
import { request } from './client'

export interface SystemConfigItem {
  key: string
  label: string
  description: string
  secret: boolean
  value: string
}

export const systemConfigApi = {
  list: () => request<SystemConfigItem[]>('/system-config'),
  update: (items: Record<string, string>) =>
    request<SystemConfigItem[]>('/system-config', {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    }),
}
