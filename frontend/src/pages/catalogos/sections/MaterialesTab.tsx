// Tab Materiales: catalogo de flores/insumos.
// El precio unitario se calcula auto (precio_paquete / contenido).

import { useEffect, useMemo, useState } from 'react'
import Button from '../../../components/ui/Button'
import Drawer from '../../../components/ui/Drawer'
import TextField from '../../../components/ui/TextField'
import { IconEdit, IconPlus, IconTrash } from '../../../components/icons/Icons'
import {
  ApiError,
  materialesApi,
  proveedoresApi,
  type Material,
  type MaterialCatalog,
  type MaterialCreatePayload,
  type Proveedor,
} from '../../../lib/api'
import { fmtMoney } from '../../../lib/format'

interface FormValue {
  id: number | null
  codigo: string
  nombre: string
  familia: string
  unidad: string
  contenido_por_paquete: string  // string en UI, se convierte a number al guardar
  precio_paquete: string
  proveedor_id: number | null
  notas: string
  is_active: boolean
}

const EMPTY: FormValue = {
  id: null,
  codigo: '',
  nombre: '',
  familia: 'Flor',
  unidad: 'paquete',
  contenido_por_paquete: '1',
  precio_paquete: '0',
  proveedor_id: null,
  notas: '',
  is_active: true,
}

// Emoji por nombre conocido. Los tipos custom (que el L9 cree desde la
// tab "Tipos y unidades") muestran el fallback ✨.
const FAMILIA_EMOJI: Record<string, string> = {
  'Flor': '🌷',
  'Material': '📦',
  'Base': '🏺',
  'Oasis': '🟢',
  'Mecánico': '🔧',
  'Vela': '🕯️',
  'Consumible': '📦',
  'Servicio externo': '🤝',
  'Terra de Flora': '🌸',
  'Otro': '✨',
}
const emojiFor = (familia: string): string => FAMILIA_EMOJI[familia] ?? '✨'

export default function MaterialesTab() {
  const [rows, setRows] = useState<Material[]>([])
  const [catalog, setCatalog] = useState<MaterialCatalog | null>(null)
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [search, setSearch] = useState('')
  const [familiaFilter, setFamiliaFilter] = useState<string>('todas')
  const [editing, setEditing] = useState<FormValue | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  async function reload() {
    try {
      const [m, c, p] = await Promise.all([
        materialesApi.list(),
        materialesApi.catalog(),
        proveedoresApi.list(),
      ])
      setRows(m); setCatalog(c); setProveedores(p)
    } catch (e) { console.error(e) }
  }
  useEffect(() => { reload() }, [])

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  function startNew() { setError(null); setEditing({ ...EMPTY }) }
  function startEdit(m: Material) {
    setError(null)
    setEditing({
      id: m.id,
      codigo: m.codigo ?? '',
      nombre: m.nombre,
      familia: m.familia,
      unidad: m.unidad,
      contenido_por_paquete: String(m.contenido_por_paquete),
      precio_paquete: String(m.precio_paquete),
      proveedor_id: m.proveedor_id,
      notas: m.notas ?? '',
      is_active: m.is_active,
    })
  }

  async function handleSave(v: FormValue) {
    setBusy(true); setError(null)
    try {
      const payload: MaterialCreatePayload = {
        codigo: v.codigo || null,
        nombre: v.nombre,
        familia: v.familia,
        unidad: v.unidad,
        contenido_por_paquete: Number(v.contenido_por_paquete) || 1,
        precio_paquete: Number(v.precio_paquete) || 0,
        proveedor_id: v.proveedor_id,
        notas: v.notas || null,
      }
      if (v.id === null) {
        await materialesApi.create(payload)
        flash('Material creado')
      } else {
        await materialesApi.update(v.id, { ...payload, is_active: v.is_active })
        flash('Material actualizado')
      }
      setEditing(null)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar')
    } finally { setBusy(false) }
  }

  async function handleDelete(m: Material) {
    if (!confirm(`¿Eliminar material "${m.nombre}"?`)) return
    try {
      await materialesApi.delete(m.id)
      flash('Material eliminado')
      await reload()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Error al eliminar')
    }
  }

  const familias = catalog?.familias ?? []
  const familiaCounts = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((r) => m.set(r.familia, (m.get(r.familia) ?? 0) + 1))
    return m
  }, [rows])

  const q = search.trim().toLowerCase()
  const filtered = rows.filter((m) => {
    if (familiaFilter !== 'todas' && m.familia !== familiaFilter) return false
    if (!q) return true
    return (
      m.nombre.toLowerCase().includes(q) ||
      (m.codigo ?? '').toLowerCase().includes(q) ||
      m.familia.toLowerCase().includes(q) ||
      (m.proveedor_nombre ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Buscar por nombre, código, tipo, proveedor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-app-muted">{filtered.length} de {rows.length}</span>
          <Button onClick={startNew}>
            <IconPlus size={14} /> Nuevo material
          </Button>
        </div>
      </div>

      {/* Familia filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <FilterPill label={`Todas (${rows.length})`} active={familiaFilter === 'todas'} onClick={() => setFamiliaFilter('todas')} />
        {familias.map((f) => (
          <FilterPill
            key={f}
            label={`${emojiFor(f)} ${f} (${familiaCounts.get(f) ?? 0})`}
            active={familiaFilter === f}
            onClick={() => setFamiliaFilter(f)}
          />
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="py-16 text-center text-sm text-app-muted">
          Sin materiales todavía. Click <span className="font-semibold text-accent">Nuevo material</span> para empezar.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-[11px] uppercase tracking-widest text-app-muted border-b"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Material</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Proveedor</th>
                <th className="px-4 py-3 font-semibold text-right">Paquete</th>
                <th className="px-4 py-3 font-semibold text-right">Precio paq.</th>
                <th className="px-4 py-3 font-semibold text-right">Precio unit.</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
                  <td className="px-4 py-3 font-mono text-xs text-app-muted">{m.codigo ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-app">{m.nombre}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                      style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
                    >
                      {emojiFor(m.familia)} {m.familia}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-app-secondary">{m.proveedor_nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-app-secondary">
                    {Number(m.contenido_por_paquete)} {m.unidad}
                  </td>
                  <td className="px-4 py-3 text-right text-app">{fmtMoney(m.precio_paquete)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-app">{fmtMoney(m.precio_unitario)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => startEdit(m)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary"
                      aria-label="Editar" title="Editar"
                    ><IconEdit size={14} /></button>
                    <button
                      onClick={() => handleDelete(m)}
                      className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary ml-1"
                      aria-label="Eliminar" title="Eliminar"
                    ><IconTrash size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && catalog && (
        <MaterialFormDrawer
          value={editing}
          onChange={setEditing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          catalog={catalog}
          proveedores={proveedores}
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

function MaterialFormDrawer({
  value, onChange, onSave, onClose, catalog, proveedores, busy, error,
}: {
  value: FormValue
  onChange: (v: FormValue) => void
  onSave: (v: FormValue) => void
  onClose: () => void
  catalog: MaterialCatalog
  proveedores: Proveedor[]
  busy: boolean
  error: string | null
}) {
  const isCreate = value.id === null
  const contenido = Number(value.contenido_por_paquete) || 0
  const precioPaq = Number(value.precio_paquete) || 0
  const precioUnit = contenido > 0 ? (precioPaq / contenido) : 0

  return (
    <Drawer
      open
      onClose={onClose}
      title={isCreate ? 'Nuevo material' : `Editar ${value.nombre}`}
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
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <TextField
              label="Nombre"
              required
              value={value.nombre}
              onChange={(e) => onChange({ ...value, nombre: e.target.value })}
              placeholder="Rosa lila"
            />
          </div>
          <TextField
            label="Código"
            value={value.codigo}
            onChange={(e) => onChange({ ...value, codigo: e.target.value.toUpperCase() })}
            placeholder="ROS-LIL"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
              Tipo <span style={{ color: 'var(--danger)' }}>*</span>
            </div>
            <select
              value={value.familia}
              onChange={(e) => onChange({ ...value, familia: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm cursor-pointer"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              {catalog.familias.map((f) => (
                <option key={f} value={f}>{emojiFor(f)} {f}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
              Unidad <span style={{ color: 'var(--danger)' }}>*</span>
            </div>
            <select
              value={value.unidad}
              onChange={(e) => onChange({ ...value, unidad: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm cursor-pointer"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              {catalog.unidades.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-app-secondary mt-3 mb-2">
            Precio
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Contenido por paquete"
              type="number"
              required
              value={value.contenido_por_paquete}
              onChange={(e) => onChange({ ...value, contenido_por_paquete: e.target.value })}
              placeholder="24"
              hint="Cuántas piezas vienen en cada paquete que compras."
            />
            <TextField
              label="Precio del paquete"
              type="number"
              required
              value={value.precio_paquete}
              onChange={(e) => onChange({ ...value, precio_paquete: e.target.value })}
              placeholder="250"
              hint="Precio total del paquete (MXN)."
            />
          </div>
          <div
            className="mt-3 p-3 rounded-lg flex items-center justify-between"
            style={{ background: 'var(--accent-bg-soft)' }}
          >
            <span className="text-xs text-app-secondary">Precio unitario calculado:</span>
            <span className="text-lg font-bold" style={{ color: 'var(--accent-text)' }}>
              {fmtMoney(precioUnit)}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="text-[11px] font-semibold tracking-widest uppercase mt-3 mb-1 text-app-secondary">
            Proveedor
          </div>
          <select
            value={value.proveedor_id ?? ''}
            onChange={(e) => onChange({ ...value, proveedor_id: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2 rounded-lg border text-sm cursor-pointer"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="">— Sin proveedor —</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <label className="block">
          <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
            Notas
          </div>
          <textarea
            rows={2}
            value={value.notas}
            onChange={(e) => onChange({ ...value, notas: e.target.value })}
            placeholder="Tip de uso, equivalentes, etc."
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
            Material activo
          </label>
        )}

        {error && <div className="text-xs text-danger">{error}</div>}
      </div>
    </Drawer>
  )
}
