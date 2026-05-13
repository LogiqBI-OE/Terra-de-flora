import { Link } from 'react-router-dom'
import type { Snapshot } from '../../../lib/api'
import { fmtDateTime } from '../../../lib/format'
import Badge from '../../../components/ui/Badge'

const STATUS_TONE: Record<Snapshot['status'], 'neutral' | 'green' | 'yellow' | 'red' | 'blue'> = {
  draft: 'neutral',
  uploading: 'yellow',
  ready: 'blue',
  calculated: 'green',
  error: 'red',
}

const STATUS_LABEL: Record<Snapshot['status'], string> = {
  draft: 'Borrador',
  uploading: 'Cargando',
  ready: 'Listo',
  calculated: 'Calculado',
  error: 'Error',
}

export default function SnapshotsTable({ rows }: { rows: Snapshot[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/5" style={{ background: 'rgba(19,26,15,0.6)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-widest text-slate-500 border-b border-white/5">
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Inv.</th>
            <th className="px-4 py-3 text-right">Prod.</th>
            <th className="px-4 py-3 text-right">Comp.</th>
            <th className="px-4 py-3 text-right">Dem.</th>
            <th className="px-4 py-3">Creado</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
              <td className="px-4 py-3 text-white font-medium">{s.nombre}</td>
              <td className="px-4 py-3">
                <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge>
              </td>
              <td className="px-4 py-3 text-right text-slate-300">{s.rows_inventario}</td>
              <td className="px-4 py-3 text-right text-slate-300">{s.rows_produccion}</td>
              <td className="px-4 py-3 text-right text-slate-300">{s.rows_compras}</td>
              <td className="px-4 py-3 text-right text-slate-300">{s.rows_demanda}</td>
              <td className="px-4 py-3 text-slate-400">{fmtDateTime(s.created_at)}</td>
              <td className="px-4 py-3 text-right space-x-3">
                <Link to={`/uploads?snapshot=${s.id}`} className="text-oleo-green hover:underline">
                  Cargar
                </Link>
                <Link to={`/cobertura?snapshot=${s.id}`} className="text-oleo-green hover:underline">
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
