// Catálogo de Clientes — /clientes. CRUD con backend real.

import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Drawer from '../../components/ui/Drawer'
import TextField from '../../components/ui/TextField'
import { IconEdit, IconPlus, IconTrash } from '../../components/icons/Icons'
import {
  ApiError,
  clientesApi,
  type Cliente,
  type ClienteCreatePayload,
  type TipoCliente,
} from '../../lib/api'

interface FormValue {
  id: number | null
  nombre: string
  tipo: TipoCliente
  razon_social: string
  rfc: string
  telefono: string
  email: string
  direccion: string
  notas: string
  is_active: boolean
}

const EMPTY: FormValue = {
  id: null,
  nombre: '',
  tipo: 'PF',
  razon_social: '',
  rfc: '',
  telefono: '',
  email: '',
  direccion: '',
  notas: '',
  is_active: true,
}

export default function ClientesPage() {
  const [rows, setRows] = useState<Cliente[]>([])
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<'todos' | TipoCliente>('todos')
  const [editing, setEditing] = useState<FormValue | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  async function reload() {
    try {
      const data = await clientesApi.list()
      setRows(data)
    } catch (e) {
      console.error(e)
    }
  }
  useEffect(() => { reload() }, [])

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function startNew() { setError(null); setEditing({ ...EMPTY }) }
  function startEdit(c: Cliente) {
    setError(null)
    setEditing({
      id: c.id,
      nombre: c.nombre,
      tipo: c.tipo,
      razon_social: c.razon_social ?? '',
      rfc: c.rfc ?? '',
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      direccion: c.direccion ?? '',
      notas: c.notas ?? '',
      is_active: c.is_active,
    })
  }

  async function handleSave(v: FormValue) {
    setBusy(true); setError(null)
    try {
      const payload: ClienteCreatePayload = {
        nombre: v.nombre,
        tipo: v.tipo,
        razon_social: v.razon_social || null,
        rfc: v.rfc || null,
        telefono: v.telefono || null,
        email: v.email || null,
        direccion: v.direccion || null,
        notas: v.notas || null,
      }
      if (v.id === null) {
        await clientesApi.create(payload)
        flash('Cliente creado')
      } else {
        await clientesApi.update(v.id, { ...payload, is_active: v.is_active })
        flash('Cliente actualizado')
      }
      setEditing(null)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar')
    } finally { setBusy(false) }
  }

  async function handleDelete(c: Cliente) {
    if (!confirm(`¿Eliminar cliente "${c.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await clientesApi.delete(c.id)
      flash('Cliente eliminado')
      await reload()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Error al eliminar')
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = rows.filter((c) => {
    if (filterTipo !== 'todos' && c.tipo !== filterTipo) return false
    if (!q) return true
    return (
      c.nombre.toLowerCase().includes(q) ||
      (c.razon_social ?? '').toLowerCase().includes(q) ||
      (c.telefono ?? '').includes(q) ||
      (c.rfc ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    )
  })

  const totalPF = rows.filter((c) => c.tipo === 'PF').length
  const totalPM = rows.filter((c) => c.tipo === 'PM').length

  return (
    <AppShell title="Clientes">
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app">Clientes</h2>
            <p className="text-sm text-app-secondary">
              Agenda de personas físicas y morales para tus eventos.
            </p>
          </div>
          <Button onClick={startNew}>
            <IconPlus size={14} /> Nuevo cliente
          </Button>
        </div>

        <Card>
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Buscar por nombre, RFC, teléfono, email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 max-w-md px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <div className="flex gap-1.5">
                <FilterPill label={`Todos (${rows.length})`} active={filterTipo === 'todos'} onClick={() => setFilterTipo('todos')} />
                <FilterPill label={`👤 Físicas (${totalPF})`} active={filterTipo === 'PF'} onClick={() => setFilterTipo('PF')} />
                <FilterPill label={`🏢 Morales (${totalPM})`} active={filterTipo === 'PM'} onClick={() => setFilterTipo('PM')} />
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="py-16 text-center text-sm text-app-muted">
                Sin clientes todavía. Click <span className="font-semibold text-accent">Nuevo cliente</span> para empezar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="text-left text-[11px] uppercase tracking-widest text-app-muted border-b"
                      style={{ borderColor: 'var(--border-soft)' }}
                    >
                      <th className="px-4 py-3 font-semibold">Cliente</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold">Teléfono</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">RFC</th>
                      <th className="px-4 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id} className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-app">{c.nombre}</div>
                          {c.razon_social && (
                            <div className="text-[11px] text-app-muted truncate max-w-xs">{c.razon_social}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                            style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
                          >
                            {c.tipo === 'PM' ? '🏢' : '👤'} {c.tipo === 'PM' ? 'Moral' : 'Física'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-app-secondary">{c.telefono ?? '—'}</td>
                        <td className="px-4 py-3 text-app-secondary">{c.email ?? '—'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-app-muted">{c.rfc ?? '—'}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => startEdit(c)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary"
                            aria-label="Editar" title="Editar"
                          >
                            <IconEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(c)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary ml-1"
                            aria-label="Eliminar" title="Eliminar"
                          >
                            <IconTrash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        {editing && (
          <ClienteFormDrawer
            value={editing}
            onChange={setEditing}
            onSave={handleSave}
            onClose={() => setEditing(null)}
            busy={busy}
            error={error}
          />
        )}

        {toast && (
          <div
            className="fixed bottom-6 right-6 px-4 py-3 rounded-lg text-sm text-app shadow-lg border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', zIndex: 200 }}
          >
            ✓ {toast}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-semibold transition border"
      style={{
        background: active ? 'var(--text-primary)' : 'var(--bg-input)',
        color: active ? 'var(--bg-page)' : 'var(--text-secondary)',
        borderColor: active ? 'var(--text-primary)' : 'var(--border)',
      }}
    >
      {label}
    </button>
  )
}

function ClienteFormDrawer({
  value, onChange, onSave, onClose, busy, error,
}: {
  value: FormValue
  onChange: (v: FormValue) => void
  onSave: (v: FormValue) => void
  onClose: () => void
  busy: boolean
  error: string | null
}) {
  const isCreate = value.id === null
  return (
    <Drawer
      open
      onClose={onClose}
      title={isCreate ? 'Nuevo cliente' : `Editar ${value.nombre}`}
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(value)} disabled={busy || !value.nombre.trim()}>
            {busy ? 'Guardando…' : isCreate ? 'Crear' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Tipo cliente segmented */}
        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase mb-2 text-app-secondary">
            Tipo de cliente <span style={{ color: 'var(--danger)' }}>*</span>
          </div>
          <div className="inline-flex rounded-lg p-1" style={{ background: 'var(--bg-toggle)' }}>
            <SegButton active={value.tipo === 'PF'} onClick={() => onChange({ ...value, tipo: 'PF' })}>
              👤 Persona física
            </SegButton>
            <SegButton active={value.tipo === 'PM'} onClick={() => onChange({ ...value, tipo: 'PM' })}>
              🏢 Persona moral
            </SegButton>
          </div>
        </div>

        <TextField
          label={value.tipo === 'PF' ? 'Nombre completo' : 'Nombre comercial'}
          required
          value={value.nombre}
          onChange={(e) => onChange({ ...value, nombre: e.target.value })}
          placeholder={value.tipo === 'PF' ? 'Carlos Sada Martínez' : 'Hotel Quinta Real'}
        />
        {value.tipo === 'PM' && (
          <TextField
            label="Razón social"
            value={value.razon_social}
            onChange={(e) => onChange({ ...value, razon_social: e.target.value })}
            placeholder="Hotel Quinta Real S.A. de C.V."
          />
        )}
        <TextField
          label="RFC"
          value={value.rfc}
          onChange={(e) => onChange({ ...value, rfc: e.target.value.toUpperCase() })}
          placeholder={value.tipo === 'PF' ? 'SADC850412XXX' : 'QRH000101ABC'}
        />

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Teléfono"
            value={value.telefono}
            onChange={(e) => onChange({ ...value, telefono: e.target.value })}
            placeholder="818-234-5678"
          />
          <TextField
            label="Email"
            type="email"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder="cliente@ejemplo.com"
          />
        </div>

        <label className="block">
          <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
            Dirección
          </div>
          <textarea
            rows={3}
            value={value.direccion}
            onChange={(e) => onChange({ ...value, direccion: e.target.value })}
            placeholder="Calle, número, colonia, CP, municipio"
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </label>

        <label className="block">
          <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
            Notas internas
          </div>
          <textarea
            rows={2}
            value={value.notas}
            onChange={(e) => onChange({ ...value, notas: e.target.value })}
            placeholder="Cumpleaños, referidos, preferencias…"
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </label>

        {!isCreate && (
          <label className="flex items-center gap-2 text-sm text-app pt-2">
            <input
              type="checkbox"
              checked={value.is_active}
              onChange={(e) => onChange({ ...value, is_active: e.target.checked })}
              style={{ accentColor: 'var(--accent)' }}
            />
            Cliente activo
          </label>
        )}

        {error && <div className="text-xs text-danger">{error}</div>}
      </div>
    </Drawer>
  )
}

function SegButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-md text-xs font-semibold transition"
      style={{
        background: active ? 'var(--bg-card)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {children}
    </button>
  )
}
