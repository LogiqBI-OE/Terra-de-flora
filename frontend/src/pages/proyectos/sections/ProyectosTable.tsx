// Tabla del gestor de proyectos.

import {
  ESTADOS_PROYECTO,
  estadoMeta,
  fmtFechaCorta,
  fmtFechaDM,
  fmtMoneyFull,
  tipoMeta,
  type Proyecto,
} from '../data/mockData'

interface Props {
  rows: Proyecto[]
}

// Mapeo de colores para chips de estado. Usa rgba/hex Tailwind-like
const ESTADO_COLORS: Record<string, { bg: string; text: string }> = {
  cotizando: { bg: 'rgba(245, 158, 11, 0.18)', text: '#D97706' },
  aprobado: { bg: 'rgba(16, 185, 129, 0.18)', text: '#059669' },
  produccion: { bg: 'rgba(14, 165, 233, 0.18)', text: '#0284C7' },
  montaje: { bg: 'rgba(139, 92, 246, 0.18)', text: '#7C3AED' },
  entregado: { bg: 'rgba(244, 63, 94, 0.18)', text: '#E11D48' },
}

export default function ProyectosTable({ rows }: Props) {
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
            <th className="px-4 py-3 font-semibold text-right">Coment.</th>
            <th className="px-4 py-3 font-semibold text-right">Valor</th>
            <th className="px-4 py-3 font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => {
            const tipo = tipoMeta(p.tipo)
            const estado = estadoMeta(p.estado)
            const colors = ESTADO_COLORS[p.estado]
            return (
              <tr
                key={p.id}
                className="border-b cursor-pointer hover:bg-[var(--bg-hover)]"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <td className="px-4 py-3 font-mono text-xs text-app-secondary">#{p.codigo}</td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-app">{p.nombre}</div>
                  <div className="text-[11px] uppercase tracking-wider text-app-muted">
                    {p.descripcion}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-app">{p.cliente.nombre}</div>
                  <div className="text-[11px] text-app-muted flex items-center gap-1">
                    {p.cliente.tipo === 'PM' ? '🏢' : '📞'} {p.cliente.telefono}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-app">{p.vendedor_nombre}</div>
                  <div className="text-[11px] text-app-muted">@{p.vendedor_handle}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
                  >
                    <span>{tipo.emoji}</span>
                    <span>{tipo.label}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-app">{fmtFechaCorta(p.fecha_evento)}</div>
                  <div className="text-[11px] text-app-muted">Creado {fmtFechaDM(p.fecha_creacion)}</div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-app">{p.comentarios}</td>
                <td className="px-4 py-3 text-right font-bold text-app">{fmtMoneyFull(p.valor)}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    <span>{estado.emoji}</span>
                    <span>{estado.label}</span>
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

// Re-export por si lo quieres usar en filtros
export { ESTADOS_PROYECTO }
