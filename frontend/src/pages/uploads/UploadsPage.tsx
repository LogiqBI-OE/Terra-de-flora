import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Card, { CardBody, CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { snapshotsApi, type Snapshot, type TipoUpload, type UploadResult } from '../../lib/api'
import TemplateDownloader from './sections/TemplateDownloader'
import FileDropzone from './sections/FileDropzone'
import UploadStatus from './sections/UploadStatus'

const TIPOS_ORDEN: { tipo: TipoUpload; label: string }[] = [
  { tipo: 'inventario', label: 'Inventario' },
  { tipo: 'produccion', label: 'Producción' },
  { tipo: 'compras', label: 'Compras' },
  { tipo: 'demanda', label: 'Demanda' },
]

export default function UploadsPage() {
  const [params] = useSearchParams()
  const snapshotId = params.get('snapshot')
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [results, setResults] = useState<Record<string, UploadResult>>({})
  const navigate = useNavigate()

  useEffect(() => {
    if (!snapshotId) return
    snapshotsApi.get(Number(snapshotId)).then(setSnapshot).catch(() => setSnapshot(null))
  }, [snapshotId])

  const todosCargados = useMemo(
    () => TIPOS_ORDEN.every((t) => results[t.tipo] && results[t.tipo].filas_ok > 0),
    [results],
  )

  function handleResult(tipo: TipoUpload, r: UploadResult) {
    setResults((prev) => ({ ...prev, [tipo]: r }))
    if (snapshotId) snapshotsApi.get(Number(snapshotId)).then(setSnapshot)
  }

  if (!snapshotId) {
    return (
      <AppShell title="Subir datos">
        <EmptyState
          title="Falta seleccionar un snapshot"
          description="Crea uno nuevo desde la pantalla de Snapshots o abre uno existente."
          action={
            <Button onClick={() => navigate('/snapshots')}>Ir a Snapshots</Button>
          }
        />
      </AppShell>
    )
  }

  return (
    <AppShell title={`Subir datos · Snapshot #${snapshotId}`}>
      <div className="max-w-5xl space-y-6">
        {/* Header del snapshot */}
        {snapshot && (
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-slate-500">Snapshot</div>
                  <div className="text-xl font-bold text-white">{snapshot.nombre}</div>
                </div>
                {todosCargados && (
                  <Button onClick={() => navigate(`/cobertura?snapshot=${snapshotId}`)}>
                    Ver cobertura →
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Templates */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-white">1. Descarga los templates</h3>
            <p className="text-xs text-slate-500 mt-1">
              Usa SIEMPRE estos formatos. Si el archivo no empata las columnas, se rechazará el upload.
            </p>
          </CardHeader>
          <CardBody>
            <TemplateDownloader />
          </CardBody>
        </Card>

        {/* Uploads */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-white">2. Sube los 4 archivos</h3>
            <p className="text-xs text-slate-500 mt-1">
              Cada nuevo upload <strong>reemplaza</strong> el dataset anterior en este snapshot.
            </p>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TIPOS_ORDEN.map((t) => (
                <div key={t.tipo}>
                  <FileDropzone
                    snapshotId={Number(snapshotId)}
                    tipo={t.tipo}
                    label={t.label}
                    onResult={(r) => handleResult(t.tipo, r)}
                  />
                  {results[t.tipo] && <UploadStatus result={results[t.tipo]} />}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="text-right">
          <Link to={`/cobertura?snapshot=${snapshotId}`} className="text-oleo-green hover:underline text-sm font-semibold">
            Ir a calcular cobertura →
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
