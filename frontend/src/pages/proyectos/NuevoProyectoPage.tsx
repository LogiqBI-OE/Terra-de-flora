// Crear evento — grid 2x2:
//   ┌───────────────┬───────────────┐
//   │ EVENTO        │ CLIENTE       │
//   ├───────────────┼───────────────┤
//   │ LOGISTICA     │ LUGAR Y HORA  │
//   └───────────────┴───────────────┘

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import {
  IconBuilding, IconChevronRight, IconPlus, IconSearch, IconX,
} from '../../components/icons/Icons'
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

interface LocationForm extends ProyectoLocation { }

const EMPTY_LOC: LocationForm = {
  tipo: 'Recepción',
  nombre: '',
  hora_evento: null,
  hora_montaje: null,
  hora_desmontaje: null,
  notas: null,
}

const TIPO_EMOJI: Record<string, string> = {
  boda: '💐', iglesia: '⛪', bautizo: '👶', cumple: '🎂',
  xv: '👑', corporativo: '🏢', otro: '🎉',
}

export default function NuevoProyectoPage() {
  const navigate = useNavigate()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [catalog, setCatalog] = useState<ProyectoCatalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cliente
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Proyecto
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoProyecto>('boda')
  const [vendedor, setVendedor] = useState<number | ''>('')
  const [fechaEvento, setFechaEvento] = useState<string>('')
  const [cantInvitados, setCantInvitados] = useState<string>('')
  const [valor, setValor] = useState<string>('')

  // Event planner
  const [plannerNombre, setPlannerNombre] = useState('')
  const [plannerTel, setPlannerTel] = useState('')
  const [plannerEmail, setPlannerEmail] = useState('')
  const [descripcion, setDescripcion] = useState('')

  // Lugares
  const [locations, setLocations] = useState<LocationForm[]>([])

  async function reload() {
    try {
      const [cs, cat] = await Promise.all([clientesApi.list(), proyectosApi.catalog()])
      setClientes(cs); setCatalog(cat)
      if (cat.vendedores.length > 0) setVendedor(cat.vendedores[0].id)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }
  useEffect(() => { reload() }, [])

  useEffect(() => {
    if (locations.length > 0) return
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
    if (!q) return clientes.slice(0, 5)
    return clientes.filter((c) =>
      c.nombre.toLowerCase().includes(q) ||
      (c.telefono ?? '').includes(q) ||
      (c.rfc ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    ).slice(0, 8)
  }, [search, clientes])

  function handleClienteCreated(c: Cliente) {
    setClientes((prev) => [c, ...prev])
    setSelected(c); setDrawerOpen(false); setSearch('')
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
    } finally { setBusy(false) }
  }

  const canSubmit = selected !== null && nombre.trim() && fechaEvento && vendedor !== ''

  return (
    <AppShell title="Crear evento">
      <div className="space-y-5">
        {/* Header */}
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
              disabled={!canSubmit || busy}
              className="px-5 py-2 rounded-lg text-sm font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--accent)',
                color: 'var(--text-on-accent)',
                boxShadow: '0 6px 20px var(--accent-shadow)',
              }}
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

        {loading ? (
          <div className="py-12 text-center text-sm text-app-muted">Cargando…</div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* === Top-left: EVENTO === */}
          <BlockCard title="Evento" className="lg:col-span-7">
            <Field label="Nombre del proyecto" required>
              <SimpleInput value={nombre} onChange={setNombre} placeholder="Ej: Bautizo Perla Martínez — Iglesia & Recepción" />
            </Field>

            <Field label="Tipo de proyecto" required>
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
                        borderColor: active ? 'var(--accent)' : 'transparent',
                        background: active ? 'var(--accent-bg-soft)' : 'var(--bg-input)',
                      }}
                    >
                      <div className="text-base leading-none">{TIPO_EMOJI[t.id] ?? '🎉'}</div>
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
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha del evento" required>
                <input
                  type="date"
                  value={fechaEvento}
                  onChange={(e) => setFechaEvento(e.target.value)}
                  onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                  onFocus={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                  className="w-full px-3 py-2 rounded-lg border text-sm cursor-pointer"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </Field>
              <Field label="Cant. invitados">
                <div className="relative">
                  <input
                    type="number"
                    value={cantInvitados}
                    onChange={(e) => setCantInvitados(e.target.value)}
                    placeholder="80"
                    className="w-full px-3 py-2 pr-20 rounded-lg border text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-app-muted">personas</span>
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Vendedor asignado" required>
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
                {(catalog?.vendedores ?? []).length === 0 && (
                  <div className="text-[10px] text-app-muted mt-1">
                    No hay usuarios L5+ disponibles. Crea uno desde Administración → Usuarios.
                  </div>
                )}
              </Field>
              <Field label="Presupuesto">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-app-muted">$</span>
                  <input
                    type="number"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-14 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-app-muted">MXN</span>
                </div>
              </Field>
            </div>
          </BlockCard>

          {/* === Top-right: CLIENTE === */}
          <BlockCard title="Cliente" className="lg:col-span-5">
            {selected ? (
              <ClienteAvatarPanel
                cliente={selected}
                onChange={() => { setSelected(null) }}
              />
            ) : (
              <ClientePicker
                clientes={clientes}
                results={results}
                search={search}
                setSearch={setSearch}
                onPick={setSelected}
                onCreateNew={() => setDrawerOpen(true)}
              />
            )}
          </BlockCard>

          {/* === Bottom-left: LOGÍSTICA === */}
          <BlockCard title="Logística del evento" className="lg:col-span-5">
            <SubBlock icon="👤" title="Event planner">
              <Field label="Planner">
                <SimpleInput value={plannerNombre} onChange={setPlannerNombre} placeholder="Juana Pérez" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Teléfono">
                  <SimpleInput value={plannerTel} onChange={setPlannerTel} placeholder="811-800-1350" />
                </Field>
                <Field label="E-mail">
                  <SimpleInput value={plannerEmail} onChange={setPlannerEmail} placeholder="planner@ejemplo.com" type="email" />
                </Field>
              </div>
            </SubBlock>

            <SubBlock icon="💬" title="Comentarios generales">
              <textarea
                rows={5}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Escribe aquí los comentarios o notas especiales del evento…"
                className="w-full px-3 py-2 rounded-lg border text-sm resize-none italic"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </SubBlock>
          </BlockCard>

          {/* === Bottom-right: LUGAR Y HORA === */}
          <BlockCard title="Lugar y hora del evento" className="lg:col-span-7">
            <div
              className="rounded-lg border overflow-hidden"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="text-left text-[10px] uppercase tracking-widest text-app-muted border-b"
                    style={{ borderColor: 'var(--border-soft)' }}
                  >
                    <th className="px-3 py-2 font-semibold w-28">Etapa</th>
                    <th className="px-3 py-2 font-semibold">Lugar</th>
                    <th className="px-3 py-2 font-semibold w-24">Hora</th>
                    <th className="px-3 py-2 font-semibold w-24">Montaje</th>
                    <th className="px-3 py-2 font-semibold w-24">Desmontaje</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {locations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-xs text-app-muted">
                        Sin lugares. Click "Agregar lugar".
                      </td>
                    </tr>
                  ) : (
                    locations.map((loc, idx) => (
                      <tr key={idx} className="border-b last:border-0" style={{ borderColor: 'var(--border-soft)' }}>
                        <td className="px-2 py-1.5">
                          <select
                            value={loc.tipo}
                            onChange={(e) => updateLocation(idx, { tipo: e.target.value })}
                            className="w-full px-1.5 py-1 rounded border text-xs cursor-pointer font-semibold"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          >
                            {(catalog?.tipos_lugar ?? ['Otro']).map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="text"
                            value={loc.nombre}
                            onChange={(e) => updateLocation(idx, { nombre: e.target.value })}
                            placeholder="Santa Engracia"
                            className="w-full px-1.5 py-1 rounded border text-xs"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="time"
                            value={loc.hora_evento ?? ''}
                            onChange={(e) => updateLocation(idx, { hora_evento: e.target.value || null })}
                            onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                            className="w-full px-1 py-1 rounded border text-xs cursor-pointer"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="time"
                            value={loc.hora_montaje ?? ''}
                            onChange={(e) => updateLocation(idx, { hora_montaje: e.target.value || null })}
                            onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                            className="w-full px-1 py-1 rounded border text-xs cursor-pointer"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            type="time"
                            value={loc.hora_desmontaje ?? ''}
                            onChange={(e) => updateLocation(idx, { hora_desmontaje: e.target.value || null })}
                            onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                            className="w-full px-1 py-1 rounded border text-xs cursor-pointer"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          />
                        </td>
                        <td className="px-1 py-1.5 text-right">
                          <button
                            onClick={() => removeLocation(idx)}
                            className="p-0.5 rounded hover:bg-[var(--bg-hover)] text-app-muted"
                            aria-label="Quitar"
                          ><IconX size={13} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="flex justify-center py-1.5 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                <button
                  onClick={addLocation}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded transition"
                  style={{ color: 'var(--accent-text)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg-soft)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <IconPlus size={12} /> Agregar lugar
                </button>
              </div>
            </div>
          </BlockCard>
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

// ── UI helpers ─────────────────────────────────────────────────────

function BlockCard({
  title, className = '', children,
}: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <section
      className={`rounded-2xl border p-5 space-y-4 ${className}`}
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-app-secondary">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function SubBlock({
  icon, title, children,
}: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg border p-3 space-y-3"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm leading-none">{icon}</span>
        <span className="text-sm font-semibold text-app">{title}</span>
      </div>
      {children}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5 text-app-secondary">
        {label}{required && <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>}
      </div>
      {children}
    </label>
  )
}

function SimpleInput({
  value, onChange, placeholder, type = 'text',
}: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg border text-sm"
      style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
    />
  )
}

// ── Cliente: avatar panel + picker ─────────────────────────────────────

function ClienteAvatarPanel({
  cliente, onChange,
}: {
  cliente: Cliente
  onChange: () => void
}) {
  const initials = cliente.nombre
    .split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()

  return (
    <div className="flex flex-col items-center text-center gap-3 py-2">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl"
        style={{ background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' }}
      >
        {cliente.tipo === 'PM' ? <IconBuilding size={32} /> : initials}
      </div>
      <div className="space-y-1">
        <div className="text-base font-bold text-app">{cliente.nombre}</div>
        <div>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest"
            style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
          >
            {cliente.tipo === 'PM' ? '🏢 Persona moral' : '👤 Persona física'}
          </span>
        </div>
      </div>

      <div className="w-full text-xs text-app-secondary space-y-1.5 mt-1 border-t pt-3" style={{ borderColor: 'var(--border-soft)' }}>
        {cliente.telefono && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-app-muted">Teléfono</span>
            <span className="text-app">{cliente.telefono}</span>
          </div>
        )}
        {cliente.email && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-app-muted">E-mail</span>
            <span className="text-app truncate max-w-[200px]">{cliente.email}</span>
          </div>
        )}
        {cliente.rfc && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-app-muted">RFC</span>
            <span className="text-app font-mono">{cliente.rfc}</span>
          </div>
        )}
        {cliente.como_nos_contacto && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-app-muted">Fuente</span>
            <span className="text-app">{cliente.como_nos_contacto}</span>
          </div>
        )}
      </div>

      <button
        onClick={onChange}
        className="text-xs font-semibold mt-1 hover:underline"
        style={{ color: 'var(--accent-text)' }}
      >
        Cambiar cliente
      </button>
    </div>
  )
}

function ClientePicker({
  clientes, results, search, setSearch, onPick, onCreateNew,
}: {
  clientes: Cliente[]
  results: Cliente[]
  search: string
  setSearch: (v: string) => void
  onPick: (c: Cliente) => void
  onCreateNew: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" aria-hidden>
          <IconSearch size={16} />
        </span>
        <input
          type="text"
          placeholder="Buscar cliente por nombre, RFC o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      </div>

      {results.length === 0 ? (
        <div className="text-xs text-app-muted py-4 text-center">
          {clientes.length === 0 ? 'Aún no hay clientes. Crea el primero.' : 'Sin coincidencias.'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {results.map((c) => {
            const initials = c.nombre.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()
            return (
              <button
                key={c.id}
                onClick={() => onPick(c)}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg border transition text-left hover:border-[var(--accent)]"
                style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-elevated)' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' }}
                >
                  {c.tipo === 'PM' ? <IconBuilding size={16} /> : initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-app truncate">{c.nombre}</div>
                  <div className="text-[11px] text-app-muted truncate">
                    {c.telefono ?? '—'} {c.email && <>· {c.email}</>}
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-app-muted shrink-0">
                  {c.tipo === 'PM' ? 'Moral' : 'Física'}
                </span>
              </button>
            )
          })}
        </div>
      )}

      <button
        onClick={onCreateNew}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 border-dashed text-xs font-semibold transition"
        style={{ borderColor: 'var(--accent)', color: 'var(--accent-text)', background: 'transparent' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg-soft)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <IconPlus size={14} />
        Crear nuevo cliente
      </button>
    </div>
  )
}
