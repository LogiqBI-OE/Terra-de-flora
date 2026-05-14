// Tab: editar catálogos de TIPOS (familias) y UNIDADES de materiales.
// Cada uno es una lista editable inline con nombre + activo, drag-no, add/remove.

import { useEffect, useState } from 'react'
import Button from '../../../components/ui/Button'
import { IconEdit, IconPlus, IconTrash } from '../../../components/icons/Icons'
import {
  ApiError,
  materialesApi,
  type CatalogItem,
} from '../../../lib/api'

type Kind = 'familias' | 'unidades'

interface EditingRow {
  id: number | null
  nombre: string
  orden: number
  is_active: boolean
}

export default function TiposUnidadesTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <CatalogPanel kind="familias" title="Tipos de material" subtitle="Categoría a la que pertenece cada material (Flor, Vela, Mecánico, etc.)" />
      <CatalogPanel kind="unidades" title="Unidades" subtitle="Cómo se mide cada material (Paquete, Pieza, Tallo, etc.)" />
    </div>
  )
}

function CatalogPanel({ kind, title, subtitle }: { kind: Kind; title: string; subtitle: string }) {
  const [rows, setRows] = useState<CatalogItem[]>([])
  const [editing, setEditing] = useState<EditingRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const api = kind === 'familias'
    ? {
        list: materialesApi.listFamilias,
        create: materialesApi.createFamilia,
        update: materialesApi.updateFamilia,
        delete: materialesApi.deleteFamilia,
      }
    : {
        list: materialesApi.listUnidades,
        create: materialesApi.createUnidad,
        update: materialesApi.updateUnidad,
        delete: materialesApi.deleteUnidad,
      }

  async function reload() {
    try {
      setRows(await api.list())
    } catch (e) {
      console.error(e)
    }
  }
  useEffect(() => { reload() /* eslint-disable-next-line */ }, [kind])

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  function startNew() {
    setError(null)
    const maxOrden = rows.length > 0 ? Math.max(...rows.map(r => r.orden)) : 0
    setEditing({ id: null, nombre: '', orden: maxOrden + 10, is_active: true })
  }
  function startEdit(r: CatalogItem) {
    setError(null)
    setEditing({ id: r.id, nombre: r.nombre, orden: r.orden, is_active: r.is_active })
  }

  async function handleSave() {
    if (!editing || !editing.nombre.trim()) return
    setBusy(true); setError(null)
    try {
      if (editing.id === null) {
        await api.create({ nombre: editing.nombre.trim(), orden: editing.orden })
        flash('Agregado')
      } else {
        await api.update(editing.id, {
          nombre: editing.nombre.trim(),
          orden: editing.orden,
          is_active: editing.is_active,
        })
        flash('Actualizado')
      }
      setEditing(null)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al guardar')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(r: CatalogItem) {
    if (!confirm(`¿Eliminar "${r.nombre}"? Esta acción no se puede deshacer.`)) return
    try {
      await api.delete(r.id)
      flash('Eliminado')
      await reload()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Error al eliminar')
    }
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-app">{title}</h3>
          <p className="text-xs text-app-muted">{subtitle}</p>
        </div>
        <Button onClick={startNew}>
          <IconPlus size={13} /> Agregar
        </Button>
      </div>

      {/* Editor inline */}
      {editing && (
        <div
          className="rounded-lg border p-3 mb-3 space-y-2"
          style={{ borderColor: 'var(--accent)', background: 'var(--accent-bg-soft)' }}
        >
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Nombre</div>
              <input
                type="text"
                value={editing.nombre}
                onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                autoFocus
                placeholder={kind === 'familias' ? 'Ej: Vela' : 'Ej: Tallo'}
                className="w-full px-2.5 py-1.5 rounded border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                  if (e.key === 'Escape') setEditing(null)
                }}
              />
            </div>
            <div className="w-24">
              <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Orden</div>
              <input
                type="number"
                value={editing.orden}
                onChange={(e) => setEditing({ ...editing, orden: Number(e.target.value) || 0 })}
                className="w-full px-2.5 py-1.5 rounded border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
          {editing.id !== null && (
            <label className="flex items-center gap-2 text-xs text-app-secondary">
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                style={{ accentColor: 'var(--accent)' }}
              />
              Activo (visible en dropdowns)
            </label>
          )}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setEditing(null)}
              className="text-xs px-2 py-1 text-app-secondary hover:text-app"
            >
              Cancelar
            </button>
            <Button onClick={handleSave} disabled={busy || !editing.nombre.trim()}>
              {busy ? 'Guardando…' : (editing.id === null ? 'Crear' : 'Guardar')}
            </Button>
          </div>
          {error && <div className="text-xs text-danger">{error}</div>}
        </div>
      )}

      {/* Lista */}
      {rows.length === 0 ? (
        <div className="py-8 text-center text-xs text-app-muted">Sin items.</div>
      ) : (
        <ul className="space-y-1">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border"
              style={{
                borderColor: 'var(--border-soft)',
                background: r.is_active ? 'var(--bg-elevated)' : 'transparent',
                opacity: r.is_active ? 1 : 0.5,
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="text-[10px] font-mono w-6 text-right shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {r.orden}
                </span>
                <span className="text-sm font-medium text-app truncate">{r.nombre}</span>
                {!r.is_active && (
                  <span className="text-[10px] uppercase tracking-widest text-app-muted">inactivo</span>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => startEdit(r)}
                  className="p-1 rounded hover:bg-[var(--bg-hover)] text-app-secondary"
                  aria-label="Editar"
                ><IconEdit size={13} /></button>
                <button
                  onClick={() => handleDelete(r)}
                  className="p-1 rounded hover:bg-[var(--bg-hover)] text-app-secondary"
                  aria-label="Eliminar"
                ><IconTrash size={13} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

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
