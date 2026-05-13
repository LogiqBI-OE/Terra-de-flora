import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Card, { CardBody } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import {
  catalogApi,
  coberturaApi,
  snapshotsApi,
  type CoberturaMatrix,
  type Planta,
  type Snapshot,
} from '../../lib/api'
import CoberturaToolbar from './sections/CoberturaToolbar'
import CoberturaTable from './sections/CoberturaTable'
import Legend from './sections/Legend'

export default function CoberturaPage() {
  const [params] = useSearchParams()
  const snapshotId = params.get('snapshot')

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [plantas, setPlantas] = useState<Planta[]>([])
  const [matrix, setMatrix] = useState<CoberturaMatrix | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [granularidad, setGranularidad] = useState<'semanal' | 'mensual'>('semanal')
  const [planta, setPlanta] = useState<string>('TODAS')
  const [nBuckets, setNBuckets] = useState<number>(12)

  // Snapshot info + catálogo de plantas (1 vez)
  useEffect(() => {
    if (!snapshotId) return
    snapshotsApi.get(Number(snapshotId)).then(setSnapshot).catch(() => setSnapshot(null))
    catalogApi.plantas().then(setPlantas).catch(() => setPlantas([]))
  }, [snapshotId])

  // Recalcular matriz cuando cambian filtros
  useEffect(() => {
    if (!snapshotId) return
    setLoading(true)
    setError(null)
    coberturaApi
      .get(Number(snapshotId), { granularidad, planta, n_buckets: nBuckets })
      .then(setMatrix)
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoading(false))
  }, [snapshotId, granularidad, planta, nBuckets])

  if (!snapshotId) {
    return (
      <AppShell title="Cobertura">
        <EmptyState
          title="Selecciona un snapshot"
          description="Abre un snapshot desde la lista para ver su matriz de cobertura."
        />
      </AppShell>
    )
  }

  return (
    <AppShell title={`Cobertura · ${snapshot?.nombre ?? `Snapshot #${snapshotId}`}`}>
      <div className="space-y-4">
        <Legend />

        <Card className="overflow-hidden">
          <CoberturaToolbar
            granularidad={granularidad}
            onChangeGranularidad={setGranularidad}
            planta={planta}
            onChangePlanta={setPlanta}
            plantas={plantas}
            nBuckets={nBuckets}
            onChangeNBuckets={setNBuckets}
          />
          {loading ? (
            <CardBody><div className="text-app-secondary text-sm">Calculando...</div></CardBody>
          ) : error ? (
            <CardBody><div className="text-sm text-danger">{error}</div></CardBody>
          ) : !matrix || matrix.filas.length === 0 ? (
            <CardBody>
              <div className="text-app-secondary text-sm">
                Aún no hay datos en este snapshot. Carga los 4 archivos (inventario, producción, compras y demanda).
              </div>
            </CardBody>
          ) : (
            <CoberturaTable matrix={matrix} />
          )}
        </Card>
      </div>
    </AppShell>
  )
}
