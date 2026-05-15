// Tab Cotizacion — versiones + secciones + items.
// Vertical slice: Arreglos funcional, Logistica como placeholder.

import { useEffect, useMemo, useState } from 'react'
import Button from '../../../components/ui/Button'
import { fmtMoney } from '../../../lib/format'
import {
  ApiError,
  cotizacionesApi,
  recetasApi,
  type Cotizacion,
  type CotizacionCatalog,
  type CotizacionSummary,
  type EstadoCotizacion,
  type ProyectoRow,
  type RecetaSummary,
} from '../../../lib/api'

interface Props {
  proyecto: ProyectoRow
}

const ESTADO_META: Record<EstadoCotizacion, { label: string; bg: string; text: string }> = {
  borrador:  { label: 'Borrador',  bg: 'rgba(148, 163, 184, 0.18)', text: '#475569' },
  enviada:   { label: 'Enviada',   bg: 'rgba(14, 165, 233, 0.18)',  text: '#0284C7' },
  aprobada:  { label: 'Aprobada',  bg: 'rgba(16, 185, 129, 0.18)',  text: '#059669' },
  rechazada: { label: 'Rechazada', bg: 'rgba(244, 63, 94, 0.18)',   text: '#E11D48' },
}

type SubTab = 'arreglos' | 'logistica'

export default function CotizacionTab({ proyecto }: Props) {
  const [versiones, setVersiones] = useState<CotizacionSummary[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [cot, setCot] = useState<Cotizacion | null>(null)
  const [catalog, setCatalog] = useState<CotizacionCatalog | null>(null)
  const [recetas, setRecetas] = useState<RecetaSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [subTab, setSubTab] = useState<SubTab>('arreglos')
  const [showCosts, setShowCosts] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function reloadVersions(): Promise<CotizacionSummary[]> {
    const list = await cotizacionesApi.list(proyecto.id)
    setVersiones(list)
    return list
  }

  async function reloadActive(cid: number) {
    const c = await cotizacionesApi.get(cid)
    setCot(c)
  }

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      cotizacionesApi.list(proyecto.id),
      cotizacionesApi.catalog(proyecto.id),
      recetasApi.list(),
    ])
      .then(async ([list, cat, recs]) => {
        if (!alive) return
        setVersiones(list)
        setCatalog(cat)
        setRecetas(recs)
        if (list.length > 0) {
          setActiveId(list[0].id)
          const c = await cotizacionesApi.get(list[0].id)
          if (alive) setCot(c)
        }
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error cargando cotización'))
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [proyecto.id])

  useEffect(() => {
    if (activeId !== null && (!cot || cot.id !== activeId)) {
      reloadActive(activeId).catch(console.error)
    }
  }, [activeId])

  const isFrozen = !!cot?.snapshot_at

  async function handleCreateFirst() {
    setBusy(true); setError(null)
    try {
      const c = await cotizacionesApi.create(proyecto.id, {})
      await reloadVersions()
      setActiveId(c.id); setCot(c)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al crear versión')
    } finally { setBusy(false) }
  }

  async function handleDuplicate() {
    if (!cot) return
    setBusy(true); setError(null)
    try {
      const c = await cotizacionesApi.duplicate(proyecto.id, cot.id)
      await reloadVersions()
      setActiveId(c.id); setCot(c)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al duplicar')
    } finally { setBusy(false) }
  }

  async function handleChangeEstado(estado: EstadoCotizacion) {
    if (!cot) return
    setBusy(true); setError(null)
    try {
      const c = await cotizacionesApi.update(cot.id, { estado })
      setCot(c)
      await reloadVersions()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cambiar estado')
    } finally { setBusy(false) }
  }

  async function handleChangeMargen(value: number) {
    if (!cot) return
    try {
      const c = await cotizacionesApi.update(cot.id, { margen_default: value })
      setCot(c)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error')
    }
  }

  async function handleAddSeccion(nombre: string) {
    if (!cot) return
    try {
      await cotizacionesApi.createSeccion(cot.id, { nombre, orden: cot.secciones.length })
      await reloadActive(cot.id)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al agregar sección')
    }
  }

  async function handleDeleteSeccion(sid: number) {
    if (!cot) return
    if (!confirm('¿Borrar esta sección y todos sus items?')) return
    try {
      await cotizacionesApi.deleteSeccion(sid)
      await reloadActive(cot.id)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error')
    }
  }

  async function handleAddItem(sid: number, recetaId: number) {
    if (!cot) return
    try {
      const sec = cot.secciones.find((s) => s.id === sid)
      await cotizacionesApi.createItem(sid, {
        receta_id: recetaId,
        cantidad: 1,
        orden: sec?.items.length ?? 0,
      })
      await reloadActive(cot.id)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error')
    }
  }

  async function handleUpdateItem(iid: number, patch: { cantidad?: number; precio_venta_unit?: number | null }) {
    if (!cot) return
    try {
      await cotizacionesApi.updateItem(iid, patch)
      await reloadActive(cot.id)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error')
    }
  }

  async function handleDeleteItem(iid: number) {
    if (!cot) return
    try {
      await cotizacionesApi.deleteItem(iid)
      await reloadActive(cot.id)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error')
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-app-muted">Cargando cotización…</div>
  }

  // Sin versiones todavía: estado vacío con CTA
  if (versiones.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="text-5xl mb-3 opacity-70">🧾</div>
        <h3 className="text-lg font-bold text-app mb-1">Sin cotización todavía</h3>
        <p className="text-sm text-app-secondary max-w-md mx-auto mb-5">
          Crea la primera versión para empezar a cotizar arreglos y logística para este evento.
        </p>
        <Button onClick={handleCreateFirst} disabled={busy}>
          {busy ? 'Creando…' : '+ Crear versión 1'}
        </Button>
        {error && <div className="mt-4 text-xs" style={{ color: 'var(--danger)' }}>{error}</div>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de versiones */}
      <div
        className="flex items-center gap-2 flex-wrap rounded-xl border p-3"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
      >
        <span className="text-[10px] uppercase tracking-widest text-app-muted font-semibold mr-1">
          Versiones
        </span>
        {versiones.map((v) => {
          const meta = ESTADO_META[v.estado]
          const active = v.id === activeId
          return (
            <button
              key={v.id}
              onClick={() => setActiveId(v.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
              style={{
                background: active ? 'var(--accent)' : 'var(--bg-card)',
                color: active ? 'var(--text-on-accent)' : 'var(--text-primary)',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <span>v{v.version}</span>
              <span
                className="px-1.5 py-0.5 rounded-full text-[9px]"
                style={{
                  background: active ? 'rgba(255,255,255,0.2)' : meta.bg,
                  color: active ? 'inherit' : meta.text,
                }}
              >
                {meta.label}
              </span>
              {v.snapshot_at && <span title="Congelada">🔒</span>}
            </button>
          )
        })}
        <div className="flex-1" />
        {cot && (
          <Button variant="secondary" onClick={handleDuplicate} disabled={busy}>
            + Nueva versión {isFrozen ? '(desde esta)' : '(duplicar)'}
          </Button>
        )}
      </div>

      {!cot ? (
        <div className="py-8 text-center text-sm text-app-muted">Cargando versión…</div>
      ) : (
        <>
          {/* Sub-tabs Arreglos / Logistica */}
          <div
            className="flex items-center gap-1 border-b"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            {(['arreglos', 'logistica'] as SubTab[]).map((t) => {
              const active = subTab === t
              const label = t === 'arreglos' ? '💐 Arreglos' : '🚚 Logística'
              return (
                <button
                  key={t}
                  onClick={() => setSubTab(t)}
                  className="px-4 py-2 text-sm font-semibold transition"
                  style={{
                    color: active ? 'var(--accent-text)' : 'var(--text-secondary)',
                    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                    marginBottom: '-1px',
                  }}
                >
                  {label}
                </button>
              )
            })}
            <div className="flex-1" />
            <label className="text-xs text-app-secondary inline-flex items-center gap-2 mr-3">
              <input
                type="checkbox"
                checked={showCosts}
                onChange={(e) => setShowCosts(e.target.checked)}
              />
              Mostrar costo interno
            </label>
          </div>

          {/* Controles de la versión (estado + margen) */}
          <div
            className="flex items-center gap-3 flex-wrap rounded-xl border p-3"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-app-muted font-semibold">
                Estado
              </span>
              <select
                value={cot.estado}
                onChange={(e) => handleChangeEstado(e.target.value as EstadoCotizacion)}
                disabled={busy}
                className="px-2 py-1 rounded-md border text-xs"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="borrador">Borrador</option>
                <option value="enviada">Enviada</option>
                <option value="aprobada">Aprobada</option>
                <option value="rechazada">Rechazada</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-app-muted font-semibold">
                Margen default
              </span>
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={Math.round(Number(cot.margen_default) * 100)}
                onChange={(e) => handleChangeMargen(Number(e.target.value) / 100)}
                disabled={busy || isFrozen}
                className="w-16 px-2 py-1 rounded-md border text-xs text-right"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              <span className="text-xs text-app-secondary">%</span>
            </div>

            {isFrozen && (
              <div
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest"
                style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
              >
                🔒 Congelada · {new Date(cot.snapshot_at!).toLocaleDateString('es-MX')}
              </div>
            )}

            <div className="flex-1" />

            {error && (
              <span className="text-xs" style={{ color: 'var(--danger)' }}>
                {error}
              </span>
            )}
          </div>

          {subTab === 'arreglos' && (
            <ArreglosView
              cot={cot}
              catalog={catalog}
              recetas={recetas}
              showCosts={showCosts}
              isFrozen={isFrozen}
              onAddSeccion={handleAddSeccion}
              onDeleteSeccion={handleDeleteSeccion}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
            />
          )}

          {subTab === 'logistica' && (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3 opacity-70">🚚</div>
              <h3 className="text-lg font-bold text-app mb-1">Logística</h3>
              <p className="text-sm text-app-secondary max-w-md mx-auto">
                Aquí cotizamos montaje/desmontaje por jornada: sueldos, comida y transporte.
                Próximo paso del rollout.
              </p>
              <div
                className="mt-5 inline-block px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest"
                style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
              >
                Próximamente
              </div>
            </div>
          )}

          {/* Footer sticky con totales */}
          <TotalsFooter cot={cot} showCosts={showCosts} />
        </>
      )}
    </div>
  )
}

// ─── Vista Arreglos ──────────────────────────────────────────────────────
interface ArreglosProps {
  cot: Cotizacion
  catalog: CotizacionCatalog | null
  recetas: RecetaSummary[]
  showCosts: boolean
  isFrozen: boolean
  onAddSeccion: (nombre: string) => void
  onDeleteSeccion: (sid: number) => void
  onAddItem: (sid: number, recetaId: number) => void
  onUpdateItem: (iid: number, patch: { cantidad?: number; precio_venta_unit?: number | null }) => void
  onDeleteItem: (iid: number) => void
}

function ArreglosView(p: ArreglosProps) {
  const { cot, catalog, recetas, showCosts, isFrozen } = p
  const [customName, setCustomName] = useState('')

  return (
    <div className="space-y-4">
      {cot.secciones.length === 0 && (
        <div
          className="rounded-xl border border-dashed py-10 text-center"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-3xl mb-2 opacity-70">📂</div>
          <p className="text-sm text-app-secondary">Agrega tu primera sección abajo.</p>
        </div>
      )}

      {cot.secciones.map((s) => (
        <SeccionCard
          key={s.id}
          seccion={s}
          showCosts={showCosts}
          isFrozen={isFrozen}
          recetas={recetas}
          onAddItem={(rid) => p.onAddItem(s.id, rid)}
          onDeleteSeccion={() => p.onDeleteSeccion(s.id)}
          onUpdateItem={p.onUpdateItem}
          onDeleteItem={p.onDeleteItem}
        />
      ))}

      {/* Agregar sección */}
      {!isFrozen && (
        <div
          className="rounded-xl border p-3 space-y-2"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
        >
          <div className="text-[10px] uppercase tracking-widest text-app-muted font-semibold">
            Agregar sección
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {catalog?.secciones_tipo.map((t) => (
              <button
                key={t.nombre}
                onClick={() => p.onAddSeccion(t.nombre)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                <span className="mr-1">{t.emoji}</span>{t.nombre}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="O escribe un nombre custom…"
              className="flex-1 px-3 py-1.5 rounded-md border text-sm"
              style={{
                background: 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <Button
              variant="secondary"
              onClick={() => {
                if (customName.trim()) {
                  p.onAddSeccion(customName.trim())
                  setCustomName('')
                }
              }}
              disabled={!customName.trim()}
            >
              + Agregar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sección colapsable ──────────────────────────────────────────────────
interface SeccionProps {
  seccion: Cotizacion['secciones'][number]
  showCosts: boolean
  isFrozen: boolean
  recetas: RecetaSummary[]
  onAddItem: (recetaId: number) => void
  onDeleteSeccion: () => void
  onUpdateItem: (iid: number, patch: { cantidad?: number; precio_venta_unit?: number | null }) => void
  onDeleteItem: (iid: number) => void
}

function SeccionCard({
  seccion, showCosts, isFrozen, recetas,
  onAddItem, onDeleteSeccion, onUpdateItem, onDeleteItem,
}: SeccionProps) {
  const [open, setOpen] = useState(true)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return recetas
    return recetas.filter((r) =>
      r.nombre.toLowerCase().includes(q) || r.categoria.toLowerCase().includes(q),
    )
  }, [recetas, search])

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-elevated)' }}
      >
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-app-muted hover:text-app transition text-sm w-5"
        >
          {open ? '▾' : '▸'}
        </button>
        <h4 className="font-semibold text-app">{seccion.nombre}</h4>
        <span className="text-xs text-app-muted">
          {seccion.items.length} {seccion.items.length === 1 ? 'item' : 'items'}
        </span>
        <div className="flex-1" />
        {showCosts && (
          <span className="text-xs text-app-secondary">
            Costo: <strong className="text-app">{fmtMoney(seccion.subtotal_costo)}</strong>
          </span>
        )}
        <span className="text-sm font-bold text-app">{fmtMoney(seccion.subtotal_venta)}</span>
        {!isFrozen && (
          <button
            onClick={onDeleteSeccion}
            className="text-app-muted hover:text-red-500 transition text-xs ml-2"
            title="Borrar sección"
          >
            🗑️
          </button>
        )}
      </div>

      {open && (
        <div className="px-4 py-3 space-y-2">
          {seccion.items.length === 0 && (
            <div className="text-xs text-app-muted py-2 text-center">
              Aún no hay items en esta sección.
            </div>
          )}

          {seccion.items.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              showCosts={showCosts}
              isFrozen={isFrozen}
              onUpdate={(patch) => onUpdateItem(it.id, patch)}
              onDelete={() => onDeleteItem(it.id)}
            />
          ))}

          {!isFrozen && (
            <>
              {!pickerOpen ? (
                <button
                  onClick={() => setPickerOpen(true)}
                  className="w-full mt-2 py-2 rounded-lg border-dashed border text-xs font-semibold text-app-secondary hover:text-app transition"
                  style={{ borderColor: 'var(--border)' }}
                >
                  + Agregar receta del catálogo
                </button>
              ) : (
                <div
                  className="rounded-lg border p-3 space-y-2"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
                >
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar receta…"
                      className="flex-1 px-3 py-1.5 rounded-md border text-sm"
                      style={{
                        background: 'var(--bg-input)',
                        borderColor: 'var(--border)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      onClick={() => { setPickerOpen(false); setSearch('') }}
                      className="text-app-muted hover:text-app text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto -mx-1">
                    {filtered.length === 0 && (
                      <div className="text-xs text-app-muted py-3 text-center">
                        Sin resultados. <a href="/recetas" className="underline">Crear receta</a>
                      </div>
                    )}
                    {filtered.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          onAddItem(r.id)
                          setPickerOpen(false)
                          setSearch('')
                        }}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-black/5 transition text-left text-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-app truncate">{r.nombre}</div>
                          <div className="text-[10px] text-app-muted uppercase tracking-wide">
                            {r.categoria} · {r.item_count} insumos
                          </div>
                        </div>
                        <div className="text-xs text-app-secondary shrink-0">
                          {fmtMoney(r.costo_estimado)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Fila de item ─────────────────────────────────────────────────────────
interface ItemRowProps {
  item: Cotizacion['secciones'][number]['items'][number]
  showCosts: boolean
  isFrozen: boolean
  onUpdate: (patch: { cantidad?: number; precio_venta_unit?: number | null }) => void
  onDelete: () => void
}

function ItemRow({ item, showCosts, isFrozen, onUpdate, onDelete }: ItemRowProps) {
  const [cant, setCant] = useState(String(item.cantidad))
  const [precio, setPrecio] = useState(
    item.precio_venta_unit !== null ? String(item.precio_venta_unit) : ''
  )

  useEffect(() => {
    setCant(String(item.cantidad))
    setPrecio(item.precio_venta_unit !== null ? String(item.precio_venta_unit) : '')
  }, [item.id, item.cantidad, item.precio_venta_unit])

  const overridden = item.precio_venta_unit !== null

  return (
    <div
      className="grid grid-cols-12 items-center gap-3 px-3 py-2 rounded-lg border"
      style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-elevated)' }}
    >
      <div className="col-span-12 md:col-span-5 min-w-0">
        <div className="font-medium text-app truncate">{item.nombre}</div>
        {showCosts && (
          <div className="text-[10px] text-app-muted uppercase tracking-wide">
            Costo unit. {fmtMoney(item.costo_unit)}
          </div>
        )}
      </div>

      <div className="col-span-3 md:col-span-2">
        <label className="text-[9px] uppercase tracking-widest text-app-muted block mb-0.5">Cant.</label>
        <input
          type="number"
          min={0}
          step={1}
          value={cant}
          disabled={isFrozen}
          onChange={(e) => setCant(e.target.value)}
          onBlur={() => {
            const n = Number(cant)
            if (Number.isFinite(n) && n !== Number(item.cantidad)) onUpdate({ cantidad: n })
          }}
          className="w-full px-2 py-1 rounded-md border text-sm text-right"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="col-span-5 md:col-span-3">
        <label className="text-[9px] uppercase tracking-widest text-app-muted block mb-0.5">
          P. venta unit. {overridden && <span style={{ color: 'var(--accent-text)' }}>(override)</span>}
        </label>
        <input
          type="number"
          min={0}
          step={1}
          value={precio || (overridden ? '' : Number(item.precio_venta_calc).toFixed(0))}
          placeholder={Number(item.precio_venta_calc).toFixed(0)}
          disabled={isFrozen}
          onChange={(e) => setPrecio(e.target.value)}
          onBlur={() => {
            if (precio === '') {
              if (overridden) onUpdate({ precio_venta_unit: null })
              return
            }
            const n = Number(precio)
            if (Number.isFinite(n) && n !== Number(item.precio_venta_unit ?? -1)) {
              onUpdate({ precio_venta_unit: n })
            }
          }}
          className="w-full px-2 py-1 rounded-md border text-sm text-right"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      <div className="col-span-3 md:col-span-1 text-right">
        <label className="text-[9px] uppercase tracking-widest text-app-muted block mb-0.5">Subtotal</label>
        <div className="text-sm font-bold text-app">{fmtMoney(item.subtotal_venta)}</div>
      </div>

      <div className="col-span-1 text-right">
        {!isFrozen && (
          <button
            onClick={onDelete}
            className="text-app-muted hover:text-red-500 transition text-sm"
            title="Borrar item"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Footer de totales ────────────────────────────────────────────────────
function TotalsFooter({ cot, showCosts }: { cot: Cotizacion; showCosts: boolean }) {
  const margen = Number(cot.margen_real) * 100
  return (
    <div
      className="sticky bottom-2 rounded-2xl border p-4 backdrop-blur"
      style={{
        background: 'color-mix(in oklab, var(--bg-card) 92%, transparent)',
        borderColor: 'var(--border)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      }}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-6 flex-wrap text-sm">
          {showCosts && (
            <>
              <Stat label="Costo total" value={fmtMoney(cot.total_costo)} />
              <Stat
                label="Margen"
                value={`${margen.toFixed(1)}%`}
                hint={`${fmtMoney(Number(cot.total_venta) - Number(cot.total_costo))} de utilidad`}
              />
            </>
          )}
          <Stat label="Precio cliente" value={fmtMoney(cot.total_venta)} big />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-app-muted">
          {cot.secciones.length} secciones · {cot.secciones.reduce((a, s) => a + s.items.length, 0)} items
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, big, hint }: { label: string; value: string; big?: boolean; hint?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-app-muted font-semibold">{label}</div>
      <div className={big ? 'text-xl font-bold text-app' : 'text-base font-semibold text-app'}>
        {value}
      </div>
      {hint && <div className="text-[10px] text-app-muted">{hint}</div>}
    </div>
  )
}

