// Configuración del menú lateral.
// Edita aquí para añadir/quitar páginas o secciones.
//
// requiresPermission?: si se especifica, solo se muestra a usuarios que tienen
// ese permiso en su sesión (LoginResponse.permissions).
// minLevel?: si se especifica, solo se muestra a usuarios con nivel >= N.
// disabled: marca el item como "Pronto" (visualmente atenuado, no clickeable).

import type { ReactNode } from 'react'
import {
  IconBox,
  IconBriefcase,
  IconCalendar,
  IconChart,
  IconHome,
  IconManual,
  IconMegaphone,
  IconNetwork,
  IconSettings,
  IconUserCircle,
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
    title: 'Navegación',
    items: [
      { to: '/', label: 'Inicio', icon: <IconHome /> },
    ],
  },
  {
    title: 'Proyectos',
    items: [
      { to: '/proyectos', label: 'Gestor de proyectos', icon: <IconBriefcase />, disabled: true, hint: 'Próximamente' },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { to: '/calendario', label: 'Calendario', icon: <IconCalendar />, disabled: true, hint: 'Próximamente' },
      { to: '/reportes', label: 'Reportes', icon: <IconChart />, disabled: true, hint: 'Próximamente' },
    ],
  },
  {
    title: 'Community',
    items: [
      { to: '/redes', label: 'Redes', icon: <IconNetwork />, disabled: true, hint: 'Próximamente' },
      { to: '/campanas', label: 'Campañas', icon: <IconMegaphone />, disabled: true, hint: 'Próximamente' },
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { to: '/clientes', label: 'Clientes', icon: <IconUserCircle />, disabled: true, hint: 'Próximamente' },
      { to: '/materiales', label: 'Materiales y proveedores', icon: <IconBox />, disabled: true, hint: 'Próximamente' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { to: '/usuarios', label: 'Usuarios', icon: <IconUsers />, minLevel: 5 },
      { to: '/configuracion', label: 'System settings', icon: <IconSettings />, minLevel: 9 },
      { to: '/manual', label: 'Manual de uso', icon: <IconManual />, disabled: true, hint: 'Próximamente' },
    ],
  },
]
