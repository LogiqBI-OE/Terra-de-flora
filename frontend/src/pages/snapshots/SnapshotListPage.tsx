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
    <AppShell title="Snapshots">
      <div className="max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Snapshots</h2>
            <p className="text-sm text-slate-400">Fotografías de inventario + producción + compras + demanda usadas para calcular cobertura.</p>
          </div>
          <NewSnapshotButton />
        </div>

        {rows === null ? (
          <div className="text-slate-400 text-sm">Cargando...</div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No hay snapshots todavía"
            description="Crea el primero y carga los 4 archivos (inventario, producción, compras, demanda)."
            action={<NewSnapshotButton />}
          />
        ) : (
          <SnapshotsTable rows={rows} />
        )}
      </div>
    </AppShell>
  )
}
