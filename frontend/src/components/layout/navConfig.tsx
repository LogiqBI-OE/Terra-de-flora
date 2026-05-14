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
  IconRecipe,
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
    title: 'Gestión',
    items: [
      { to: '/', label: 'Inicio', icon: <IconHome /> },
      { to: '/proyectos', label: 'Gestor de proyectos', icon: <IconBriefcase /> },
      { to: '/calendario', label: 'Calendario', icon: <IconCalendar />, disabled: true, hint: 'Próximamente' },
      { to: '/reportes', label: 'Reportes', icon: <IconChart />, disabled: true, hint: 'Próximamente' },
    ],
  },
  {
    title: 'Community Management',
    items: [
      { to: '/redes', label: 'Redes', icon: <IconNetwork />, disabled: true, hint: 'Próximamente' },
      { to: '/campanas', label: 'Campañas', icon: <IconMegaphone />, disabled: true, hint: 'Próximamente' },
    ],
  },
  {
    title: 'Catálogos',
    items: [
      { to: '/clientes', label: 'Clientes', icon: <IconUserCircle /> },
      { to: '/materiales', label: 'Materiales y proveedores', icon: <IconBox /> },
      { to: '/recetas', label: 'Recetas', icon: <IconRecipe /> },
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
