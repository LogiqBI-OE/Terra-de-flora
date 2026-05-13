import type { CoberturaMatrix } from '../../../lib/api'
import { fmtBucketMensual, fmtBucketSemanal } from '../../../lib/format'
import CoberturaCell from './CoberturaCell'

export default function CoberturaTable({ matrix }: { matrix: CoberturaMatrix }) {
  const fmtBucket = matrix.granularidad === 'mensual' ? fmtBucketMensual : fmtBucketSemanal

  const headerSticky = { background: 'var(--bg-elevated-strong)' } as const
  const rowSticky = { background: 'var(--bg-card)' } as const

  return (
    <div className="overflow-auto">
      <table className="w-max min-w-full text-xs border-collapse">
        <thead>
          <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
            <th
              className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-app-muted sticky left-0 z-10"
              style={headerSticky}
            >
              SKU
            </th>
            <th
              className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-app-muted sticky z-10"
              style={{ ...headerSticky, left: 90 }}
            >
              Producto
            </th>
            <th className="px-2 py-2 text-right text-[10px] uppercase tracking-widest text-app-muted">U.</th>
            {matrix.buckets.map((b) => (
              <th
                key={b}
                className="px-2 py-2 text-right text-[10px] uppercase tracking-widest text-app-muted whitespace-nowrap border-l"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                {fmtBucket(b)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.filas.map((row) => (
            <tr key={row.producto_id} className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
              <td
                className="px-3 py-1.5 text-app-secondary font-mono sticky left-0 z-10 whitespace-nowrap"
                style={rowSticky}
              >
                {row.sku}
              </td>
              <td
                className="px-3 py-1.5 text-app sticky z-10 whitespace-nowrap"
                style={{ ...rowSticky, left: 90 }}
              >
                {row.producto}
              </td>
              <td className="px-2 py-1.5 text-right text-app-muted">{row.unidad}</td>
              {row.celdas.map((cell, idx) => (
                <CoberturaCell key={idx} cell={cell} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
