// Tabla principal de Hallazgos: ordenada por urgencia, con badge de color
// y link a la matriz para investigar el detalle.

import { Link } from 'react-router-dom'
import Badge from '../../../components/ui/Badge'
import { fmtBucketSemanal, fmtNumber } from '../../../lib/format'
import type { Hallazgo } from '../hallazgosService'

const TONO: Record<Hallazgo['worst_color'], 'red' | 'yellow' | 'green' | 'neutral'> = {
  red: 'red',
  yellow: 'yellow',
  green: 'green',
  white: 'neutral',
}

const LABEL: Record<Hallazgo['worst_color'], string> = {
  red: 'Sin cobertura',
  yellow: 'Requiere compras',
  green: 'Requiere producción',
  white: 'Cubierto',
}

interface Props {
  hallazgos: Hallazgo[]
  snapshotId: number
}

export default function HallazgosTable({ hallazgos, snapshotId }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-widest text-app-muted border-b" style={{ borderColor: 'var(--border-soft)' }}>
            <th className="px-3 py-3">SKU</th>
            <th className="px-3 py-3">Producto</th>
            <th className="px-3 py-3">Severidad</th>
            <th className="px-3 py-3">1er quiebre</th>
            <th className="px-3 py-3 text-right">Días</th>
            <th className="px-3 py-3 text-right">Déficit</th>
            <th className="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {hallazgos.map((h) => (
            <tr key={h.producto_id} className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
              <td className="px-3 py-2 font-mono text-app-secondary">{h.sku}</td>
              <td className="px-3 py-2 text-app">{h.producto}</td>
              <td className="px-3 py-2">
                <Badge tone={TONO[h.worst_color]}>{LABEL[h.worst_color]}</Badge>
              </td>
              <td className="px-3 py-2 text-app-secondary">
                {h.bucket_quiebre ? fmtBucketSemanal(h.bucket_quiebre) : '—'}
              </td>
              <td className="px-3 py-2 text-right text-app-secondary">
                {h.dias_hasta_quiebre !== null ? h.dias_hasta_quiebre : '—'}
              </td>
              <td className="px-3 py-2 text-right text-app-secondary">
                {h.deficit > 0 ? `${fmtNumber(h.deficit)} ${h.unidad}` : '—'}
              </td>
              <td className="px-3 py-2 text-right">
                <Link to={`/cobertura?snapshot=${snapshotId}`} className="text-accent hover:underline text-xs font-semibold">
                  Ver en matriz →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
