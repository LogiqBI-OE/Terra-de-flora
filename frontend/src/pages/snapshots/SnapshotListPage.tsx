import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Card, { CardBody, CardHeader } from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import TemplateDownloader from '../uploads/sections/TemplateDownloader'
import { snapshotsApi, type Snapshot } from '../../lib/api'
import NewSnapshotButton from './sections/NewSnapshotButton'
import SnapshotsTable from './sections/SnapshotsTable'

export default function SnapshotListPage() {
  const [rows, setRows] = useState<Snapshot[] | null>(null)

  useEffect(() => {
    snapshotsApi.list().then(setRows).catch(() => setRows([]))
  }, [])

  return (
    <AppShell title="Carga de datos">
      <div className="max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app">Carga de datos</h2>
            <p className="text-sm text-app-secondary">
              Cada carga genera un <strong>snapshot</strong> con los 4 datasets (inventario, producción, compras y demanda) usados para calcular cobertura.
            </p>
          </div>
          <NewSnapshotButton />
        </div>

        {/* Sección de plantillas (descarga directa, sin necesidad de snapshot) */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-app">Plantillas Excel</h3>
            <p className="text-xs text-app-muted mt-1">
              Descarga el formato esperado. Si el archivo no empata las columnas, se rechaza el upload.
            </p>
          </CardHeader>
          <CardBody>
            <TemplateDownloader />
          </CardBody>
        </Card>

        {/* Histórico de cargas */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-app">Historial</h3>
            <p className="text-xs text-app-muted mt-1">
              Todas las cargas (snapshots) creadas en el workspace.
            </p>
          </CardHeader>
          <CardBody className="!px-0 !py-0">
            {rows === null ? (
              <div className="text-app-secondary text-sm px-5 py-6">Cargando...</div>
            ) : rows.length === 0 ? (
              <div className="px-5 py-2 pb-5">
                <EmptyState
                  title="No hay cargas todavía"
                  description="Crea la primera y sube los 4 archivos (inventario, producción, compras, demanda)."
                  action={<NewSnapshotButton />}
                />
              </div>
            ) : (
              <SnapshotsTable rows={rows} />
            )}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  )
}
