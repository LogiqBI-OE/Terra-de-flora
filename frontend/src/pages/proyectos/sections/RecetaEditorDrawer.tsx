// Editor visual de receta (Fase 2 — diseño tipo screenshot del usuario).
//
// Drawer ancho que abre desde una sección de la cotización. Muestra:
//   - Header con nombre + status + acciones
//   - N° de arreglos como multiplicador para preview de totales
//   - 4 KPI cards: materiales y paleta, costo unit, costo total interno, precio cliente
//   - Toolbar con Agregar / Importar / Exportar / Plantilla
//   - Tabla agrupada por grupo (FLORES, MATERIALES BASE, CONTENEDORES, ...)
//   - Cada fila: drag handle, color dot, autocomplete material, inputs costos
//
// Inputs costos (precio_paquete, contenido_por_paquete) editan el CATÁLOGO
// DE MATERIALES — fuente de verdad única. Inputs de la receta
// (cantidad/grupo/orden) se guardan al hacer Guardar.

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import Button from '../../../components/ui/Button'
import Drawer from '../../../components/ui/Drawer'
import { fmtMoney } from '../../../lib/format'
import {
  ApiError,
  materialesApi,
  recetasApi,
  type Material,
  type MaterialUpdatePayload,
  type Receta,
  type RecetaItem,
} from '../../../lib/api'

interface Props {
  recetaId: number | null     // null = crear nueva receta
  margenDefault: number        // viene de la cotización (e.g. 0.35)
  isFrozenContext: boolean     // si la cotización está congelada → read-only
  onClose: () => void
  onSaved: (receta: Receta) => void
}

// Estado local de items (sin id estable mientras no se guarden)
interface LocalItem {
  tempId: string                // estable durante el render
  itemId: number | null         // del backend si ya existe
  material_id: number
  cantidad: number
  grupo: string | null          // null = inferido de familia
  orden: number
  notas: string | null
}

// Color por defecto basado en hash del nombre del material (cuando no hay color_hex)
function hashColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i)
  const hue = Math.abs(h) % 360
  return `hsl(${hue}, 60%, 65%)`
}

function materialColor(m: Material | undefined): string {
  if (!m) return '#94A3B8'
  if (m.color_hex) return m.color_hex
  return hashColor(m.nombre)
}

// Grupos sugeridos para el dropdown
const GRUPOS_SUGERIDOS = [
  'FLORES',
  'MATERIALES BASE',
  'CONTENEDORES / BASES',
  'CONSUMIBLES',
  'OTROS',
]

function inferGrupoDesdeFamilia(familia: string): string {
  const f = familia.toLowerCase()
  if (f.includes('flor')) return 'FLORES'
  if (f.includes('vela')) return 'CONSUMIBLES'
  if (f.includes('mec')) return 'MATERIALES BASE'
  if (f.includes('base') || f.includes('contenedor') || f.includes('macet')) return 'CONTENEDORES / BASES'
  return 'OTROS'
}

export default function RecetaEditorDrawer({
  recetaId, margenDefault, isFrozenContext, onClose, onSaved,
}: Props) {
  const [allMateriales, setAllMateriales] = useState<Material[]>([])

  // Form local
  const [nombre, setNombre] = useState('')
  const [nArreglos, setNArreglos] = useState(1)
  const [items, setItems] = useState<LocalItem[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)
  const [pickerOpenAt, setPickerOpenAt] = useState<string | null>(null)

  const isReadOnly = isFrozenContext

  // Index materiales por id para lookup rápido (memoized)
  const matIndex = useMemo(() => {
    const m: Record<number, Material> = {}
    for (const x of allMateriales) m[x.id] = x
    return m
  }, [allMateriales])

  // Cargar receta y materiales
  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      recetaId ? recetasApi.get(recetaId) : Promise.resolve(null),
      materialesApi.list(),
    ])
      .then(([r, mats]) => {
        if (!alive) return
        setAllMateriales(mats.filter((m) => m.is_active))
        if (r) {
          setNombre(r.nombre)
          setNArreglos(r.n_arreglos_default || 1)
          setItems(r.items.map((it) => itemFromBackend(it)))
        } else {
          // Nueva receta
          setNombre('')
          setNArreglos(1)
          setItems([])
        }
        setDirty(false)
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error cargando'))
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [recetaId])

  // Agrupa items por grupo (efectivo: explícito o inferido)
  const grouped = useMemo(() => {
    const map: Record<string, LocalItem[]> = {}
    for (const it of items) {
      const mat = matIndex[it.material_id]
      const grupo = it.grupo ?? (mat ? inferGrupoDesdeFamilia(mat.familia) : 'OTROS')
      ;(map[grupo] ??= []).push(it)
    }
    // Ordena dentro de cada grupo por orden
    for (const g of Object.keys(map)) {
      map[g].sort((a, b) => a.orden - b.orden)
    }
    // Ordena grupos: los sugeridos en su orden, luego el resto alfabético
    const sortedKeys = Object.keys(map).sort((a, b) => {
      const ia = GRUPOS_SUGERIDOS.indexOf(a)
      const ib = GRUPOS_SUGERIDOS.indexOf(b)
      if (ia >= 0 && ib >= 0) return ia - ib
      if (ia >= 0) return -1
      if (ib >= 0) return 1
      return a.localeCompare(b)
    })
    return sortedKeys.map((k) => ({ grupo: k, items: map[k] }))
  }, [items, matIndex])

  // Cálculo de costos (memoized)
  const totals = useMemo(() => {
    let costoUnit = 0
    for (const it of items) {
      const m = matIndex[it.material_id]
      if (!m) continue
      const contenido = Number(m.contenido_por_paquete) || 1
      const precioUnit = contenido > 0 ? Number(m.precio_paquete) / contenido : 0
      costoUnit += precioUnit * it.cantidad
    }
    const costoTotal = costoUnit * nArreglos
    const precioCliente = costoTotal * (1 + margenDefault)
    return { costoUnit, costoTotal, precioCliente }
  }, [items, matIndex, nArreglos, margenDefault])

  // Materiales únicos para la paleta (colores)
  const palette = useMemo(() => {
    const set = new Set<number>()
    const arr: { id: number; color: string }[] = []
    for (const it of items) {
      if (set.has(it.material_id)) continue
      set.add(it.material_id)
      const m = matIndex[it.material_id]
      arr.push({ id: it.material_id, color: materialColor(m) })
    }
    return arr
  }, [items, matIndex])

  function toggleCollapse(grupo: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(grupo)) next.delete(grupo)
      else next.add(grupo)
      return next
    })
  }

  function addItem(materialId: number, grupo?: string) {
    const mat = matIndex[materialId]
    if (!mat) return
    const finalGrupo = grupo ?? inferGrupoDesdeFamilia(mat.familia)
    const maxOrden = items
      .filter((it) => (it.grupo ?? inferGrupoDesdeFamilia(matIndex[it.material_id]?.familia ?? '')) === finalGrupo)
      .reduce((m, x) => Math.max(m, x.orden), -1)
    setItems((prev) => [...prev, {
      tempId: `tmp-${Date.now()}-${Math.random()}`,
      itemId: null,
      material_id: materialId,
      cantidad: 1,
      grupo: grupo ?? null,
      orden: maxOrden + 1,
      notas: null,
    }])
    setDirty(true)
  }

  function updateItem(tempId: string, patch: Partial<LocalItem>) {
    setItems((prev) => prev.map((it) => it.tempId === tempId ? { ...it, ...patch } : it))
    setDirty(true)
  }

  function deleteItem(tempId: string) {
    setItems((prev) => prev.filter((it) => it.tempId !== tempId))
    setDirty(true)
  }

  function moveItem(tempId: string, direction: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.tempId === tempId)
      if (idx === -1) return prev
      const target = idx + direction
      if (target < 0 || target >= prev.length) return prev
      // Solo permite reordenar dentro del mismo grupo
      const a = prev[idx]
      const b = prev[target]
      const ga = a.grupo ?? inferGrupoDesdeFamilia(matIndex[a.material_id]?.familia ?? '')
      const gb = b.grupo ?? inferGrupoDesdeFamilia(matIndex[b.material_id]?.familia ?? '')
      if (ga !== gb) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      // Recalcula orden
      next[idx].orden = idx
      next[target].orden = target
      return next
    })
    setDirty(true)
  }

  // Edita el catálogo (precio_paquete o contenido_por_paquete)
  async function updateMaterial(materialId: number, patch: MaterialUpdatePayload) {
    try {
      const updated = await materialesApi.update(materialId, patch)
      setAllMateriales((prev) => prev.map((m) => m.id === materialId ? updated : m))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar el material')
    }
  }

  async function handleSave() {
    if (!nombre.trim()) {
      setError('Nombre de receta obligatorio')
      return
    }
    setSaving(true); setError(null)
    try {
      const payload = {
        nombre: nombre.trim(),
        n_arreglos_default: nArreglos,
        items: items.map((it) => ({
          material_id: it.material_id,
          cantidad: it.cantidad,
          grupo: it.grupo,
          orden: it.orden,
          notas: it.notas,
        })),
      }
      let saved: Receta
      if (recetaId) {
        saved = await recetasApi.update(recetaId, payload)
      } else {
        saved = await recetasApi.create({ ...payload, categoria: 'Mesa' })
      }
      onSaved(saved)
      onClose()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar')
    } finally { setSaving(false) }
  }

  function handleClose() {
    if (dirty && !confirm('Hay cambios sin guardar. ¿Cerrar de todos modos?')) return
    onClose()
  }

  return (
    <Drawer
      open
      onClose={handleClose}
      width={1100}
      title=""
      footer={(
        <>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>Cancelar</Button>
          {!isReadOnly && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar receta'}
            </Button>
          )}
        </>
      )}
    >
      {loading ? (
        <div className="py-12 text-center text-sm text-app-muted">Cargando…</div>
      ) : (
        <div className="space-y-4">
          {/* Header con nombre + estado */}
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={handleClose} className="text-app-muted hover:text-app text-sm">‹</button>
            <input
              type="text"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setDirty(true) }}
              placeholder="Nombre de receta…"
              disabled={isReadOnly}
              className="text-xl font-bold bg-transparent border-0 focus:outline-none text-app flex-1 min-w-0"
              style={{ color: 'var(--text-primary)' }}
            />
            <span
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide"
              style={{ background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' }}
            >
              {dirty ? 'Editando' : (recetaId ? 'Guardada' : 'Nueva')}
            </span>
          </div>

          {/* N° de arreglos */}
          <div className="flex items-center gap-3">
            <label className="text-[10px] uppercase tracking-widest text-app-muted font-semibold">
              N° de arreglos
            </label>
            <input
              type="number"
              min={1}
              value={nArreglos}
              onChange={(e) => { setNArreglos(Math.max(1, Number(e.target.value) || 1)); setDirty(true) }}
              disabled={isReadOnly}
              className="w-20 px-2 py-1 rounded-md border text-sm text-right"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
            <span className="text-xs text-app-muted">multiplica el costo total y los paquetes a comprar</span>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              label="Materiales y paleta"
              value={String(palette.length)}
              footer={(
                <div className="flex flex-wrap gap-1 mt-2">
                  {palette.slice(0, 12).map((p) => (
                    <span key={p.id} className="w-3 h-3 rounded-sm" style={{ background: p.color }} />
                  ))}
                  {palette.length > 12 && (
                    <span className="text-[10px] text-app-muted">+{palette.length - 12}</span>
                  )}
                </div>
              )}
            />
            <KpiCard label="Costo unitario" value={fmtMoney(totals.costoUnit)} />
            <KpiCard label="Costo total interno" value={fmtMoney(totals.costoTotal)} />
            <KpiCard
              label="Precio cliente"
              value={fmtMoney(totals.precioCliente)}
              accent
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isReadOnly && (
              <AgregarMaterialButton
                materiales={allMateriales}
                onSelect={(id) => addItem(id)}
              />
            )}
            <div className="flex-1" />
            <button
              disabled
              className="text-xs text-app-muted opacity-50 cursor-not-allowed flex items-center gap-1"
              title="Próximamente"
            >
              ↑ Importar
            </button>
            <button
              disabled
              className="text-xs text-app-muted opacity-50 cursor-not-allowed flex items-center gap-1"
              title="Próximamente"
            >
              ↓ Exportar
            </button>
            <button
              disabled
              className="text-xs text-app-muted opacity-50 cursor-not-allowed flex items-center gap-1"
              title="La receta ya queda guardada como plantilla automáticamente"
            >
              ⊟ Plantilla
            </button>
          </div>

          {error && (
            <div
              className="rounded-lg border px-3 py-2 text-xs"
              style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)', color: 'var(--danger)' }}
            >
              {error}
            </div>
          )}

          {/* Tabla */}
          {grouped.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed py-10 text-center"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="text-3xl mb-2 opacity-70">📋</div>
              <p className="text-sm text-app-secondary">
                Agrega tu primer insumo con el botón <strong>+ Agregar</strong>.
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl border overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              {/* Header de columnas */}
              <div
                className="grid grid-cols-12 gap-2 px-3 py-2 text-[9px] uppercase tracking-widest text-app-muted font-semibold border-b"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <div className="col-span-3">Producto</div>
                <div className="col-span-1 text-right">Costo paq</div>
                <div className="col-span-1 text-right">Pzas paq</div>
                <div className="col-span-1 text-right">$ Costo unit</div>
                <div className="col-span-1 text-right">Pza × arr</div>
                <div className="col-span-2 text-right">$ Costo arreglo</div>
                <div className="col-span-1 text-right">Paq total</div>
                <div className="col-span-1 text-right">$ Costo total</div>
                <div className="col-span-1"></div>
              </div>

              {/* Grupos */}
              {grouped.map(({ grupo, items: groupItems }) => {
                const isCollapsed = collapsed.has(grupo)
                const subtotalArreglo = groupItems.reduce((acc, it) => {
                  const m = matIndex[it.material_id]
                  if (!m) return acc
                  const cont = Number(m.contenido_por_paquete) || 1
                  const pu = cont > 0 ? Number(m.precio_paquete) / cont : 0
                  return acc + pu * it.cantidad
                }, 0)
                const subtotalTotal = subtotalArreglo * nArreglos

                return (
                  <div key={grupo}>
                    {/* Header de grupo */}
                    <div
                      className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider border-b cursor-pointer"
                      style={{
                        background: 'var(--bg-elevated)',
                        borderColor: 'var(--border-soft)',
                        color: 'var(--text-primary)',
                      }}
                      onClick={() => toggleCollapse(grupo)}
                    >
                      <div className="col-span-7">
                        <span className="mr-1 text-app-muted">{isCollapsed ? '▸' : '▾'}</span>
                        {grupo} · <span className="text-app-muted">{groupItems.length}</span>
                      </div>
                      <div className="col-span-2 text-right text-app-secondary">{fmtMoney(subtotalArreglo)}</div>
                      <div className="col-span-1"></div>
                      <div className="col-span-1 text-right text-app">{fmtMoney(subtotalTotal)}</div>
                      <div className="col-span-1"></div>
                    </div>

                    {/* Filas */}
                    {!isCollapsed && groupItems.map((it) => (
                      <ItemRow
                        key={it.tempId}
                        item={it}
                        mat={matIndex[it.material_id]}
                        allMateriales={allMateriales}
                        nArreglos={nArreglos}
                        isReadOnly={isReadOnly}
                        pickerOpen={pickerOpenAt === it.tempId}
                        onOpenPicker={(open) => setPickerOpenAt(open ? it.tempId : null)}
                        onUpdateItem={(patch) => updateItem(it.tempId, patch)}
                        onUpdateMaterial={(patch) => updateMaterial(it.material_id, patch)}
                        onSwitchMaterial={(newId) => updateItem(it.tempId, { material_id: newId })}
                        onDelete={() => deleteItem(it.tempId)}
                        onMove={(dir) => moveItem(it.tempId, dir)}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </Drawer>
  )
}

function itemFromBackend(it: RecetaItem): LocalItem {
  return {
    tempId: `srv-${it.id}`,
    itemId: it.id,
    material_id: it.material_id,
    cantidad: Number(it.cantidad),
    grupo: it.grupo,
    orden: it.orden,
    notas: it.notas,
  }
}

// ─── KPI card ────────────────────────────────────────────────────────────
function KpiCard({
  label, value, footer, accent,
}: { label: string; value: string; footer?: ReactNode; accent?: boolean }) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        background: accent ? 'var(--accent-bg-soft)' : 'var(--bg-card)',
        borderColor: accent ? 'var(--accent)' : 'var(--border)',
      }}
    >
      <div className="text-[9px] uppercase tracking-widest font-semibold flex items-center gap-1" style={{ color: accent ? 'var(--accent-text)' : 'var(--text-secondary)' }}>
        {label}
      </div>
      <div className="text-lg font-bold mt-1" style={{ color: accent ? 'var(--accent-text)' : 'var(--text-primary)' }}>
        {value}
      </div>
      {footer}
    </div>
  )
}

// ─── Botón Agregar con picker ────────────────────────────────────────────
function AgregarMaterialButton({
  materiales, onSelect,
}: { materiales: Material[]; onSelect: (id: number) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return materiales.slice(0, 30)
    return materiales.filter((m) =>
      m.nombre.toLowerCase().includes(q) || m.familia.toLowerCase().includes(q),
    ).slice(0, 30)
  }, [materiales, search])

  return (
    <div className="relative" ref={ref}>
      <Button onClick={() => setOpen((v) => !v)}>
        + Agregar
      </Button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-20 w-80 rounded-lg border shadow-xl"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'var(--border-soft)' }}>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar material…"
              className="w-full px-2 py-1.5 rounded-md border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-xs text-app-muted text-center">Sin resultados.</div>
            )}
            {filtered.map((m) => (
              <button
                key={m.id}
                onClick={() => { onSelect(m.id); setOpen(false); setSearch('') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/5 transition text-sm"
              >
                <span
                  className="w-4 h-4 rounded shrink-0"
                  style={{ background: materialColor(m) }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-app truncate">{m.nombre}</div>
                  <div className="text-[10px] text-app-muted">{m.familia} · {m.unidad}</div>
                </div>
                <span className="text-xs text-app-secondary">{fmtMoney(m.precio_paquete)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Fila de item ────────────────────────────────────────────────────────
interface ItemRowProps {
  item: LocalItem
  mat: Material | undefined
  allMateriales: Material[]
  nArreglos: number
  isReadOnly: boolean
  pickerOpen: boolean
  onOpenPicker: (open: boolean) => void
  onUpdateItem: (patch: Partial<LocalItem>) => void
  onUpdateMaterial: (patch: MaterialUpdatePayload) => void
  onSwitchMaterial: (newId: number) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
}

function ItemRow(p: ItemRowProps) {
  const { item, mat, allMateriales, nArreglos, isReadOnly, pickerOpen } = p

  // Inputs controlados locales (commit en onBlur)
  const [precioPaq, setPrecioPaq] = useState(mat ? String(mat.precio_paquete) : '')
  const [pzasPaq, setPzasPaq] = useState(mat ? String(mat.contenido_por_paquete) : '')
  const [pzaArr, setPzaArr] = useState(String(item.cantidad))

  useEffect(() => { setPrecioPaq(mat ? String(mat.precio_paquete) : '') }, [mat?.precio_paquete])
  useEffect(() => { setPzasPaq(mat ? String(mat.contenido_por_paquete) : '') }, [mat?.contenido_por_paquete])
  useEffect(() => { setPzaArr(String(item.cantidad)) }, [item.cantidad])

  const contenido = mat ? Number(mat.contenido_por_paquete) || 1 : 1
  const precioPaqN = mat ? Number(mat.precio_paquete) : 0
  const costoUnit = contenido > 0 ? precioPaqN / contenido : 0
  const costoArreglo = costoUnit * item.cantidad
  const pzasTotales = item.cantidad * nArreglos
  const paqTotal = contenido > 0 ? Math.ceil(pzasTotales / contenido) : 0
  const costoTotal = paqTotal * precioPaqN

  const cellStyle: CSSProperties = {
    background: 'var(--bg-input)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  }

  return (
    <div
      className="grid grid-cols-12 gap-2 px-3 py-2 items-center border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      {/* Drag handle + color + autocomplete */}
      <div className="col-span-3 flex items-center gap-2 min-w-0">
        {!isReadOnly && (
          <div className="flex flex-col">
            <button
              onClick={() => p.onMove(-1)}
              title="Subir"
              className="text-app-muted hover:text-app text-[10px] leading-none"
            >▲</button>
            <button
              onClick={() => p.onMove(1)}
              title="Bajar"
              className="text-app-muted hover:text-app text-[10px] leading-none"
            >▼</button>
          </div>
        )}
        <span
          className="w-6 h-6 rounded shrink-0"
          style={{ background: materialColor(mat) }}
        />
        <div className="min-w-0 flex-1 relative">
          <button
            onClick={() => !isReadOnly && p.onOpenPicker(!pickerOpen)}
            className="w-full text-left text-sm font-semibold text-app truncate hover:underline disabled:no-underline"
            disabled={isReadOnly}
          >
            🔎 {mat?.nombre ?? '(material no encontrado)'}
          </button>
          <div className="text-[10px] text-app-muted truncate">
            {mat?.proveedor_nombre ?? 'Sin proveedor'} · {mat?.unidad ?? '—'}
          </div>
          {pickerOpen && !isReadOnly && (
            <MaterialPicker
              materiales={allMateriales}
              onSelect={(id) => { p.onSwitchMaterial(id); p.onOpenPicker(false) }}
              onClose={() => p.onOpenPicker(false)}
            />
          )}
        </div>
      </div>

      {/* COSTO PAQ (edita catálogo) */}
      <div className="col-span-1">
        <input
          type="number"
          step="0.01"
          value={precioPaq}
          onChange={(e) => setPrecioPaq(e.target.value)}
          onBlur={() => {
            const n = Number(precioPaq)
            if (Number.isFinite(n) && mat && n !== Number(mat.precio_paquete)) {
              p.onUpdateMaterial({ precio_paquete: n })
            }
          }}
          disabled={isReadOnly}
          className="w-full px-1.5 py-1 rounded-md border text-xs text-right"
          style={cellStyle}
          title="Edita el catálogo de materiales"
        />
      </div>

      {/* PZAS PAQ (edita catálogo) */}
      <div className="col-span-1">
        <input
          type="number"
          step="0.01"
          value={pzasPaq}
          onChange={(e) => setPzasPaq(e.target.value)}
          onBlur={() => {
            const n = Number(pzasPaq)
            if (Number.isFinite(n) && mat && n !== Number(mat.contenido_por_paquete)) {
              p.onUpdateMaterial({ contenido_por_paquete: n })
            }
          }}
          disabled={isReadOnly}
          className="w-full px-1.5 py-1 rounded-md border text-xs text-right"
          style={cellStyle}
          title="Edita el catálogo de materiales"
        />
      </div>

      {/* $ Costo unit (read-only, calculado) */}
      <div className="col-span-1 text-right text-xs text-app">{fmtMoney(costoUnit)}</div>

      {/* PZA × ARREGLO (edita item de receta) */}
      <div className="col-span-1">
        <input
          type="number"
          step="0.01"
          value={pzaArr}
          onChange={(e) => setPzaArr(e.target.value)}
          onBlur={() => {
            const n = Number(pzaArr)
            if (Number.isFinite(n) && n !== item.cantidad) p.onUpdateItem({ cantidad: n })
          }}
          disabled={isReadOnly}
          className="w-full px-1.5 py-1 rounded-md border text-xs text-right"
          style={cellStyle}
        />
      </div>

      {/* $ Costo arreglo (calculado) */}
      <div className="col-span-2 text-right text-xs text-app font-semibold">{fmtMoney(costoArreglo)}</div>

      {/* Paq total (calculado) */}
      <div className="col-span-1 text-right text-xs text-app">{paqTotal}</div>

      {/* $ Costo total (calculado) */}
      <div className="col-span-1 text-right text-xs text-app font-bold">{fmtMoney(costoTotal)}</div>

      {/* Acción borrar */}
      <div className="col-span-1 text-right">
        {!isReadOnly && (
          <button
            onClick={p.onDelete}
            className="text-app-muted hover:text-red-500 text-xs"
            title="Quitar"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Picker de material para cambiar el material de una fila ─────────────
function MaterialPicker({
  materiales, onSelect, onClose,
}: { materiales: Material[]; onSelect: (id: number) => void; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return materiales.slice(0, 20)
    return materiales.filter((m) =>
      m.nombre.toLowerCase().includes(q) || m.familia.toLowerCase().includes(q),
    ).slice(0, 20)
  }, [materiales, search])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-30 w-72 rounded-lg border shadow-xl"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="p-2 border-b" style={{ borderColor: 'var(--border-soft)' }}>
        <input
          autoFocus
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar…"
          className="w-full px-2 py-1.5 rounded-md border text-xs"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        />
      </div>
      <div className="max-h-56 overflow-y-auto">
        {filtered.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-black/5 text-xs"
          >
            <span className="w-3 h-3 rounded shrink-0" style={{ background: materialColor(m) }} />
            <div className="flex-1 min-w-0">
              <div className="text-app font-semibold truncate">{m.nombre}</div>
              <div className="text-[10px] text-app-muted">{m.familia} · {m.unidad}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
