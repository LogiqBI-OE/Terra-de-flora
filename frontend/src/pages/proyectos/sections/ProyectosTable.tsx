// Tabla del gestor de proyectos — alimentada por el backend real.

import type { ProyectoRow } from '../../../lib/api'
import { fmtMoney } from '../../../lib/format'

interface Props {
  rows: ProyectoRow[]
  onClick?: (p: ProyectoRow) => void
}

const TIPO_EMOJI: Record<string, string> = {
  boda: '💐', iglesia: '⛪', bautizo: '👶', cumple: '🎂',
  xv: '👑', corporativo: '🏢', otro: '🎉',
}
const TIPO_LABEL: Record<string, string> = {
  boda: 'Boda', iglesia: 'Iglesia', bautizo: 'Bautizo', cumple: 'Cumpleaños',
  xv: 'XV años', corporativo: 'Corporativo', otro: 'Otro',
}

const ESTADO_EMOJI: Record<string, string> = {
  cotizando: '🔥', aprobado: '✅', produccion: '🌷',
  montaje: '🚚', entregado: '🎉', cancelado: '✖️',
}
const ESTADO_LABEL: Record<string, string> = {
  cotizando: 'Cotizando', aprobado: 'Aprobado', produccion: 'Producción',
  montaje: 'Montaje', entregado: 'Entregado', cancelado: 'Cancelado',
}
const ESTADO_COLORS: Record<string, { bg: string; text: string }> = {
  cotizando: { bg: 'rgba(245, 158, 11, 0.18)', text: '#D97706' },
  aprobado: { bg: 'rgba(16, 185, 129, 0.18)', text: '#059669' },
  produccion: { bg: 'rgba(14, 165, 233, 0.18)', text: '#0284C7' },
  montaje: { bg: 'rgba(139, 92, 246, 0.18)', text: '#7C3AED' },
  entregado: { bg: 'rgba(244, 63, 94, 0.18)', text: '#E11D48' },
  cancelado: { bg: 'rgba(148, 163, 184, 0.18)', text: '#475569' },
}

function fmtFecha(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtFechaDM(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00')
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })
}

export default function ProyectosTable({ rows, onClick }: Props) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-app-muted">
        No hay proyectos que coincidan con los filtros.
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-left text-[11px] uppercase tracking-widest text-app-muted border-b"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <th className="px-4 py-3 font-semibold">Proyecto</th>
            <th className="px-4 py-3 font-semibold">Nombre</th>
            <th className="px-4 py-3 font-semibold">Cliente</th>
            <th className="px-4 py-3 font-semibold">Vendedor</th>
            <th className="px-4 py-3 font-semibold">Tipo</th>
            <th className="px-4 py-3 font-semibold">Fecha evento</th>
            <th className="px-4 py-3 font-semibold text-right">Valor</th>
            <th className="px-4 py-3 font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const colors = ESTADO_COLORS[p.estado] ?? { bg: 'var(--bg-toggle)', text: 'var(--text-secondary)' }
            return (
              <tr
                key={p.id}
                className="border-b cursor-pointer hover:bg-[var(--bg-hover)]"
                style={{ borderColor: 'var(--border-soft)' }}
                onClick={() => onClick?.(p)}
              >
                <td className="px-4 py-3 font-mono text-xs text-app-secondary">#{p.codigo}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-app">{p.nombre}</div>
                  {p.descripcion && (
                    <div className="text-[11px] uppercase tracking-wider text-app-muted truncate max-w-xs">
                      {p.descripcion}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-app">{p.cliente_nombre}</div>
                  <div className="text-[11px] text-app-muted">
                    {p.cliente_tipo === 'PM' ? '🏢' : '📞'} {p.cliente_telefono ?? '—'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-app">{p.vendedor_nombre ?? '—'}</div>
                  {p.vendedor_username && (
                    <div className="text-[11px] text-app-muted">@{p.vendedor_username}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
                  >
                    <span>{TIPO_EMOJI[p.tipo] ?? '🎉'}</span>
                    <span>{TIPO_LABEL[p.tipo] ?? p.tipo}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-app">{fmtFecha(p.fecha_evento)}</div>
                  <div className="text-[11px] text-app-muted">Creado {fmtFechaDM(p.created_at)}</div>
                </td>
                <td className="px-4 py-3 text-right font-bold text-app">{fmtMoney(p.valor_estimado)}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    <span>{ESTADO_EMOJI[p.estado] ?? '•'}</span>
                    <span>{ESTADO_LABEL[p.estado] ?? p.estado}</span>
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
