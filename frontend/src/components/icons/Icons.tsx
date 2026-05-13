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

// ── Monitores ────────────────────────────────────────────────────────────────
export function IconCobertura({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  )
}

export function IconDemanda({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  )
}

// ── Inputs ───────────────────────────────────────────────────────────────────
export function IconUpload({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

export function IconCatalog({ size, className, style }: IconProps) {
  return (
    <svg {...svgBase(size)} className={className} style={style}>
      <path d="M4 4h12a3 3 0 0 1 3 3v14H7a3 3 0 0 1-3-3z" />
      <path d="M4 19a3 3 0 0 1 3-3h12" />
    </svg>
  )
}

// ── Configuración ────────────────────────────────────────────────────────────
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
