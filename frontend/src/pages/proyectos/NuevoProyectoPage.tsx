// Nuevo Proyecto — formulario completo estilo hoja de trabajo.
// Layout: cliente (col-span-2) + datos del proyecto (col-span-3) = mas amplio el form.

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
  type ProyectoLocation,
  type TipoProyecto,
} from '../../lib/api'
import NuevoClienteDrawer from './sections/NuevoClienteDrawer'

interface LocationForm extends ProyectoLocation {
  // mismo shape; alias para claridad
}

const EMPTY_LOC: LocationForm = {
  tipo: 'Recepción',
  nombre: '',
  hora_evento: null,
  hora_montaje: null,
  hora_desmontaje: null,
  notas: null,
}

export default function NuevoProyectoPage() {
  const navigate = useNavigate()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [catalog, setCatalog] = useState<ProyectoCatalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Proyecto - bloque "Información del evento"
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoProyecto>('boda')
  const [vendedor, setVendedor] = useState<number | ''>('')
  const [fechaEvento, setFechaEvento] = useState<string>('')
  const [valor, setValor] = useState<string>('')
  const [cantInvitados, setCantInvitados] = useState<string>('')

  // Event planner
  const [plannerNombre, setPlannerNombre] = useState('')
  const [plannerTel, setPlannerTel] = useState('')
  const [plannerEmail, setPlannerEmail] = useState('')

  // Lugares (dinámico)
  const [locations, setLocations] = useState<LocationForm[]>([])

  // Descripción
  const [descripcion, setDescripcion] = useState('')
  const [direccionEvento, setDireccionEvento] = useState('')

  async function reload() {
    try {
      const [cs, cat] = await Promise.all([
        clientesApi.list(),
        proyectosApi.catalog(),
      ])
      setClientes(cs); setCatalog(cat)
      if (cat.vendedores.length > 0) setVendedor(cat.vendedores[0].id)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload() }, [])

  // Defaults de locations según tipo
  useEffect(() => {
    if (locations.length > 0) return  // no sobreescribir si ya hay
    if (tipo === 'boda') {
      setLocations([
        { ...EMPTY_LOC, tipo: 'Iglesia' },
        { ...EMPTY_LOC, tipo: 'Civil' },
        { ...EMPTY_LOC, tipo: 'Recepción' },
      ])
    } else if (tipo === 'iglesia' || tipo === 'bautizo') {
      setLocations([{ ...EMPTY_LOC, tipo: 'Iglesia' }])
    } else {
      setLocations([{ ...EMPTY_LOC, tipo: 'Recepción' }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo])

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

  function addLocation() {
    setLocations(prev => [...prev, { ...EMPTY_LOC, tipo: catalog?.tipos_lugar[0] ?? 'Otro' }])
  }
  function removeLocation(idx: number) {
    setLocations(prev => prev.filter((_, i) => i !== idx))
  }
  function updateLocation(idx: number, patch: Partial<LocationForm>) {
    setLocations(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l))
  }

  async function handleSubmit() {
    if (!canSubmit || !selected) return
    setBusy(true); setError(null)
    try {
      const p = await proyectosApi.create({
        nombre: nombre.trim(),
        descripcion: descripcion || null,
        cliente_id: selected.id,
        vendedor_id: typeof vendedor === 'number' ? vendedor : null,
        tipo,
        fecha_evento: fechaEvento,
        direccion_evento: direccionEvento || null,
        valor_estimado: Number(valor) || 0,
        cant_invitados: cantInvitados ? Number(cantInvitados) : null,
        planner_nombre: plannerNombre || null,
        planner_telefono: plannerTel || null,
        planner_email: plannerEmail || null,
        locations: locations.filter(l => l.nombre.trim() || l.hora_evento || l.hora_montaje),
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-app-muted mb-1">
              <button onClick={() => navigate('/proyectos')} className="hover:text-app transition">
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
          {/* LEFT — cliente (col-span-2, mas estrecho) */}
          <div
            className="lg:col-span-2 rounded-2xl border p-5 self-start"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <h2 className="text-sm font-bold text-app mb-1">Cliente</h2>
            <p className="text-xs text-app-muted mb-3">Busca un cliente existente o crea uno nuevo.</p>

            {selected ? (
              <div
                className="rounded-lg border p-3 flex items-start justify-between"
                style={{ borderColor: 'var(--accent)', background: 'var(--accent-bg-soft)' }}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' }}
                  >
                    {selected.tipo === 'PM' ? <IconBuilding size={20} /> : '👤'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-app truncate">{selected.nombre}</div>
                    <div className="text-xs text-app-secondary truncate">
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
                  className="p-1 rounded hover:bg-[var(--bg-hover)] text-app-muted shrink-0"
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
                    placeholder="Buscar por nombre, RFC, tel..."
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
                      className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border transition text-left hover:border-[var(--accent)]"
                      style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-elevated)' }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs"
                          style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
                        >
                          {c.tipo === 'PM' ? '🏢' : '👤'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-app truncate">{c.nombre}</div>
                          <div className="text-[11px] text-app-muted truncate">
                            {c.telefono ?? '—'}
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

          {/* RIGHT — datos del proyecto (col-span-3, mas ancho) */}
          <div
            className="lg:col-span-3 rounded-2xl border p-5 space-y-6"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            {/* ===== Sección 1: Información del evento ===== */}
            <SectionHeader title="Información del evento" />

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
                <div className="grid grid-cols-7 gap-1.5">
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

              <div className="grid grid-cols-3 gap-3">
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
                    <option value="">— Selecciona —</option>
                    {(catalog?.vendedores ?? []).map((v) => (
                      <option key={v.id} value={v.id}>{v.nombre}</option>
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
                  label="Cant. invitados"
                  type="number"
                  value={cantInvitados}
                  onChange={(e) => setCantInvitados(e.target.value)}
                  placeholder="80"
                />
              </div>

              <TextField
                label="Presupuesto / Valor estimado (MXN)"
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0"
              />
            </div>

            {/* ===== Sección 2: Event planner ===== */}
            <SectionHeader title="Event planner" />
            <div className="grid grid-cols-3 gap-3">
              <TextField
                label="Nombre del planner"
                value={plannerNombre}
                onChange={(e) => setPlannerNombre(e.target.value)}
                placeholder="Juana Pérez"
              />
              <TextField
                label="Teléfono"
                value={plannerTel}
                onChange={(e) => setPlannerTel(e.target.value)}
                placeholder="811-800-1350"
              />
              <TextField
                label="Email"
                type="email"
                value={plannerEmail}
                onChange={(e) => setPlannerEmail(e.target.value)}
                placeholder="planner@ejemplo.com"
              />
            </div>

            {/* ===== Sección 3: Lugares y horarios ===== */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <SectionHeader title="Lugares y horarios" noMargin />
                <button
                  onClick={addLocation}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded transition"
                  style={{ color: 'var(--accent-text)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg-soft)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <IconPlus size={13} /> Agregar lugar
                </button>
              </div>

              {locations.length === 0 ? (
                <div className="text-xs text-app-muted py-2">Sin lugares. Click "Agregar lugar".</div>
              ) : (
                <div className="space-y-2">
                  {locations.map((loc, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-start p-2 rounded-lg border"
                      style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-elevated)' }}
                    >
                      <div className="col-span-2">
                        <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Tipo</div>
                        <select
                          value={loc.tipo}
                          onChange={(e) => updateLocation(idx, { tipo: e.target.value })}
                          className="w-full px-2 py-1.5 rounded border text-xs cursor-pointer"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        >
                          {(catalog?.tipos_lugar ?? ['Otro']).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Lugar / Nombre</div>
                        <input
                          type="text"
                          value={loc.nombre}
                          onChange={(e) => updateLocation(idx, { nombre: e.target.value })}
                          placeholder="Santa Engracia"
                          className="w-full px-2 py-1.5 rounded border text-xs"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Hora evento</div>
                        <input
                          type="time"
                          value={loc.hora_evento ?? ''}
                          onChange={(e) => updateLocation(idx, { hora_evento: e.target.value || null })}
                          className="w-full px-2 py-1.5 rounded border text-xs"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Montaje</div>
                        <input
                          type="time"
                          value={loc.hora_montaje ?? ''}
                          onChange={(e) => updateLocation(idx, { hora_montaje: e.target.value || null })}
                          className="w-full px-2 py-1.5 rounded border text-xs"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Desmontaje</div>
                        <input
                          type="time"
                          value={loc.hora_desmontaje ?? ''}
                          onChange={(e) => updateLocation(idx, { hora_desmontaje: e.target.value || null })}
                          className="w-full px-2 py-1.5 rounded border text-xs"
                          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end pt-5">
                        <button
                          onClick={() => removeLocation(idx)}
                          className="p-1 rounded hover:bg-[var(--bg-hover)] text-app-muted"
                          aria-label="Quitar"
                        ><IconX size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ===== Sección 4: Dirección general + comentarios ===== */}
            <SectionHeader title="Comentarios y dirección general" />
            <div className="space-y-3">
              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
                  Dirección del evento (general)
                  <span className="font-normal normal-case tracking-normal text-app-muted ml-1">(opcional)</span>
                </div>
                <input
                  type="text"
                  value={direccionEvento}
                  onChange={(e) => setDireccionEvento(e.target.value)}
                  placeholder="Calle, colonia, CP, municipio"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
                  Comentarios generales
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

function SectionHeader({ title, noMargin = false }: { title: string; noMargin?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${noMargin ? '' : ''}`}>
      <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-app-secondary">{title}</h3>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}
