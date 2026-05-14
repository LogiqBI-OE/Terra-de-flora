// Configuración del menú lateral.
// Edita aquí para añadir/quitar páginas o secciones.
//
// requiresPermission?: si se especifica, solo se muestra a usuarios que tienen
// ese permiso en su sesión (LoginResponse.permissions).
// minLevel?: si se especifica, solo se muestra a usuarios con nivel >= N.

import type { ReactNode } from 'react'
import { IconManual, IconSettings, IconUsers } from '../icons/Icons'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  disabled?: boolean
  hint?: string
  requiresPermission?: string
  minLevel?: number
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Configuración',
    items: [
      { to: '/usuarios', label: 'Usuarios', icon: <IconUsers />, minLevel: 5 },
      { to: '/configuracion', label: 'System settings', icon: <IconSettings />, minLevel: 9 },
      { to: '/manual', label: 'Manual de uso', icon: <IconManual />, disabled: true, hint: 'Próximamente' },
    ],
  },
]
