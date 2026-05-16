// Componentes de skeleton loader para sentir las páginas "instantáneas".
// La estructura visual aparece de inmediato (chunks bajan en ms), y los
// placeholders grises se reemplazan con datos reales cuando llega la API.

import type { CSSProperties } from 'react'

interface BoxProps {
  width?: number | string
  height?: number | string
  className?: string
  style?: CSSProperties
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

const ROUND: Record<NonNullable<BoxProps['rounded']>, string> = {
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
}

export function SkeletonBox({ width, height = 14, className, style, rounded = 'md' }: BoxProps) {
  return (
    <div
      className={`${ROUND[rounded]} skeleton-pulse ${className ?? ''}`}
      style={{
        width: width ?? '100%',
        height,
        background: 'var(--bg-toggle)',
        ...style,
      }}
    />
  )
}

/** Filas de tabla skeleton (para listados). */
export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-3 px-4 py-2 opacity-70">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBox key={i} width={i === 0 ? 80 : '100%'} height={10} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonBox key={c} width={c === 0 ? 80 : '100%'} height={14} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Cards en grid (para gestores con KPIs / proyectos). */
export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)' }}>
          <SkeletonBox width={80} height={10} className="mb-2" />
          <SkeletonBox width={120} height={24} />
        </div>
      ))}
    </div>
  )
}

/** Inline pulse style. Se aplica via clase `skeleton-pulse` en index.css. */
