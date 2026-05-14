// Nuevo Proyecto — backend real.
// LEFT: cliente search (real, contra /clientes) + drawer Nuevo Cliente (real)
// RIGHT: form de proyecto que persiste contra /proyectos

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import TextField from '../../components/ui/TextField'
import { IconBuilding, IconChevronRight, IconPlus, IconSearch, IconX } from '../../components/icons/Icons'
import {
  ApiError,
  clientesApi,
  proyectosApi,
  type Cliente,
  type ProyectoCatalog,
  type TipoProyecto,
} from '../../lib/api'
import NuevoClienteDrawer from './sections/NuevoClienteDrawer'

export default function NuevoProyectoPage() {
  const navigate = useNavigate()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [catalog, setCatalog] = useState<ProyectoCatalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Cliente
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Proyecto
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoProyecto>('boda')
  const [vendedor, setVendedor] = useState<number | ''>('')
  const [fechaEvento, setFechaEvento] = useState<string>('')
  const [valor, setValor] = useState<string>('')
  const [direccion, setDireccion] = useState('')
  const [descripcion, setDescripcion] = useState('')

  async function reload() {
    try {
      const [cs, cat] = await Promise.all([
        clientesApi.list(),
        proyectosApi.catalog(),
      ])
      setClientes(cs); setCatalog(cat)
      // preselecciona el primer vendedor si hay
      if (cat.vendedores.length > 0) setVendedor(cat.vendedores[0].id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload() }, [])

  const results = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clientes.slice(0, 4)
    return clientes.filter((c) =>
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono ?? '').includes(q) ||
      (c.rfc ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    ).slice(0, 6)
  }, [search, clientes])

  function handleClienteCreated(c: Cliente) {
    setClientes((prev) => [c, ...prev])
    setSelected(c)
    setDrawerOpen(false)
  }

  async function handleSubmit() {
    if (!selected || !nombre.trim() || !fechaEvento || vendedor === '') return
    setBusy(true); setError(null)
    try {
      const p = await proyectosApi.create({
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        cliente_id: selected.id,
        vendedor_id: typeof vendedor === 'number' ? vendedor : null,
        tipo,
        fecha_evento: fechaEvento,
        direccion_evento: direccion || null,
        valor_estimado: Number(valor) || 0,
      })
      navigate(`/proyectos/${p.id}`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al crear el proyecto')
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = selected !== null && nombre.trim() && fechaEvento && vendedor !== ''

  return (
    <AppShell title="Nuevo proyecto">
      <div className="space-y-5">
        {/* Header: breadcrumb + actions */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-app-muted mb-1">
              <button
                onClick={() => navigate('/proyectos')}
                className="hover:text-app transition"
              >
                Mis Proyectos
              </button>
              <IconChevronRight size={12} />
              <span className="font-semibold" style={{ color: 'var(--accent-text)' }}>Nuevo proyecto</span>
            </div>
            <h1 className="text-2xl font-bold text-app">Nuevo proyecto</h1>
            <p className="text-sm text-app-secondary">
              Selecciona el cliente y completa los datos del evento.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/proyectos')}>Cancelar</Button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
                boxShadow: '0 6px 20px var(--accent-shadow)',
              }}
            >
              {busy ? 'Creando…' : 'Crear proyecto'}
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

        {loading ? (
          <div className="py-12 text-center text-sm text-app-muted">Cargando catálogos…</div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* LEFT — cliente */}
          <div
            className="lg:col-span-3 rounded-2xl border p-5"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-app">Cliente</h2>
                <p className="text-xs text-app-muted">Busca un cliente existente o crea uno nuevo.</p>
              </div>
            </div>

            {selected ? (
              <div
                className="rounded-lg border p-3 flex items-start justify-between"
                style={{ borderColor: 'var(--accent)', background: 'var(--accent-bg-soft)' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' }}
                  >
                    {selected.tipo === 'PM' ? <IconBuilding size={20} /> : '👤'}
                  </div>
                  <div>
                    <div className="font-semibold text-app">{selected.nombre}</div>
                    <div className="text-xs text-app-secondary">
                      {selected.telefono ?? '—'}
                      {selected.email && <> · {selected.email}</>}
                    </div>
                    {selected.rfc && (
                      <div className="text-[10px] text-app-muted font-mono mt-0.5">{selected.rfc}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 rounded hover:bg-[var(--bg-hover)] text-app-muted"
                  aria-label="Cambiar cliente"
                >
                  <IconX size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" aria-hidden>
                    <IconSearch size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por nombre, RFC o teléfono..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="mt-3 space-y-1.5">
                  {results.length === 0 ? (
                    <div className="text-xs text-app-muted py-4 text-center">
                      {clientes.length === 0
                        ? 'Aún no hay clientes. Crea el primero.'
                        : 'Sin coincidencias.'}
                    </div>
                  ) : results.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelected(c)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition text-left hover:border-[var(--accent)]"
                      style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-elevated)' }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs"
                          style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
                        >
                          {c.tipo === 'PM' ? '🏢' : '👤'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-app truncate">{c.nombre}</div>
                          <div className="text-[11px] text-app-muted truncate">
                            {c.telefono ?? '—'} {c.rfc && <>· <span className="font-mono">{c.rfc}</span></>}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-widest text-app-muted shrink-0">
                        {c.tipo === 'PM' ? 'Moral' : 'Física'}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setDrawerOpen(true)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-dashed text-xs font-semibold transition"
                  style={{ borderColor: 'var(--accent)', color: 'var(--accent-text)', background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg-soft)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <IconPlus size={14} />
                  Crear nuevo cliente
                </button>
              </>
            )}
          </div>

          {/* RIGHT — datos del proyecto */}
          <div
            className="lg:col-span-2 rounded-2xl border p-5"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-sm font-bold text-app mb-1">Datos del proyecto</h2>
            <p className="text-xs text-app-muted mb-4">Información del evento.</p>

            <div className="space-y-4">
              <TextField
                label="Nombre del proyecto"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Boda Sada — Ceremonia & Recepción"
              />

              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-2 text-app-secondary">
                  Tipo de proyecto <span style={{ color: 'var(--danger)' }}>*</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(catalog?.tipos ?? []).map((t) => {
                    const active = tipo === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTipo(t.id)}
                        className="rounded-lg border-2 py-2 px-1 text-center transition"
                        style={{
                          borderColor: active ? 'var(--accent)' : 'var(--border)',
                          background: active ? 'var(--accent-bg-soft)' : 'var(--bg-input)',
                        }}
                      >
                        <div className="text-lg leading-none">{t.emoji}</div>
                        <div
                          className="text-[10px] mt-1 font-medium"
                          style={{ color: active ? 'var(--accent-text)' : 'var(--text-secondary)' }}
                        >
                          {t.label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
                  Vendedor <span style={{ color: 'var(--danger)' }}>*</span>
                </div>
                <select
                  value={vendedor}
                  onChange={(e) => setVendedor(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-lg border text-sm cursor-pointer"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="">— Selecciona vendedor —</option>
                  {(catalog?.vendedores ?? []).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nombre}{v.username ? ` (@${v.username})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <TextField
                label="Fecha del evento"
                type="date"
                required
                value={fechaEvento}
                onChange={(e) => setFechaEvento(e.target.value)}
              />

              <TextField
                label="Valor estimado (MXN)"
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0"
              />

              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
                  Lugar del evento
                </div>
                <textarea
                  rows={2}
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, colonia, CP, municipio"
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
                  Descripción
                  <span className="font-normal normal-case tracking-normal text-app-muted ml-1">(opcional)</span>
                </div>
                <textarea
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Alcance, requerimientos del cliente, particularidades..."
                  className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      <NuevoClienteDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={handleClienteCreated}
      />
    </AppShell>
  )
}
