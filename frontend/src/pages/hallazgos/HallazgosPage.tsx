// Home: muestra los productos críticos del snapshot más reciente.
// Se compone de secciones:  KpiCards  +  HallazgosTable
//
// La lógica de "qué es crítico" la calcula HallazgosService a partir
// de la matriz de cobertura (sin nuevo endpoint backend).

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Card, { CardBody } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import {
  coberturaApi,
  snapshotsApi,
  type CoberturaMatrix,
  type Snapshot,
} from '../../lib/api'
import { calcularHallazgos, type Hallazgo } from './hallazgosService'
import KpiCards from './sections/KpiCards'
import HallazgosTable from './sections/HallazgosTable'

export default function HallazgosPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [matrix, setMatrix] = useState<CoberturaMatrix | null>(null)
  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const snaps = await snapshotsApi.list()
        const calc = snaps.find((s) => s.status === 'calculated') ?? snaps[0]
        if (!alive) return
        if (!calc) {
          setSnapshot(null)
          setLoading(false)
          return
        }
        setSnapshot(calc)
        const m = await coberturaApi.get(calc.id, { granularidad: 'semanal', n_buckets: 12 })
        if (!alive) return
        setMatrix(m)
        setHallazgos(calcularHallazgos(m))
      } catch {
        if (alive) setSnapshot(null)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  if (loading) {
    return (
      <AppShell title="Hallazgos">
        <div className="text-app-secondary text-sm">Cargando...</div>
      </AppShell>
    )
  }

  if (!snapshot) {
    return (
      <AppShell title="Hallazgos">
        <EmptyState
          title="Aún no hay datos cargados"
          description="Carga el primer dataset para empezar a ver hallazgos y proyectar cobertura."
          action={
            <Link to="/snapshots">
              <Button>Ir a Carga de datos</Button>
            </Link>
          }
        />
      </AppShell>
    )
  }

  return (
    <AppShell title="Hallazgos">
      <div className="max-w-6xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-app">Hallazgos</h2>
          <p className="text-sm text-app-secondary">
            Productos críticos en el snapshot más reciente: <strong>{snapshot.nombre}</strong>.
          </p>
        </div>

        <KpiCards hallazgos={hallazgos} matrix={matrix} />

        <Card>
          <CardBody>
            {hallazgos.length === 0 ? (
              <div className="text-app-secondary text-sm py-6 text-center">
                ✨ Sin productos en rojo en el horizonte de 12 semanas.
              </div>
            ) : (
              <HallazgosTable hallazgos={hallazgos} snapshotId={snapshot.id} />
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
