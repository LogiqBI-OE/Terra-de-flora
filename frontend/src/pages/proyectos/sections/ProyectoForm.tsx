// Formulario completo del proyecto en grid 2x2 (Evento | Cliente / Logistica | Lugar y hora).
// Reusable entre Nuevo Proyecto (crear) y Folio tab (editar).

import { useEffect, useMemo, useState } from 'react'
import {
  IconBuilding, IconPlus, IconSearch, IconX,
} from '../../../components/icons/Icons'
import {
  clientesApi,
  proyectosApi,
  type Cliente,
  type ProyectoCatalog,
  type ProyectoLocation,
  type ProyectoRow,
  type TipoProyecto,
} from '../../../lib/api'
import NuevoClienteDrawer from './NuevoClienteDrawer'

const EMPTY_LOC: ProyectoLocation = {
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

export interface ProyectoFormState {
  nombre: string
  tipo: TipoProyecto
  vendedor: number | ''
  fechaEvento: string
  cantInvitados: string
  valor: string
  plannerNombre: string
  plannerTel: string
  plannerEmail: string
  descripcion: string
  direccionEvento: string
  locations: ProyectoLocation[]
  cliente: Cliente | null
}

export function emptyFormState(): ProyectoFormState {
  return {
    nombre: '',
    tipo: 'boda',
    vendedor: '',
    fechaEvento: '',
    cantInvitados: '',
    valor: '',
    plannerNombre: '',
    plannerTel: '',
    plannerEmail: '',
    descripcion: '',
    direccionEvento: '',
    locations: [],
    cliente: null,
  }
}

export function formStateFromProyecto(p: ProyectoRow, cliente: Cliente | null): ProyectoFormState {
  return {
    nombre: p.nombre,
    tipo: p.tipo,
    vendedor: p.vendedor_id ?? '',
    fechaEvento: p.fecha_evento ?? '',
    cantInvitados: p.cant_invitados !== null ? String(p.cant_invitados) : '',
    valor: String(p.valor_estimado),
    plannerNombre: p.planner_nombre ?? '',
    plannerTel: p.planner_telefono ?? '',
    plannerEmail: p.planner_email ?? '',
    descripcion: p.descripcion ?? '',
    direccionEvento: p.direccion_evento ?? '',
    locations: p.locations ?? [],
    cliente,
  }
}

interface Props {
  value: ProyectoFormState
  onChange: (v: ProyectoFormState) => void
  catalog: ProyectoCatalog
  clientes: Cliente[]
  onClienteCreated: (c: Cliente) => void
}

export default function ProyectoForm({ value, onChange, catalog, clientes, onClienteCreated }: Props) {
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Auto-set defaults de lugares cuando el tipo cambia y no hay lugares
  useEffect(() => {
    if (value.locations.length > 0) return
    if (value.tipo === 'boda') {
      onChange({ ...value, locations: [
        { ...EMPTY_LOC, tipo: 'Iglesia' },
        { ...EMPTY_LOC, tipo: 'Civil' },
        { ...EMPTY_LOC, tipo: 'Recepción' },
      ]})
    } else if (value.tipo === 'iglesia' || value.tipo === 'bautizo') {
      onChange({ ...value, locations: [{ ...EMPTY_LOC, tipo: 'Iglesia' }] })
    } else {
      onChange({ ...value, locations: [{ ...EMPTY_LOC, tipo: 'Recepción' }] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.tipo])

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

  function addLocation() {
    onChange({ ...value, locations: [...value.locations, { ...EMPTY_LOC, tipo: catalog.tipos_lugar[0] ?? 'Otro' }] })
  }
  function removeLocation(idx: number) {
    onChange({ ...value, locations: value.locations.filter((_, i) => i !== idx) })
  }
  function updateLocation(idx: number, patch: Partial<ProyectoLocation>) {
    onChange({ ...value, locations: value.locations.map((l, i) => i === idx ? { ...l, ...patch } : l) })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* === Top-left: EVENTO === */}
      <BlockCard title="Evento" className="lg:col-span-7">
        <Field label="Nombre del proyecto" required>
          <SimpleInput
            value={value.nombre}
            onChange={(v) => onChange({ ...value, nombre: v })}
            placeholder="Ej: Bautizo Perla Martínez — Iglesia & Recepción"
          />
        </Field>

        <Field label="Tipo de proyecto" required>
          <div className="grid grid-cols-7 gap-1.5">
            {catalog.tipos.map((t) => {
              const active = value.tipo === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChange({ ...value, tipo: t.id, locations: [] })}
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
              value={value.fechaEvento}
              onChange={(e) => onChange({ ...value, fechaEvento: e.target.value })}
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
                value={value.cantInvitados}
                onChange={(e) => onChange({ ...value, cantInvitados: e.target.value })}
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
              value={value.vendedor}
              onChange={(e) => onChange({ ...value, vendedor: e.target.value ? Number(e.target.value) : '' })}
              className="w-full px-3 py-2 rounded-lg border text-sm cursor-pointer"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">— Selecciona —</option>
              {catalog.vendedores.map((v) => (
                <option key={v.id} value={v.id}>{v.nombre}</option>
              ))}
            </select>
          </Field>
          <Field label="Presupuesto">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-app-muted">$</span>
              <input
                type="number"
                value={value.valor}
                onChange={(e) => onChange({ ...value, valor: e.target.value })}
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
        {value.cliente ? (
          <ClienteAvatarPanel
            cliente={value.cliente}
            onChange={() => onChange({ ...value, cliente: null })}
          />
        ) : (
          <ClientePicker
            clientes={clientes}
            results={results}
            search={search}
            setSearch={setSearch}
            onPick={(c) => onChange({ ...value, cliente: c })}
            onCreateNew={() => setDrawerOpen(true)}
          />
        )}
      </BlockCard>

      {/* === Bottom-left: LOGISTICA === */}
      <BlockCard title="Logística del evento" className="lg:col-span-5">
        <SubBlock icon="👤" title="Event planner">
          <Field label="Planner">
            <SimpleInput
              value={value.plannerNombre}
              onChange={(v) => onChange({ ...value, plannerNombre: v })}
              placeholder="Juana Pérez"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono">
              <SimpleInput
                value={value.plannerTel}
                onChange={(v) => onChange({ ...value, plannerTel: v })}
                placeholder="811-800-1350"
              />
            </Field>
            <Field label="E-mail">
              <SimpleInput
                value={value.plannerEmail}
                onChange={(v) => onChange({ ...value, plannerEmail: v })}
                placeholder="planner@ejemplo.com"
                type="email"
              />
            </Field>
          </div>
        </SubBlock>

        <SubBlock icon="💬" title="Comentarios generales">
          <textarea
            rows={5}
            value={value.descripcion}
            onChange={(e) => onChange({ ...value, descripcion: e.target.value })}
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
              {value.locations.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-xs text-app-muted">Sin lugares.</td></tr>
              ) : (
                value.locations.map((loc, idx) => (
                  <tr key={idx} className="border-b last:border-0" style={{ borderColor: 'var(--border-soft)' }}>
                    <td className="px-2 py-1.5">
                      <select
                        value={loc.tipo}
                        onChange={(e) => updateLocation(idx, { tipo: e.target.value })}
                        className="w-full px-1.5 py-1 rounded border text-xs cursor-pointer font-semibold"
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      >
                        {catalog.tipos_lugar.map((t) => (
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

      <NuevoClienteDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={(c) => {
          onClienteCreated(c)
          onChange({ ...value, cliente: c })
          setDrawerOpen(false)
        }}
      />
    </div>
  )
}

/** Construye el payload para POST /proyectos o PATCH /proyectos/:id. */
export function buildPayload(v: ProyectoFormState) {
  return {
    nombre: v.nombre.trim(),
    descripcion: v.descripcion || null,
    cliente_id: v.cliente!.id,
    vendedor_id: typeof v.vendedor === 'number' ? v.vendedor : null,
    tipo: v.tipo,
    fecha_evento: v.fechaEvento,
    direccion_evento: v.direccionEvento || null,
    valor_estimado: Number(v.valor) || 0,
    cant_invitados: v.cantInvitados ? Number(v.cantInvitados) : null,
    planner_nombre: v.plannerNombre || null,
    planner_telefono: v.plannerTel || null,
    planner_email: v.plannerEmail || null,
    locations: v.locations.filter(l => l.nombre.trim() || l.hora_evento || l.hora_montaje),
  }
}

export function canSubmit(v: ProyectoFormState): boolean {
  return v.cliente !== null && !!v.nombre.trim() && !!v.fechaEvento && v.vendedor !== ''
}

/** Carga el catálogo y los clientes (helper para el caller). */
export async function loadFormDeps() {
  const [clientes, catalog] = await Promise.all([clientesApi.list(), proyectosApi.catalog()])
  return { clientes, catalog }
}

// ── UI helpers internos ─────────────────────────────────────────────

function BlockCard({ title, className = '', children }: { title: string; className?: string; children: React.ReactNode }) {
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

function SubBlock({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
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

function SimpleInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
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

function ClienteAvatarPanel({ cliente, onChange }: { cliente: Cliente; onChange: () => void }) {
  const initials = cliente.nombre.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()
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
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest"
          style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
        >
          {cliente.tipo === 'PM' ? '🏢 Persona moral' : '👤 Persona física'}
        </span>
      </div>
      <div className="w-full text-xs text-app-secondary space-y-1.5 mt-1 border-t pt-3" style={{ borderColor: 'var(--border-soft)' }}>
        {cliente.telefono && <Row label="Teléfono" value={cliente.telefono} />}
        {cliente.email && <Row label="E-mail" value={cliente.email} truncate />}
        {cliente.rfc && <Row label="RFC" value={cliente.rfc} mono />}
        {cliente.como_nos_contacto && <Row label="Fuente" value={cliente.como_nos_contacto} />}
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

function Row({ label, value, mono, truncate }: { label: string; value: string; mono?: boolean; truncate?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-app-muted">{label}</span>
      <span className={`text-app ${mono ? 'font-mono' : ''} ${truncate ? 'truncate max-w-[200px]' : ''}`}>{value}</span>
    </div>
  )
}

function ClientePicker({ clientes, results, search, setSearch, onPick, onCreateNew }: {
  clientes: Cliente[]; results: Cliente[]; search: string; setSearch: (v: string) => void
  onPick: (c: Cliente) => void; onCreateNew: () => void
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
