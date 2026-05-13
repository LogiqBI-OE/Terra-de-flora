import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import EmptyState from '../../components/ui/EmptyState'
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
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-app">Carga de datos</h2>
            <p className="text-sm text-app-secondary">
              Cada carga genera un <strong>snapshot</strong> con los 4 datasets (inventario, producción, compras y demanda) usados para calcular cobertura.
            </p>
          </div>
          <NewSnapshotButton />
        </div>

        {rows === null ? (
          <div className="text-app-secondary text-sm">Cargando...</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No hay cargas todavía"
            description="Crea la primera y sube los 4 archivos (inventario, producción, compras, demanda)."
            action={<NewSnapshotButton />}
          />
        ) : (
          <SnapshotsTable rows={rows} />
        )}
      </div>
    </AppShell>
  )
}
