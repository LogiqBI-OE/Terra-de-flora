// Crear evento — usa el componente ProyectoForm compartido.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import { IconChevronRight } from '../../components/icons/Icons'
import { ApiError, proyectosApi, type Cliente, type ProyectoCatalog } from '../../lib/api'
import ProyectoForm, {
  buildPayload,
  canSubmit,
  emptyFormState,
  loadFormDeps,
  type ProyectoFormState,
} from './sections/ProyectoForm'

export default function NuevoProyectoPage() {
  const navigate = useNavigate()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [catalog, setCatalog] = useState<ProyectoCatalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<ProyectoFormState>(emptyFormState())

  useEffect(() => {
    loadFormDeps()
      .then(({ clientes, catalog }) => {
        setClientes(clientes); setCatalog(catalog)
        if (catalog.vendedores.length > 0) {
          setForm((f) => ({ ...f, vendedor: catalog.vendedores[0].id }))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit() {
    if (!canSubmit(form)) return
    setBusy(true); setError(null)
    try {
      const p = await proyectosApi.create(buildPayload(form))
      navigate(`/proyectos/${p.id}`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al crear el proyecto')
    } finally { setBusy(false) }
  }

  return (
    <AppShell title="Crear evento">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-app-muted mb-1">
              <button onClick={() => navigate('/proyectos')} className="hover:text-app transition">
                Mis Proyectos
              </button>
              <IconChevronRight size={12} />
              <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>Nuevo registro</span>
            </div>
            <h1 className="text-2xl font-bold text-app">Crear evento</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/proyectos')}>Cancelar</Button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit(form) || busy}
              className="px-5 py-2 rounded-lg text-sm font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)', color: 'var(--text-on-accent)', boxShadow: '0 6px 20px var(--accent-shadow)' }}
            >
              {busy ? 'Creando…' : 'Guardar evento'}
            </button>
          </div>
        </div>

        {error && (
          <div
            className="rounded-lg border px-4 py-3 text-sm"
            style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)', color: 'var(--danger)' }}
          >
            {error}
          </div>
        )}

        {loading || !catalog ? (
          <div className="py-12 text-center text-sm text-app-muted">Cargando…</div>
        ) : (
          <ProyectoForm
            value={form}
            onChange={setForm}
            catalog={catalog}
            clientes={clientes}
            onClienteCreated={(c) => setClientes((prev) => [c, ...prev])}
          />
        )}
      </div>
    </AppShell>
  )
}
