// Item individual del sidebar: icono + label.
// Maneja 3 estados visuales:
//   - activo:     bg accent + texto accent + barra lateral
//   - inactivo:   texto secondary, hover bg
//   - disabled:   opacidad reducida, no clickeable, tooltip nativo

import { NavLink } from 'react-router-dom'
import type { NavItem } from './navConfig'

/** Mapa ruta → import dinámico del chunk. Al hover, disparamos el import
 *  para que Vite/browser empiece a descargar el JS. Si el usuario hace
 *  click, el chunk ya está listo o casi (instantáneo). */
const PREFETCH_MAP: Record<string, () => Promise<unknown>> = {
  '/proyectos':        () => import('../../pages/proyectos/ProyectosPage'),
  '/proyectos/nuevo':  () => import('../../pages/proyectos/NuevoProyectoPage'),
  '/muro-comentarios': () => import('../../pages/muro/MuroComentariosPage'),
  '/calendario':       () => import('../../pages/calendario/CalendarioPage'),
  '/clientes':         () => import('../../pages/catalogos/ClientesPage'),
  '/materiales':       () => import('../../pages/catalogos/MaterialesPage'),
  '/recetas':          () => import('../../pages/catalogos/RecetasPage'),
  '/usuarios':         () => import('../../pages/usuarios/UsuariosPage'),
  '/usuarios/log':     () => import('../../pages/usuarios/LogUsuariosPage'),
  '/configuracion':    () => import('../../pages/configuracion/ConfiguracionPage'),
}

const prefetched = new Set<string>()

function prefetchRoute(to: string) {
  if (prefetched.has(to)) return
  const fn = PREFETCH_MAP[to]
  if (!fn) return
  prefetched.add(to)
  fn().catch(() => prefetched.delete(to))  // si falla, permitir reintentar
}

interface Props {
  item: NavItem
}

const baseRow =
  'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition'

const iconBox = 'flex items-center justify-center shrink-0'

export default function SidebarItem({ item }: Props) {
  if (item.disabled) {
    return (
      <div
        title={item.hint ?? 'No disponible'}
        aria-disabled="true"
        className={`${baseRow} cursor-not-allowed`}
        style={{
          color: 'var(--sidebar-disabled-text)',
          opacity: 0.6,
        }}
      >
        <span className={iconBox}>{item.icon}</span>
        <span className="flex-1">{item.label}</span>
        <span
          className="text-[9px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded"
          style={{
            background: 'var(--sidebar-hover-bg)',
            color: 'var(--sidebar-text-muted)',
          }}
        >
          Pronto
        </span>
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      className={baseRow}
      onMouseEnter={() => prefetchRoute(item.to)}
      onFocus={() => prefetchRoute(item.to)}
      style={({ isActive }) => ({
        background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
        color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text-secondary)',
        fontWeight: isActive ? 600 : 400,
      })}
    >
      {({ isActive }) => (
        <>
          {/* Barra lateral de activo */}
          {isActive && (
            <span
              aria-hidden
              className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r"
              style={{ background: 'var(--sidebar-active-text)' }}
            />
          )}
          <span className={iconBox} style={{ color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text-muted)' }}>
            {item.icon}
          </span>
          <span className="flex-1">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}
