// Configuración del menú lateral.
// Edita aquí para añadir/quitar páginas o secciones.
//
// requiresPermission?: si se especifica, solo se muestra a usuarios que tienen
// ese permiso en su sesión (LoginResponse.permissions).
// minLevel?: si se especifica, solo se muestra a usuarios con nivel >= N.

import type { ReactNode } from 'react'
import {
  IconAlerta,
  IconCatalog,
  IconCobertura,
  IconDemanda,
  IconManual,
  IconUpload,
  IconUsers,
} from '../icons/Icons'

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
    title: 'Monitores',
    items: [
      { to: '/hallazgos', label: 'Hallazgos', icon: <IconAlerta /> },
      { to: '/cobertura', label: 'Coberturas', icon: <IconCobertura /> },
      { to: '/demanda', label: 'Demanda', icon: <IconDemanda />, disabled: true, hint: 'Próximamente' },
    ],
  },
  {
    title: 'Inputs',
    items: [
      { to: '/snapshots', label: 'Carga de datos', icon: <IconUpload /> },
      { to: '/catalogos', label: 'Catálogos', icon: <IconCatalog />, requiresPermission: 'manage_catalogs' },
    ],
  },
  {
    title: 'Configuración',
    items: [
      { to: '/usuarios', label: 'Usuarios', icon: <IconUsers />, minLevel: 9 },
      { to: '/manual', label: 'Manual de uso', icon: <IconManual />, disabled: true, hint: 'Próximamente' },
    ],
  },
]
