// Configuración del menú lateral.
// Edita aquí para añadir/quitar páginas o secciones.

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
import type { Role } from '../../lib/api'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  roles: Role[]
  disabled?: boolean
  hint?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Monitores',
    items: [
      {
        to: '/hallazgos',
        label: 'Hallazgos',
        icon: <IconAlerta />,
        roles: ['admin', 'cliente'],
      },
      {
        to: '/cobertura',
        label: 'Coberturas',
        icon: <IconCobertura />,
        roles: ['admin', 'cliente'],
      },
      {
        to: '/demanda',
        label: 'Demanda',
        icon: <IconDemanda />,
        roles: ['admin', 'cliente'],
        disabled: true,
        hint: 'Próximamente',
      },
    ],
  },
  {
    title: 'Inputs',
    items: [
      {
        to: '/snapshots',
        label: 'Carga de datos',
        icon: <IconUpload />,
        roles: ['admin', 'cliente'],
      },
      {
        to: '/catalogos',
        label: 'Catálogos',
        icon: <IconCatalog />,
        roles: ['admin', 'cliente'],
      },
    ],
  },
  {
    title: 'Configuración',
    items: [
      {
        to: '/usuarios',
        label: 'Usuarios',
        icon: <IconUsers />,
        roles: ['admin'],
      },
      {
        to: '/manual',
        label: 'Manual de uso',
        icon: <IconManual />,
        roles: ['admin', 'cliente'],
        disabled: true,
        hint: 'Próximamente',
      },
    ],
  },
]
