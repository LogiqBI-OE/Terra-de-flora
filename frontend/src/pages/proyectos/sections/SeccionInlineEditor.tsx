// Editor inline de una sección de cotización.
// Reemplaza al RecetaEditorDrawer: la sección ES el editor.
//
// Layout (tipo el screenshot del usuario):
//   Header: nombre editable + N° arreglos + delete sección
//   4 KPI cards: materiales+paleta · costo unit · costo total interno · precio cliente
//   Tabla agrupada por grupo (FLORES / MATERIALES BASE / CONTENEDORES / ...)
//   Cada fila: ▲▼ + color + material + COSTO PAQ + PZAS PAQ + $UNIT + PZA/ARR + $ARR + PAQ TOT + $TOT + ✕
//   + Agregar material (con quick-create inline)
//
// Todos los cambios se guardan en backend al onBlur. No hay botón "Guardar".

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Button from '../../../components/ui/Button'
import { fmtMoney } from '../../../lib/format'
import {
  ApiError,
  cotizacionesApi,
  materialesApi,
  type CotizacionItem,
  type CotizacionSeccion,
  type Material,
  type MaterialUpdatePayload,
} from '../../../lib/api'
import MaterialQuickCreateModal from './MaterialQuickCreateModal'

interface Props {
  seccion: CotizacionSeccion
  isFrozen: boolean
  onChange: () => void  // refresca la cotización en el padre
  onDelete: () => void
  onRename: (nombre: string) => void
}

// Color por defecto basado en hash del nombre
function hashColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i)
  const hue = Math.abs(h) % 360
  return `hsl(${hue}, 60%, 65%)`
}

function colorForItem(it: CotizacionItem): string {
  if (it.material_color_hex) return it.material_color_hex
  return hashColor(it.nombre || 'x')
}

const GRUPOS_ORDEN = ['FLORES', 'MATERIALES BASE', 'CONTENEDORES / BASES', 'CONSUMIBLES', 'OTROS']

export default function SeccionInlineEditor({
  seccion, isFrozen, onChange, onDelete, onRename,
}: Props) {
  const [allMateriales, setAllMateriales] = useState<Material[]>([])
  const [nameEdit, setNameEdit] = useState(false)
  const [nameDraft, setNameDraft] = useState(seccion.nombre)
  const [nArrDraft, setNArrDraft] = useState(String(seccion.n_arreglos))
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setNameDraft(seccion.nombre) }, [seccion.id, seccion.nombre])
  useEffect(() => { setNArrDraft(String(seccion.n_arreglos)) }, [seccion.id, seccion.n_arreglos])

  // Cargar materiales solo una vez por session (sirve a todos los componentes)
  useEffect(() => {
    materialesApi.list()
      .then((mats) => setAllMateriales(mats.filter((m) => m.is_active)))
      .catch(() => {})
  }, [])

  // Agrupa items por grupo_efectivo
  const grouped = useMemo(() => {
    const map: Record<string, CotizacionItem[]> = {}
    for (const it of seccion.items) {
      const g = it.grupo_efectivo || 'OTROS'
      ;(map[g] ??= []).push(it)
    }
    for (const g of Object.keys(map)) {
      map[g].sort((a, b) => a.orden - b.orden)
    }
    const keys = Object.keys(map).sort((a, b) => {
      const ia = GRUPOS_ORDEN.findIndex((g) => g.toUpperCase() === a.toUpperCase())
      const ib = GRUPOS_ORDEN.findIndex((g) => g.toUpperCase() === b.toUpperCase())
      if (ia >= 0 && ib >= 0) return ia - ib
      if (ia >= 0) return -1
      if (ib >= 0) return 1
      return a.localeCompare(b)
    })
    return keys.map((k) => ({ grupo: k, items: map[k] }))
  }, [seccion.items])

  // Paleta única de materiales
  const palette = useMemo(() => {
    const seen = new Set<number>()
    const out: { id: number; color: string }[] = []
    for (const it of seccion.items) {
      const id = it.material_id ?? -it.id  // si no es material, usa item id negativo
      if (seen.has(id)) continue
      seen.add(id)
      out.push({ id, color: colorForItem(it) })
    }
    return out
  }, [seccion.items])

  const totalCosto = Number(seccion.subtotal_costo) || 0
  const totalVenta = Number(seccion.subtotal_venta) || 0
  const nArrN = Math.max(1, seccion.n_arreglos || 1)
  const costoUnitario = totalCosto / nArrN

  function toggleCollapse(grupo: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(grupo)) next.delete(grupo)
      else next.add(grupo)
      return next
    })
  }

  async function commitName() {
    setNameEdit(false)
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== seccion.nombre) onRename(trimmed)
    else setNameDraft(seccion.nombre)
  }

  async function commitNArreglos() {
    const n = Math.max(1, parseInt(nArrDraft, 10) || 1)
    if (n === seccion.n_arreglos) return
    try {
      await cotizacionesApi.updateSeccion(seccion.id, { n_arreglos: n })
      onChange()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error')
    }
  }

  async function handleAddMaterial(materialId: number) {
    const mat = allMateriales.find((m) => m.id === materialId)
    try {
      await cotizacionesApi.createItem(seccion.id, {
        material_id: materialId,
        cantidad: 1,
        grupo: mat ? inferGrupoDesdeFamilia(mat.familia) : null,
        orden: seccion.items.length,
      })
      onChange()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo agregar')
    }
  }

  async function handleUpdateItem(iid: number, patch: { cantidad?: number; grupo?: string | null; precio_venta_unit?: number | null; orden?: number }) {
    try {
      await cotizacionesApi.updateItem(iid, patch)
      onChange()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error')
    }
  }

  async function handleDeleteItem(iid: number) {
    try {
      await cotizacionesApi.deleteItem(iid)
      onChange()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error')
    }
  }

  async function handleUpdateMaterial(materialId: number, patch: MaterialUpdatePayload) {
    try {
      const updated = await materialesApi.update(materialId, patch)
      setAllMateriales((prev) => prev.map((m) => m.id === materialId ? updated : m))
      onChange()  // los costos recalculados llegan al refrescar la cotización
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar el material')
    }
  }

  async function handleMove(iid: number, dir: -1 | 1) {
    // Reordenamiento simple: cambiamos orden y dejamos que backend lo persista.
    const flat = [...seccion.items].sort((a, b) => a.orden - b.orden)
    const idx = flat.findIndex((x) => x.id === iid)
    if (idx === -1) return
    const target = idx + dir
    if (target < 0 || target >= flat.length) return
    const a = flat[idx]
    const b = flat[target]
    if (a.grupo_efectivo !== b.grupo_efectivo) return
    try {
      await Promise.all([
        cotizacionesApi.updateItem(a.id, { orden: b.orden }),
        cotizacionesApi.updateItem(b.id, { orden: a.orden }),
      ])
      onChange()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error reordenando')
    }
  }

  return (
    <div
      className="rounded-2xl border"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b flex-wrap"
        style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-elevated)' }}
      >
        {nameEdit ? (
          <input
            autoFocus
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') { setNameDraft(seccion.nombre); setNameEdit(false) }
            }}
            className="text-lg font-bold px-2 py-1 rounded-md border"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--accent)', color: 'var(--text-primary)' }}
          />
        ) : (
          <button
            onClick={() => !isFrozen && setNameEdit(true)}
            disabled={isFrozen}
            className="text-lg font-bold text-app hover:underline disabled:no-underline"
          >
            {seccion.nombre}
          </button>
        )}

        <div className="flex items-center gap-1.5 ml-4">
          <span className="text-[10px] uppercase tracking-widest text-app-muted font-semibold">N° arreglos</span>
          <input
            type="number"
            min={1}
            value={nArrDraft}
            onChange={(e) => setNArrDraft(e.target.value)}
            onBlur={commitNArreglos}
            disabled={isFrozen}
            className="w-16 px-2 py-1 rounded-md border text-sm text-right"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="flex-1" />

        {!isFrozen && (
          <button
            onClick={onDelete}
            className="text-app-muted hover:text-red-500 transition text-sm"
            title="Borrar sección"
          >
            🗑️
          </button>
        )}
      </div>

      {/* KPI cards */}
      <div className="px-5 pt-4 grid grid-cols-4 gap-3">
        <Kpi
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
        <Kpi label="Costo unitario" value={fmtMoney(costoUnitario)} />
        <Kpi label="Costo total interno" value={fmtMoney(totalCosto)} />
        <Kpi label="Precio cliente" value={fmtMoney(totalVenta)} accent />
      </div>

      {/* Toolbar agregar */}
      <div className="px-5 pt-4 flex items-center gap-2 flex-wrap">
        {!isFrozen && (
          <AgregarMaterialButton
            materiales={allMateriales}
            onSelect={handleAddMaterial}
            onCreated={(m) => setAllMateriales((prev) => [m, ...prev])}
          />
        )}
        {error && (
          <span className="text-xs ml-auto" style={{ color: 'var(--danger)' }}>{error}</span>
        )}
      </div>

      {/* Tabla */}
      <div className="px-5 pb-5 pt-3">
        {grouped.length === 0 ? (
          <div
            className="rounded-xl border border-dashed py-10 text-center"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="text-3xl mb-2 opacity-70">📋</div>
            <p className="text-sm text-app-secondary">
              Agrega tu primer material con el botón <strong>+ Agregar</strong>.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}
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

            {grouped.map(({ grupo, items }) => {
              const isCollapsed = collapsed.has(grupo)
              const subUnit = items.reduce((acc, it) => acc + (Number(it.subtotal_costo) || 0) / nArrN, 0)
              const subTotal = items.reduce((acc, it) => acc + (Number(it.subtotal_costo) || 0), 0)

              return (
                <div key={grupo}>
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
                      {grupo} · <span className="text-app-muted">{items.length}</span>
                    </div>
                    <div className="col-span-2 text-right text-app-secondary">{fmtMoney(subUnit)}</div>
                    <div className="col-span-1"></div>
                    <div className="col-span-1 text-right text-app">{fmtMoney(subTotal)}</div>
                    <div className="col-span-1"></div>
                  </div>

                  {!isCollapsed && items.map((it) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      allMateriales={allMateriales}
                      nArreglos={nArrN}
                      isReadOnly={isFrozen}
                      onUpdateItem={(patch) => handleUpdateItem(it.id, patch)}
                      onUpdateMaterial={(patch) => it.material_id && handleUpdateMaterial(it.material_id, patch)}
                      onDelete={() => handleDeleteItem(it.id)}
                      onMove={(dir) => handleMove(it.id, dir)}
                      onMaterialCreated={(m) => setAllMateriales((prev) => [m, ...prev])}
                      onSwitchMaterial={(newId) => handleUpdateItem(it.id, { grupo: null }).then(() => cotizacionesApi.updateItem(it.id, { material_id: newId }).then(() => onChange()))}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function inferGrupoDesdeFamilia(familia: string): string {
  const f = (familia || '').toLowerCase()
  if (f.includes('flor')) return 'FLORES'
  if (f.includes('vela')) return 'CONSUMIBLES'
  if (f.includes('mec')) return 'MATERIALES BASE'
  if (f.includes('base') || f.includes('contenedor') || f.includes('macet')) return 'CONTENEDORES / BASES'
  return 'OTROS'
}

// ─── KPI ─────────────────────────────────────────────────────────────────
function Kpi({ label, value, footer, accent }: {
  label: string
  value: string
  footer?: React.ReactNode
  accent?: boolean
}) {
  return (
    <div
      className="rounded-xl border p-3"
      style={{
        background: accent ? 'var(--accent-bg-soft)' : 'var(--bg-card)',
        borderColor: accent ? 'var(--accent)' : 'var(--border)',
      }}
    >
      <div className="text-[9px] uppercase tracking-widest font-semibold"
        style={{ color: accent ? 'var(--accent-text)' : 'var(--text-secondary)' }}>
        {label}
      </div>
      <div className="text-lg font-bold mt-1" style={{ color: accent ? 'var(--accent-text)' : 'var(--text-primary)' }}>
        {value}
      </div>
      {footer}
    </div>
  )
}

// ─── Agregar material (dropdown con quick-create) ────────────────────────
function AgregarMaterialButton({
  materiales, onSelect, onCreated,
}: { materiales: Material[]; onSelect: (id: number) => void; onCreated: (m: Material) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open || createOpen) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open, createOpen])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return materiales.slice(0, 30)
    return materiales.filter((m) =>
      m.nombre.toLowerCase().includes(q) || m.familia.toLowerCase().includes(q),
    ).slice(0, 30)
  }, [materiales, search])

  return (
    <>
      <div className="relative" ref={ref}>
        <Button onClick={() => setOpen((v) => !v)}>+ Agregar</Button>
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
              {filtered.map((m) => {
                const c = m.color_hex || hashColor(m.nombre)
                return (
                  <button
                    key={m.id}
                    onClick={() => { onSelect(m.id); setOpen(false); setSearch('') }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/5 transition text-sm"
                  >
                    <span className="w-4 h-4 rounded shrink-0" style={{ background: c }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-app truncate">{m.nombre}</div>
                      <div className="text-[10px] text-app-muted">{m.familia} · {m.unidad}</div>
                    </div>
                    <span className="text-xs text-app-secondary">{fmtMoney(m.precio_paquete)}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => { setCreateOpen(true); setOpen(false) }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border-t text-xs font-semibold transition"
              style={{
                borderColor: 'var(--border-soft)',
                background: 'var(--accent-bg-soft)',
                color: 'var(--accent-text)',
              }}
            >
              ＋ Crear material nuevo{search ? ` "${search}"` : ''}
            </button>
          </div>
        )}
      </div>

      {createOpen && (
        <MaterialQuickCreateModal
          initialNombre={search}
          onClose={() => { setCreateOpen(false); setSearch('') }}
          onCreated={(m) => { onCreated(m); onSelect(m.id) }}
        />
      )}
    </>
  )
}

// ─── Fila de item ────────────────────────────────────────────────────────
interface ItemRowProps {
  item: CotizacionItem
  allMateriales: Material[]
  nArreglos: number
  isReadOnly: boolean
  onUpdateItem: (patch: { cantidad?: number; precio_venta_unit?: number | null }) => void
  onUpdateMaterial: (patch: MaterialUpdatePayload) => void
  onSwitchMaterial: (newId: number) => void
  onMaterialCreated: (m: Material) => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
}

function ItemRow(p: ItemRowProps) {
  const { item, allMateriales, nArreglos, isReadOnly } = p
  const [precioPaq, setPrecioPaq] = useState(String(item.material_precio_paquete ?? ''))
  const [pzasPaq, setPzasPaq] = useState(String(item.material_contenido_por_paquete ?? ''))
  const [pzaArr, setPzaArr] = useState(String(item.cantidad))
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => { setPrecioPaq(String(item.material_precio_paquete ?? '')) }, [item.material_precio_paquete])
  useEffect(() => { setPzasPaq(String(item.material_contenido_por_paquete ?? '')) }, [item.material_contenido_por_paquete])
  useEffect(() => { setPzaArr(String(item.cantidad)) }, [item.cantidad])

  const contenido = Number(item.material_contenido_por_paquete) || 1
  const precioPaqN = Number(item.material_precio_paquete) || 0
  const costoUnit = contenido > 0 ? precioPaqN / contenido : 0
  const costoArreglo = costoUnit * Number(item.cantidad)
  const pzasTotales = Number(item.cantidad) * nArreglos
  const paqTotal = contenido > 0 ? Math.ceil(pzasTotales / contenido) : 0
  const costoTotal = paqTotal * precioPaqN

  const cellStyle: CSSProperties = {
    background: 'var(--bg-input)',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
  }

  const isMaterial = item.material_id !== null

  return (
    <div
      className="grid grid-cols-12 gap-2 px-3 py-2 items-center border-b"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div className="col-span-3 flex items-center gap-2 min-w-0">
        {!isReadOnly && (
          <div className="flex flex-col">
            <button onClick={() => p.onMove(-1)} title="Subir" className="text-app-muted hover:text-app text-[10px] leading-none">▲</button>
            <button onClick={() => p.onMove(1)} title="Bajar" className="text-app-muted hover:text-app text-[10px] leading-none">▼</button>
          </div>
        )}
        <span className="w-6 h-6 rounded shrink-0" style={{ background: colorForItem(item) }} />
        <div className="min-w-0 flex-1 relative">
          <button
            onClick={() => !isReadOnly && isMaterial && setPickerOpen(!pickerOpen)}
            className="w-full text-left text-sm font-semibold text-app truncate hover:underline disabled:no-underline"
            disabled={isReadOnly || !isMaterial}
          >
            {isMaterial ? '🔎 ' : ''}{item.nombre}
          </button>
          <div className="text-[10px] text-app-muted truncate">
            {item.material_proveedor_nombre ?? 'Sin proveedor'} · {item.material_unidad ?? '—'}
          </div>
          {pickerOpen && !isReadOnly && (
            <MaterialPicker
              materiales={allMateriales}
              onSelect={(id) => { p.onSwitchMaterial(id); setPickerOpen(false) }}
              onClose={() => setPickerOpen(false)}
              onCreated={p.onMaterialCreated}
            />
          )}
        </div>
      </div>

      <div className="col-span-1">
        <input
          type="number"
          step="0.01"
          value={precioPaq}
          onChange={(e) => setPrecioPaq(e.target.value)}
          onBlur={() => {
            const n = Number(precioPaq)
            if (Number.isFinite(n) && isMaterial && n !== Number(item.material_precio_paquete)) {
              p.onUpdateMaterial({ precio_paquete: n })
            }
          }}
          disabled={isReadOnly || !isMaterial}
          className="w-full px-1.5 py-1 rounded-md border text-xs text-right"
          style={cellStyle}
          title={isMaterial ? 'Edita el catálogo de materiales' : ''}
        />
      </div>

      <div className="col-span-1">
        <input
          type="number"
          step="0.01"
          value={pzasPaq}
          onChange={(e) => setPzasPaq(e.target.value)}
          onBlur={() => {
            const n = Number(pzasPaq)
            if (Number.isFinite(n) && isMaterial && n !== Number(item.material_contenido_por_paquete)) {
              p.onUpdateMaterial({ contenido_por_paquete: n })
            }
          }}
          disabled={isReadOnly || !isMaterial}
          className="w-full px-1.5 py-1 rounded-md border text-xs text-right"
          style={cellStyle}
          title={isMaterial ? 'Edita el catálogo de materiales' : ''}
        />
      </div>

      <div className="col-span-1 text-right text-xs text-app">{fmtMoney(costoUnit)}</div>

      <div className="col-span-1">
        <input
          type="number"
          step="0.01"
          value={pzaArr}
          onChange={(e) => setPzaArr(e.target.value)}
          onBlur={() => {
            const n = Number(pzaArr)
            if (Number.isFinite(n) && n !== Number(item.cantidad)) p.onUpdateItem({ cantidad: n })
          }}
          disabled={isReadOnly}
          className="w-full px-1.5 py-1 rounded-md border text-xs text-right"
          style={cellStyle}
        />
      </div>

      <div className="col-span-2 text-right text-xs text-app font-semibold">{fmtMoney(costoArreglo)}</div>
      <div className="col-span-1 text-right text-xs text-app">{paqTotal}</div>
      <div className="col-span-1 text-right text-xs text-app font-bold">{fmtMoney(costoTotal)}</div>

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

// ─── Picker para cambiar material de una fila ────────────────────────────
function MaterialPicker({
  materiales, onSelect, onClose, onCreated,
}: {
  materiales: Material[]
  onSelect: (id: number) => void
  onClose: () => void
  onCreated: (m: Material) => void
}) {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (createOpen) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, createOpen])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return materiales.slice(0, 20)
    return materiales.filter((m) =>
      m.nombre.toLowerCase().includes(q) || m.familia.toLowerCase().includes(q),
    ).slice(0, 20)
  }, [materiales, search])

  return (
    <>
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
          {filtered.length === 0 && (
            <div className="px-3 py-3 text-xs text-app-muted text-center">Sin resultados.</div>
          )}
          {filtered.map((m) => {
            const c = m.color_hex || hashColor(m.nombre)
            return (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-black/5 text-xs"
              >
                <span className="w-3 h-3 rounded shrink-0" style={{ background: c }} />
                <div className="flex-1 min-w-0">
                  <div className="text-app font-semibold truncate">{m.nombre}</div>
                  <div className="text-[10px] text-app-muted">{m.familia} · {m.unidad}</div>
                </div>
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 border-t text-[11px] font-semibold transition"
          style={{
            borderColor: 'var(--border-soft)',
            background: 'var(--accent-bg-soft)',
            color: 'var(--accent-text)',
          }}
        >
          ＋ Crear material{search ? ` "${search}"` : ''}
        </button>
      </div>

      {createOpen && (
        <MaterialQuickCreateModal
          initialNombre={search}
          onClose={() => setCreateOpen(false)}
          onCreated={(m) => { onCreated(m); onSelect(m.id); setCreateOpen(false) }}
        />
      )}
    </>
  )
}
