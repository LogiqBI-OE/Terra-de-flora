// Catálogo de Recetas — /recetas. Lista + drawer editor con items.

import { useEffect, useMemo, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Drawer from '../../components/ui/Drawer'
import TextField from '../../components/ui/TextField'
import { IconEdit, IconPlus, IconTrash, IconX } from '../../components/icons/Icons'
import {
  ApiError,
  materialesApi,
  recetasApi,
  type Material,
  type Receta,
  type RecetaCatalog,
  type RecetaItemIn,
  type RecetaSummary,
} from '../../lib/api'

interface EditorItem {
  material_id: number | null
  cantidad: string
  notas: string
}

interface EditorValue {
  id: number | null
  nombre: string
  descripcion: string
  categoria: string
  items: EditorItem[]
  is_active: boolean
}

const EMPTY: EditorValue = {
  id: null,
  nombre: '',
  descripcion: '',
  categoria: 'Mesa',
  items: [],
  is_active: true,
}

const CATEGORIA_EMOJI: Record<string, string> = {
  'Mesa': '🌸',
  'Ambientación': '🎀',
  'Iglesia': '⛪',
  'Ramo': '💐',
  'Boutonniere': '🌹',
  'Arco': '🏛️',
  'Otro': '✨',
}

export default function RecetasPage() {
  const [rows, setRows] = useState<RecetaSummary[]>([])
  const [catalog, setCatalog] = useState<RecetaCatalog | null>(null)
  const [materiales, setMateriales] = useState<Material[]>([])
  const [editing, setEditing] = useState<EditorValue | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<string>('todas')

  async function reload() {
    try {
      const [r, c, m] = await Promise.all([
        recetasApi.list(),
        recetasApi.catalog(),
        materialesApi.list(),
      ])
      setRows(r); setCatalog(c); setMateriales(m)
    } catch (e) { console.error(e) }
  }
  useEffect(() => { reload() }, [])

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2500) }

  function startNew() {
    setError(null)
    setEditing({ ...EMPTY, items: [{ material_id: null, cantidad: '1', notas: '' }] })
  }

  async function startEdit(summary: RecetaSummary) {
    setError(null)
    try {
      const full = await recetasApi.get(summary.id)
      setEditing({
        id: full.id,
        nombre: full.nombre,
        descripcion: full.descripcion ?? '',
        categoria: full.categoria,
        is_active: full.is_active,
        items: full.items.map((it) => ({
          material_id: it.material_id,
          cantidad: String(it.cantidad),
          notas: it.notas ?? '',
        })),
      })
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Error al cargar receta')
    }
  }

  async function handleSave(v: EditorValue) {
    setBusy(true); setError(null)
    try {
      const items: RecetaItemIn[] = v.items
        .filter((it) => it.material_id !== null && Number(it.cantidad) > 0)
        .map((it) => ({
          material_id: it.material_id!,
          cantidad: Number(it.cantidad),
          notas: it.notas || null,
        }))

      if (v.id === null) {
        await recetasApi.create({
          nombre: v.nombre,
          descripcion: v.descripcion || null,
          categoria: v.categoria,
          items,
        })
        flash('Receta creada')
      } else {
        await recetasApi.update(v.id, {
          nombre: v.nombre,
          descripcion: v.descripcion || null,
          categoria: v.categoria,
          is_active: v.is_active,
          items,
        })
        flash('Receta actualizada')
      }
      setEditing(null)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar')
    } finally { setBusy(false) }
  }

  async function handleDelete(r: RecetaSummary) {
    if (!confirm(`¿Eliminar receta "${r.nombre}"? Se borrarán sus items.`)) return
    try {
      await recetasApi.delete(r.id)
      flash('Receta eliminada')
      await reload()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Error al eliminar')
    }
  }

  const categorias = catalog?.categorias ?? []
  const catCounts = useMemo(() => {
    const m = new Map<string, number>()
    rows.forEach((r) => m.set(r.categoria, (m.get(r.categoria) ?? 0) + 1))
    return m
  }, [rows])

  const q = search.trim().toLowerCase()
  const filtered = rows.filter((r) => {
    if (catFilter !== 'todas' && r.categoria !== catFilter) return false
    if (!q) return true
    return (
      r.nombre.toLowerCase().includes(q) ||
      (r.descripcion ?? '').toLowerCase().includes(q) ||
      r.categoria.toLowerCase().includes(q)
    )
  })

  return (
    <AppShell title="Recetas">
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app">Recetas</h2>
            <p className="text-sm text-app-secondary">
              Plantillas reutilizables de conceptos (centros de mesa, ambientaciones, ramos, etc).
              Cada receta lista los materiales y cantidades por unidad.
            </p>
          </div>
          <Button onClick={startNew}>
            <IconPlus size={14} /> Nueva receta
          </Button>
        </div>

        <Card>
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Buscar por nombre, categoría…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 max-w-md px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              <span className="text-xs text-app-muted">{filtered.length} de {rows.length}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <FilterPill label={`Todas (${rows.length})`} active={catFilter === 'todas'} onClick={() => setCatFilter('todas')} />
              {categorias.map((c) => (
                <FilterPill
                  key={c}
                  label={`${CATEGORIA_EMOJI[c] ?? ''} ${c} (${catCounts.get(c) ?? 0})`}
                  active={catFilter === c}
                  onClick={() => setCatFilter(c)}
                />
              ))}
            </div>

            {rows.length === 0 ? (
              <div className="py-16 text-center text-sm text-app-muted">
                Sin recetas todavía. Click <span className="font-semibold text-accent">Nueva receta</span> para crear una plantilla.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border p-4 flex flex-col gap-2 hover:border-[var(--accent)] cursor-pointer transition"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}
                    onClick={() => startEdit(r)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-2xl leading-none">{CATEGORIA_EMOJI[r.categoria] ?? '✨'}</div>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
                      >
                        {r.categoria}
                      </span>
                    </div>
                    <div className="font-semibold text-app text-sm">{r.nombre}</div>
                    {r.descripcion && (
                      <div className="text-xs text-app-muted line-clamp-2">{r.descripcion}</div>
                    )}
                    <div className="flex items-center justify-between mt-1 pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
                      <div className="text-[11px] text-app-muted">
                        {r.item_count} {r.item_count === 1 ? 'insumo' : 'insumos'}
                      </div>
                      <div className="text-sm font-bold" style={{ color: 'var(--accent-text)' }}>
                        ${Number(r.costo_estimado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="flex justify-end gap-1 mt-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); startEdit(r) }}
                        className="p-1 rounded hover:bg-[var(--bg-hover)] text-app-secondary"
                        aria-label="Editar"
                      ><IconEdit size={13} /></button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(r) }}
                        className="p-1 rounded hover:bg-[var(--bg-hover)] text-app-secondary"
                        aria-label="Eliminar"
                      ><IconTrash size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {editing && catalog && (
          <RecetaEditor
            value={editing}
            onChange={setEditing}
            onSave={handleSave}
            onClose={() => setEditing(null)}
            catalog={catalog}
            materiales={materiales}
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

// ── Editor (drawer ancho con tabla de items) ───────────────────────────────
function RecetaEditor({
  value, onChange, onSave, onClose, catalog, materiales, busy, error,
}: {
  value: EditorValue
  onChange: (v: EditorValue) => void
  onSave: (v: EditorValue) => void
  onClose: () => void
  catalog: RecetaCatalog
  materiales: Material[]
  busy: boolean
  error: string | null
}) {
  const isCreate = value.id === null

  function addItem() {
    onChange({ ...value, items: [...value.items, { material_id: null, cantidad: '1', notas: '' }] })
  }
  function removeItem(idx: number) {
    onChange({ ...value, items: value.items.filter((_, i) => i !== idx) })
  }
  function updateItem(idx: number, patch: Partial<EditorItem>) {
    onChange({
      ...value,
      items: value.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    })
  }

  // Costo estimado en vivo (mientras editas)
  const matById = useMemo(() => new Map(materiales.map((m) => [m.id, m])), [materiales])
  const costo = value.items.reduce((acc, it) => {
    if (it.material_id === null) return acc
    const m = matById.get(it.material_id)
    if (!m) return acc
    const contenido = Number(m.contenido_por_paquete) || 1
    const precioUnit = contenido > 0 ? (Number(m.precio_paquete) / contenido) : 0
    return acc + (Number(it.cantidad) || 0) * precioUnit
  }, 0)

  return (
    <Drawer
      open
      onClose={onClose}
      title={isCreate ? 'Nueva receta' : `Editar ${value.nombre}`}
      width={760}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(value)} disabled={busy || !value.nombre.trim()}>
            {busy ? 'Guardando…' : isCreate ? 'Crear receta' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Header de la receta */}
        <div className="space-y-3">
          <TextField
            label="Nombre"
            required
            value={value.nombre}
            onChange={(e) => onChange({ ...value, nombre: e.target.value })}
            placeholder="Centro de mesa redondo base"
          />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block">
                <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
                  Descripción
                </div>
                <input
                  type="text"
                  value={value.descripcion}
                  onChange={(e) => onChange({ ...value, descripcion: e.target.value })}
                  placeholder="Para mesas redondas de 8 personas"
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </label>
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
                Categoría
              </div>
              <select
                value={value.categoria}
                onChange={(e) => onChange({ ...value, categoria: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm cursor-pointer"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              >
                {catalog.categorias.map((c) => (
                  <option key={c} value={c}>{CATEGORIA_EMOJI[c] ?? ''} {c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="flex items-center justify-between mt-3 mb-3">
            <div className="text-[11px] font-bold tracking-[0.2em] uppercase text-app-secondary">
              Insumos por unidad
            </div>
            <button
              onClick={addItem}
              className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded transition"
              style={{ color: 'var(--accent-text)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg-soft)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <IconPlus size={13} /> Agregar insumo
            </button>
          </div>

          {value.items.length === 0 ? (
            <div className="py-6 text-center text-xs text-app-muted">
              Sin insumos. Click <span className="font-semibold">Agregar insumo</span> para empezar.
            </div>
          ) : (
            <div className="space-y-2">
              {value.items.map((it, idx) => {
                const m = it.material_id !== null ? matById.get(it.material_id) : null
                const precioUnit = m
                  ? (Number(m.precio_paquete) / (Number(m.contenido_por_paquete) || 1))
                  : 0
                const subtotal = precioUnit * (Number(it.cantidad) || 0)
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-start p-2 rounded-lg border"
                    style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-elevated)' }}
                  >
                    <div className="col-span-5">
                      <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Material</div>
                      <select
                        value={it.material_id ?? ''}
                        onChange={(e) => updateItem(idx, { material_id: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-2 py-1.5 rounded border text-xs cursor-pointer"
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      >
                        <option value="">— Selecciona material —</option>
                        {materiales.map((mm) => (
                          <option key={mm.id} value={mm.id}>
                            {mm.familia.charAt(0)} · {mm.nombre}
                          </option>
                        ))}
                      </select>
                      {m && (
                        <div className="text-[10px] text-app-muted mt-0.5">
                          {m.familia} · ${precioUnit.toFixed(2)}/{m.unidad}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Cantidad</div>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={it.cantidad}
                        onChange={(e) => updateItem(idx, { cantidad: e.target.value })}
                        className="w-full px-2 py-1.5 rounded border text-xs"
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div className="col-span-3">
                      <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Notas</div>
                      <input
                        type="text"
                        value={it.notas}
                        onChange={(e) => updateItem(idx, { notas: e.target.value })}
                        placeholder="Opcional"
                        className="w-full px-2 py-1.5 rounded border text-xs"
                        style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div className="col-span-1 text-right">
                      <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Sub</div>
                      <div className="text-xs font-semibold text-app pt-1.5">
                        ${subtotal.toFixed(0)}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-end pt-5">
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1 rounded hover:bg-[var(--bg-hover)] text-app-muted"
                        aria-label="Quitar"
                      ><IconX size={14} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Costo estimado total */}
          <div
            className="mt-3 p-3 rounded-lg flex items-center justify-between"
            style={{ background: 'var(--accent-bg-soft)' }}
          >
            <div>
              <div className="text-xs text-app-secondary">Costo estimado por 1 unidad de receta:</div>
              <div className="text-[10px] text-app-muted">
                Suma de cantidad × precio unitario actual de cada material.
              </div>
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--accent-text)' }}>
              ${costo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {!isCreate && (
          <label className="flex items-center gap-2 text-sm text-app pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
            <input
              type="checkbox"
              checked={value.is_active}
              onChange={(e) => onChange({ ...value, is_active: e.target.checked })}
              style={{ accentColor: 'var(--accent)' }}
            />
            <span className="pt-3">Receta activa</span>
          </label>
        )}

        {error && <div className="text-xs text-danger">{error}</div>}
      </div>
    </Drawer>
  )
}
