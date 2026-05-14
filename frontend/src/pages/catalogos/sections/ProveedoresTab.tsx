// Tab: agenda de proveedores. CRUD completo + drawer.

import { useEffect, useState } from 'react'
import Button from '../../../components/ui/Button'
import Drawer from '../../../components/ui/Drawer'
import TextField from '../../../components/ui/TextField'
import { IconEdit, IconPlus, IconTrash } from '../../../components/icons/Icons'
import {
  ApiError,
  proveedoresApi,
  type Proveedor,
  type ProveedorCreatePayload,
} from '../../../lib/api'

interface FormValue {
  id: number | null
  nombre: string
  razon_social: string
  rfc: string
  contacto_nombre: string
  contacto_telefono: string
  contacto_email: string
  direccion: string
  notas: string
  is_active: boolean
}

const EMPTY: FormValue = {
  id: null,
  nombre: '',
  razon_social: '',
  rfc: '',
  contacto_nombre: '',
  contacto_telefono: '',
  contacto_email: '',
  direccion: '',
  notas: '',
  is_active: true,
}

export default function ProveedoresTab() {
  const [rows, setRows] = useState<Proveedor[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<FormValue | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  async function reload() {
    try {
      const data = await proveedoresApi.list()
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

  function startNew() {
    setError(null)
    setEditing({ ...EMPTY })
  }
  function startEdit(p: Proveedor) {
    setError(null)
    setEditing({
      id: p.id,
      nombre: p.nombre,
      razon_social: p.razon_social ?? '',
      rfc: p.rfc ?? '',
      contacto_nombre: p.contacto_nombre ?? '',
      contacto_telefono: p.contacto_telefono ?? '',
      contacto_email: p.contacto_email ?? '',
      direccion: p.direccion ?? '',
      notas: p.notas ?? '',
      is_active: p.is_active,
    })
  }

  async function handleSave(v: FormValue) {
    setBusy(true); setError(null)
    try {
      const payload: ProveedorCreatePayload = {
        nombre: v.nombre,
        razon_social: v.razon_social || null,
        rfc: v.rfc || null,
        contacto_nombre: v.contacto_nombre || null,
        contacto_telefono: v.contacto_telefono || null,
        contacto_email: v.contacto_email || null,
        direccion: v.direccion || null,
        notas: v.notas || null,
      }
      if (v.id === null) {
        await proveedoresApi.create(payload)
        flash('Proveedor creado')
      } else {
        await proveedoresApi.update(v.id, { ...payload, is_active: v.is_active })
        flash('Proveedor actualizado')
      }
      setEditing(null)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar')
    } finally { setBusy(false) }
  }

  async function handleDelete(p: Proveedor) {
    if (!confirm(`¿Eliminar proveedor "${p.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await proveedoresApi.delete(p.id)
      flash('Proveedor eliminado')
      await reload()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Error al eliminar')
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = q
    ? rows.filter((p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.razon_social ?? '').toLowerCase().includes(q) ||
        (p.contacto_nombre ?? '').toLowerCase().includes(q) ||
        (p.contacto_telefono ?? '').includes(q) ||
        (p.rfc ?? '').toLowerCase().includes(q)
      )
    : rows

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, razón social, contacto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 rounded-lg border text-sm"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-app-muted">{filtered.length} de {rows.length}</span>
          <Button onClick={startNew}>
            <IconPlus size={14} /> Nuevo proveedor
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="py-16 text-center text-sm text-app-muted">
          Sin proveedores todavía. Click <span className="font-semibold text-accent">Nuevo proveedor</span> para empezar.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-[11px] uppercase tracking-widest text-app-muted border-b"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <th className="px-4 py-3 font-semibold">Proveedor</th>
                <th className="px-4 py-3 font-semibold">Razón social</th>
                <th className="px-4 py-3 font-semibold">Contacto</th>
                <th className="px-4 py-3 font-semibold">Teléfono</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Dirección</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-app">{p.nombre}</div>
                    {p.rfc && <div className="text-[11px] font-mono text-app-muted">{p.rfc}</div>}
                  </td>
                  <td className="px-4 py-3 text-app-secondary">{p.razon_social ?? '—'}</td>
                  <td className="px-4 py-3 text-app">{p.contacto_nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-app-secondary">{p.contacto_telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-app-secondary">{p.contacto_email ?? '—'}</td>
                  <td className="px-4 py-3 text-app-muted text-xs max-w-xs truncate" title={p.direccion ?? ''}>
                    {p.direccion ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => startEdit(p)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary"
                      aria-label="Editar"
                      title="Editar"
                    >
                      <IconEdit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary ml-1"
                      aria-label="Eliminar"
                      title="Eliminar"
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

      {editing && (
        <FormDrawer
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
  )
}

// ── Drawer ───────────────────────────────────────────────────────────────────
function FormDrawer({
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
      title={isCreate ? 'Nuevo proveedor' : `Editar ${value.nombre}`}
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
        <TextField
          label="Nombre"
          required
          value={value.nombre}
          onChange={(e) => onChange({ ...value, nombre: e.target.value })}
          placeholder="Chiltepec Flores"
          hint="Nombre corto / comercial con el que lo conoces."
        />
        <TextField
          label="Razón social"
          value={value.razon_social}
          onChange={(e) => onChange({ ...value, razon_social: e.target.value })}
          placeholder="Chiltepec Flores S.A. de C.V."
        />
        <TextField
          label="RFC"
          value={value.rfc}
          onChange={(e) => onChange({ ...value, rfc: e.target.value.toUpperCase() })}
          placeholder="CHF150412XXX"
        />

        <div className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-app-secondary mt-3 mb-2">
            Contacto
          </div>
          <div className="space-y-3">
            <TextField
              label="Nombre del contacto"
              value={value.contacto_nombre}
              onChange={(e) => onChange({ ...value, contacto_nombre: e.target.value })}
              placeholder="Lic. Ramiro Pérez"
            />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Teléfono"
                value={value.contacto_telefono}
                onChange={(e) => onChange({ ...value, contacto_telefono: e.target.value })}
                placeholder="818-234-5678"
              />
              <TextField
                label="Email"
                type="email"
                value={value.contacto_email}
                onChange={(e) => onChange({ ...value, contacto_email: e.target.value })}
                placeholder="contacto@proveedor.com"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-app-secondary mt-3 mb-2">
            Ubicación local
          </div>
          <label className="block">
            <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
              Dirección
            </div>
            <textarea
              rows={3}
              value={value.direccion}
              onChange={(e) => onChange({ ...value, direccion: e.target.value })}
              placeholder="Mercado de Flores, Local 12, Col. Industrial..."
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
              style={{
                background: 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </label>
        </div>

        <div className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          <label className="block">
            <div className="text-[11px] font-semibold tracking-widest uppercase mt-3 mb-1 text-app-secondary">
              Notas internas
            </div>
            <textarea
              rows={2}
              value={value.notas}
              onChange={(e) => onChange({ ...value, notas: e.target.value })}
              placeholder="Horarios, condiciones de pago, observaciones…"
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
              style={{
                background: 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </label>
        </div>

        {!isCreate && (
          <label className="flex items-center gap-2 text-sm text-app pt-2">
            <input
              type="checkbox"
              checked={value.is_active}
              onChange={(e) => onChange({ ...value, is_active: e.target.checked })}
              style={{ accentColor: 'var(--accent)' }}
            />
            Proveedor activo
          </label>
        )}

        {error && <div className="text-xs text-danger">{error}</div>}
      </div>
    </Drawer>
  )
}
