// Tab Folio — el formulario del proyecto en modo edicion.
// Usa el mismo ProyectoForm que NuevoProyectoPage, pero hace PATCH en lugar de POST.

import { useEffect, useMemo, useState } from 'react'
import Button from '../../../components/ui/Button'
import {
  ApiError,
  clientesApi,
  proyectosApi,
  type Cliente,
  type ProyectoCatalog,
  type ProyectoRow,
} from '../../../lib/api'
import ProyectoForm, {
  buildPayload,
  canSubmit,
  formStateFromProyecto,
  loadFormDeps,
  type ProyectoFormState,
} from './ProyectoForm'

interface Props {
  proyecto: ProyectoRow
  onUpdated: (p: ProyectoRow) => void
}

export default function FolioTab({ proyecto, onUpdated }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [catalog, setCatalog] = useState<ProyectoCatalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const initial = useMemo(() => formStateFromProyecto(proyecto, null), [proyecto.id])
  const [form, setForm] = useState<ProyectoFormState>(initial)

  // Cargar deps + hidratar cliente
  useEffect(() => {
    let alive = true
    Promise.all([loadFormDeps(), clientesApi.list()])
      .then(([deps, allClientes]) => {
        if (!alive) return
        setClientes(deps.clientes)
        setCatalog(deps.catalog)
        const cli = allClientes.find((c) => c.id === proyecto.cliente_id) ?? null
        setForm(formStateFromProyecto(proyecto, cli))
      })
      .catch(console.error)
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [proyecto.id])

  // Detectar cambios vs initial para habilitar el boton de Guardar
  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial])

  async function handleSave() {
    if (!canSubmit(form)) return
    setBusy(true); setError(null)
    try {
      const updated = await proyectosApi.update(proyecto.id, buildPayload(form))
      onUpdated(updated)
      setToast('Cambios guardados')
      setTimeout(() => setToast(null), 2200)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar')
    } finally {
      setBusy(false)
    }
  }

  function handleDiscard() {
    setForm(initial)
    setError(null)
  }

  if (loading || !catalog) {
    return <div className="py-12 text-center text-sm text-app-muted">Cargando…</div>
  }

  return (
    <div className="space-y-5">
      {(dirty || error) && (
        <div
          className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm"
          style={{
            background: error ? 'var(--danger-bg)' : 'var(--accent-bg-soft)',
            borderColor: error ? 'var(--danger-border)' : 'var(--accent)',
            color: error ? 'var(--danger)' : 'var(--accent-text)',
          }}
        >
          <span className="font-medium">
            {error ?? 'Tienes cambios sin guardar.'}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleDiscard} disabled={busy}>Descartar</Button>
            <Button onClick={handleSave} disabled={!canSubmit(form) || busy}>
              {busy ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      )}

      <ProyectoForm
        value={form}
        onChange={setForm}
        catalog={catalog}
        clientes={clientes}
        onClienteCreated={(c) => setClientes((prev) => [c, ...prev])}
      />

      {toast && (
        <div
          className="fixed bottom-6 right-6 px-4 py-3 rounded-lg text-sm text-app shadow-lg border z-50"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
