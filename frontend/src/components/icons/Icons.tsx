// Iconos inline estilo Heroicons (outline, stroke-width 1.75).
// Heredan tamaño/color de currentColor + props.
//
// Para añadir un icono nuevo, copia un <svg> Heroicon y exporta una función.

import type { CSSProperties } from 'react'

interface IconProps {
  size?: number
  className?: string
  style?: CSSProperties
}

const svgBase = (size = 18) =>
  ({
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  })

export function IconSettings({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export function IconHelp({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function IconBell({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

export function IconChevronDown({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function IconEdit({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function IconTrash({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

export function IconPlus({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function IconUsers({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function IconManual({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h8" />
    </svg>
  )
}

// ── Navegación / Proyectos ─────────────────────────────────────────────────
export function IconHome({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
    </svg>
  )
}

export function IconBriefcase({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  )
}

export function IconCalendar({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

export function IconChart({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 4 5-6" />
    </svg>
  )
}

// ── Community ──────────────────────────────────────────────────────────────
export function IconNetwork({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M12 7v4M12 11l-5.5 6M12 11l5.5 6" />
    </svg>
  )
}

export function IconMegaphone({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <path d="M3 11v2a2 2 0 0 0 2 2h1l4 4V5L6 9H5a2 2 0 0 0-2 2z" />
      <path d="M14 7s3 1.5 3 5-3 5-3 5" />
    </svg>
  )
}

// ── Catálogos ──────────────────────────────────────────────────────────────
export function IconUserCircle({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

export function IconSearch({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}

export function IconChevronRight({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <polyline points="9 6 15 12 9 18" />
    </svg>
  )
}

export function IconBuilding({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
    </svg>
  )
}

export function IconX({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  )
}

export function IconRecipe({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  )
}

export function IconBox({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <path d="M21 8l-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  )
}
