import type { CoberturaMatrix } from '../../../lib/api'
import { fmtBucketMensual, fmtBucketSemanal } from '../../../lib/format'
import CoberturaCell from './CoberturaCell'

export default function CoberturaTable({ matrix }: { matrix: CoberturaMatrix }) {
  const fmtBucket = matrix.granularidad === 'mensual' ? fmtBucketMensual : fmtBucketSemanal

  return (
    <div className="overflow-auto">
      <table className="w-max min-w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500 sticky left-0 z-10" style={{ background: 'rgba(11,15,8,0.95)' }}>
              SKU
            </th>
            <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500 sticky z-10" style={{ left: 90, background: 'rgba(11,15,8,0.95)' }}>
              Producto
            </th>
            <th className="px-2 py-2 text-right text-[10px] uppercase tracking-widest text-slate-500">U.</th>
            {matrix.buckets.map((b) => (
              <th key={b} className="px-2 py-2 text-right text-[10px] uppercase tracking-widest text-slate-500 whitespace-nowrap border-l border-white/5">
                {fmtBucket(b)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.filas.map((row) => (
            <tr key={row.producto_id} className="border-b border-white/5">
              <td className="px-3 py-1.5 text-slate-300 font-mono sticky left-0 z-10 whitespace-nowrap" style={{ background: 'rgba(19,26,15,0.95)' }}>
                {row.sku}
              </td>
              <td className="px-3 py-1.5 text-white sticky z-10 whitespace-nowrap" style={{ left: 90, background: 'rgba(19,26,15,0.95)' }}>
                {row.producto}
              </td>
              <td className="px-2 py-1.5 text-right text-slate-500">{row.unidad}</td>
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
