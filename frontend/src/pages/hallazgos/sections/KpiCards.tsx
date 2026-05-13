// Tres tarjetas con KPIs principales del snapshot actual.

import Card, { CardBody } from '../../../components/ui/Card'
import { fmtNumber } from '../../../lib/format'
import type { CoberturaMatrix } from '../../../lib/api'
import type { Hallazgo } from '../hallazgosService'

interface Props {
  hallazgos: Hallazgo[]
  matrix: CoberturaMatrix | null
}

export default function KpiCards({ hallazgos, matrix }: Props) {
  const totalProductos = matrix?.filas.length ?? 0
  const enRojo = hallazgos.filter((h) => h.worst_color === 'red').length
  const enRiesgo = hallazgos.filter((h) => h.worst_color === 'yellow').length

  const items = [
    { titulo: 'Productos monitoreados', valor: fmtNumber(totalProductos), tono: 'var(--text-primary)' },
    { titulo: 'En rojo (sin cobertura)', valor: fmtNumber(enRojo), tono: 'var(--danger)' },
    { titulo: 'En amarillo (riesgo)', valor: fmtNumber(enRiesgo), tono: 'var(--warning)' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((it) => (
        <Card key={it.titulo}>
          <CardBody>
            <div className="text-xs tracking-widest uppercase text-app-muted mb-2">{it.titulo}</div>
            <div className="text-4xl font-bold" style={{ color: it.tono }}>
              {it.valor}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
