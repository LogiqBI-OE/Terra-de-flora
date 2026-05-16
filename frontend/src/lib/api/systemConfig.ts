// API client para /system-config (solo level 9).
import { request } from './client'

export interface SystemConfigItem {
  key: string
  label: string
  description: string
  section: string       // ej. "Accesos", "Licencia", "Rendimiento"
  input_type: string    // "text" | "password" | "number" | "boolean"
  secret: boolean
  value: string
}

export interface RuntimeConfig {
  keep_warm_ping_enabled: boolean
  keep_warm_ping_interval_minutes: number
}

export const systemConfigApi = {
  list: () => request<SystemConfigItem[]>('/system-config'),
  update: (items: Record<string, string>) =>
    request<SystemConfigItem[]>('/system-config', {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    }),
  runtime: () => request<RuntimeConfig>('/system-config/runtime'),
}
