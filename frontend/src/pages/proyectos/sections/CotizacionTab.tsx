// Tab Cotizacion — layout: sidebar de versiones + vistas como pills.
//
// Vistas (pills):
//   Resumen     — vista cliente (Web/PDF toggle)
//   Consolidado — tabla plana de todos los items de todas las secciones
//   <sección>   — una pill por cada sección, dentro editas items/recetas
//   +           — pill final para agregar sección nueva

import { useEffect, useMemo, useState } from 'react'
import Button from '../../../components/ui/Button'
import { fmtMoney } from '../../../lib/format'
import SeccionInlineEditor from './SeccionInlineEditor'
import {
  ApiError,
  cotizacionesApi,
  type Cotizacion,
  type CotizacionCatalog,
  type CotizacionSummary,
  type DesviacionResumen,
  type EstadoCotizacion,
  type ProyectoRow,
} from '../../../lib/api'

interface Props {
  proyecto: ProyectoRow
}

const ESTADO_META: Record<EstadoCotizacion, { label: string; bg: string; text: string }> = {
  borrador:  { label: 'Borrador',  bg: 'rgba(148, 163, 184, 0.20)', text: '#475569' },
  enviada:   { label: 'Enviada',   bg: 'rgba(14, 165, 233, 0.20)',  text: '#0284C7' },
  aprobada:  { label: 'Aprobada',  bg: 'rgba(16, 185, 129, 0.20)',  text: '#059669' },
  rechazada: { label: 'Rechazada', bg: 'rgba(244, 63, 94, 0.20)',   text: '#E11D48' },
}

// La vista activa: vistas fijas o el id (numérico) de una sección custom.
type View = 'resumen' | 'instalacion' | 'consolidado' | { kind: 'seccion'; id: number } | 'agregar'

function viewKey(v: View): string {
  if (typeof v === 'string') return v
  return `s-${v.id}`
}

export default function CotizacionTab({ proyecto }: Props) {
  const [versiones, setVersiones] = useState<CotizacionSummary[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [cot, setCot] = useState<Cotizacion | null>(null)
  const [catalog, setCatalog] = useState<CotizacionCatalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('resumen')
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
    ])
      .then(async ([list, cat]) => {
        if (!alive) return
        setVersiones(list)
        setCatalog(cat)
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
      setView('resumen')
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
      setView('resumen')
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
      const s = await cotizacionesApi.createSeccion(cot.id, {
        nombre,
        orden: cot.secciones.length,
      })
      await reloadActive(cot.id)
      setView({ kind: 'seccion', id: s.id })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al agregar sección')
    }
  }

  async function handleRenameSeccion(sid: number, nombre: string) {
    if (!cot) return
    try {
      await cotizacionesApi.updateSeccion(sid, { nombre })
      await reloadActive(cot.id)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error')
    }
  }

  async function handleDeleteSeccion(sid: number) {
    if (!cot) return
    if (!confirm('¿Borrar esta sección y todos sus items?')) return
    try {
      await cotizacionesApi.deleteSeccion(sid)
      await reloadActive(cot.id)
      setView('resumen')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error')
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-app-muted">Cargando cotización…</div>
  }

  // Estado vacío: sin versiones todavía
  if (versiones.length === 0 || !cot) {
    return (
      <div className="py-16 text-center">
        <div className="text-5xl mb-3 opacity-70">🧾</div>
        <h3 className="text-lg font-bold text-app mb-1">Sin cotización todavía</h3>
        <p className="text-sm text-app-secondary max-w-md mx-auto mb-5">
          Crea la primera versión para empezar a cotizar arreglos y logística.
        </p>
        <Button onClick={handleCreateFirst} disabled={busy}>
          {busy ? 'Creando…' : '+ Crear versión 1'}
        </Button>
        {error && <div className="mt-4 text-xs" style={{ color: 'var(--danger)' }}>{error}</div>}
      </div>
    )
  }

  const activeSeccion =
    typeof view === 'object' && view.kind === 'seccion'
      ? cot.secciones.find((s) => s.id === view.id) ?? null
      : null

  return (
    <div className="grid grid-cols-12 gap-4 min-h-[600px]">
      {/* ── Sidebar versiones (col 1) ───────────────────────────────── */}
      <aside className="col-span-12 md:col-span-3 lg:col-span-3">
        <div
          className="rounded-2xl border p-3 space-y-2 sticky top-4"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between px-1 pb-1">
            <div className="text-[10px] uppercase tracking-widest text-app-muted font-semibold">
              Versiones <span className="opacity-70">({versiones.length})</span>
            </div>
          </div>

          <button
            onClick={handleDuplicate}
            disabled={busy}
            className="w-full px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
          >
            + Nueva versión (duplicar)
          </button>

          <div className="space-y-2 pt-1">
            {versiones.map((v) => (
              <VersionCard
                key={v.id}
                summary={v}
                active={v.id === activeId}
                onClick={() => setActiveId(v.id)}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* ── Contenido (col 2) ───────────────────────────────────────── */}
      <main className="col-span-12 md:col-span-9 lg:col-span-9 space-y-4">
        {/* Pills de vistas: fijas (Resumen · Instalación · Consolidado) + custom */}
        <div className="flex items-center gap-2 flex-wrap">
          <Pill
            label="📄 Resumen"
            active={view === 'resumen'}
            onClick={() => setView('resumen')}
          />
          <Pill
            label="🚚 Instalación"
            active={view === 'instalacion'}
            onClick={() => setView('instalacion')}
          />
          <Pill
            label="📦 Consolidado"
            active={view === 'consolidado'}
            onClick={() => setView('consolidado')}
          />
          {/* Separador visual */}
          <span className="text-app-muted text-xs select-none">·</span>
          {cot.secciones.map((s) => (
            <Pill
              key={s.id}
              label={s.nombre}
              count={s.items.length}
              active={typeof view === 'object' && view.kind === 'seccion' && view.id === s.id}
              onClick={() => setView({ kind: 'seccion', id: s.id })}
            />
          ))}
          {!isFrozen && (
            <Pill
              label="+"
              dashed
              active={view === 'agregar'}
              onClick={() => setView('agregar')}
            />
          )}
        </div>

        {/* Banda de control de la versión (estado, margen, costo toggle) */}
        <div
          className="flex items-center gap-3 flex-wrap rounded-xl border p-3"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-app-muted font-semibold">Estado</span>
            <select
              value={cot.estado}
              onChange={(e) => handleChangeEstado(e.target.value as EstadoCotizacion)}
              disabled={busy}
              className="px-2 py-1 rounded-md border text-xs"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
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
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
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

          <label className="text-xs text-app-secondary inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={showCosts}
              onChange={(e) => setShowCosts(e.target.checked)}
            />
            Mostrar costo interno
          </label>
        </div>

        {isFrozen && (
          <div
            className="rounded-xl border px-4 py-3 text-xs flex items-start gap-2"
            style={{
              background: 'rgba(245, 158, 11, 0.10)',
              borderColor: 'rgba(245, 158, 11, 0.40)',
              color: '#92400E',
            }}
          >
            <span className="text-base">🔒</span>
            <div className="flex-1">
              <strong>Esta versión está congelada.</strong>{' '}
              Los costos quedaron snapshot cuando se envió/aprobó. Para modificar
              los costos reales, edita los materiales en el{' '}
              <a href="/materiales" className="underline font-semibold">catálogo de materiales</a>
              {' '}— el cambio NO afecta esta versión, solo las futuras. Si quieres
              re-cotizar con precios nuevos, usa <strong>"+ Nueva versión (duplicar)"</strong>{' '}
              en el sidebar.
            </div>
          </div>
        )}

        {error && (
          <div
            className="rounded-lg border px-4 py-2 text-sm"
            style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)', color: 'var(--danger)' }}
          >
            {error}
          </div>
        )}

        {/* ── Contenido de la vista activa ─────────────────────────── */}
        <div key={viewKey(view)}>
          {view === 'resumen' && <ResumenView cot={cot} proyecto={proyecto} showCosts={showCosts} />}

          {view === 'instalacion' && <InstalacionView />}

          {view === 'consolidado' && <ConsolidadoView cot={cot} showCosts={showCosts} />}

          {view === 'agregar' && (
            <AgregarSeccionView
              catalog={catalog}
              onAdd={(nombre) => handleAddSeccion(nombre)}
            />
          )}

          {activeSeccion && (
            <SeccionInlineEditor
              key={activeSeccion.id}
              seccion={activeSeccion}
              isFrozen={isFrozen}
              onRename={(nombre) => handleRenameSeccion(activeSeccion.id, nombre)}
              onDelete={() => handleDeleteSeccion(activeSeccion.id)}
              onChange={() => { if (activeId !== null) reloadActive(activeId) }}
            />
          )}
        </div>

        {/* Footer sticky de totales */}
        <TotalsFooter cot={cot} showCosts={showCosts} />
      </main>
    </div>
  )
}

// ─── Version Card (sidebar avatar) ───────────────────────────────────────
function VersionCard({
  summary, active, onClick,
}: { summary: CotizacionSummary; active: boolean; onClick: () => void }) {
  const meta = ESTADO_META[summary.estado]
  const frozen = !!summary.snapshot_at

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border p-3 transition"
      style={{
        background: active ? 'var(--accent-bg-soft)' : 'var(--bg-card)',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        boxShadow: active ? '0 0 0 1px var(--accent)' : 'none',
      }}
    >
      {/* Header: avatar versión + estado + lock */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
          style={{
            background: active ? 'var(--accent)' : 'var(--bg-toggle)',
            color: active ? 'var(--text-on-accent)' : 'var(--text-primary)',
          }}
        >
          v{summary.version}
        </div>
        <div className="min-w-0 flex-1">
          <span
            className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide"
            style={{ background: meta.bg, color: meta.text }}
          >
            {meta.label}
          </span>
        </div>
        {frozen && (
          <span title="Versión congelada" className="text-app-muted text-xs">🔒</span>
        )}
      </div>

      {/* Precio */}
      <div className="text-lg font-bold leading-tight" style={{ color: active ? 'var(--accent-text)' : 'var(--text-primary)' }}>
        {fmtMoney(summary.total_venta)}
      </div>

      {/* Resumen secciones / items */}
      <div className="text-[10px] uppercase tracking-wide text-app-muted mt-1">
        {summary.secciones_count} secc. · {summary.items_count} {summary.items_count === 1 ? 'item' : 'items'}
      </div>

      {/* Fecha de envío si snapshot, o creación si borrador */}
      <div className="text-[10px] text-app-muted mt-0.5">
        {frozen && summary.snapshot_at
          ? `Enviada ${new Date(summary.snapshot_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}`
          : `${new Date(summary.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}`}
      </div>
    </button>
  )
}

// ─── Vista Instalación (placeholder por ahora) ───────────────────────────
function InstalacionView() {
  return (
    <div
      className="rounded-2xl border p-10 text-center"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="text-5xl mb-3 opacity-70">🚚</div>
      <h3 className="text-lg font-bold text-app mb-1">Instalación</h3>
      <p className="text-sm text-app-secondary max-w-md mx-auto">
        Aquí va lo del montaje y desmontaje del evento: jornadas, equipo asignado,
        sueldos, comida y transporte. La estructura entra en el siguiente paso del
        rollout — me confirmas qué campos quieres y lo armo.
      </p>
      <div
        className="mt-5 inline-block px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest"
        style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
      >
        Pendiente de definir
      </div>
    </div>
  )
}

// ─── Desviación de costos (Fase 3) ──────────────────────────────────────
function DesviacionPanel({ cotizacionId }: { cotizacionId: number }) {
  const [data, setData] = useState<DesviacionResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    cotizacionesApi.getDesviacion(cotizacionId)
      .then((d) => { if (alive) setData(d) })
      .catch((e) => { if (alive) setErr(e instanceof ApiError ? e.message : 'Error') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [cotizacionId])

  if (loading) {
    return <div className="py-4 text-center text-xs text-app-muted">Cargando desviación…</div>
  }
  if (err || !data) {
    return <div className="py-4 text-center text-xs" style={{ color: 'var(--danger)' }}>{err}</div>
  }

  const delta = Number(data.delta_total)
  const pct = Number(data.delta_pct)
  const positivo = delta > 0  // costo subió = perdiste margen
  const negativo = delta < 0  // costo bajó = ganaste margen

  return (
    <div
      className="rounded-xl border p-4 mt-4"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h4 className="text-sm font-bold text-app">📊 Desviación de costos vs catálogo actual</h4>
          <p className="text-[11px] text-app-secondary">
            Compara el snapshot congelado vs el precio de hoy en el catálogo.
            {data.snapshot_at && (
              <> Congelada el {new Date(data.snapshot_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}.</>
            )}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-app-muted font-semibold">Delta total</div>
          <div
            className="text-lg font-bold"
            style={{ color: positivo ? '#E11D48' : negativo ? '#059669' : 'var(--text-primary)' }}
          >
            {delta >= 0 ? '+' : ''}{fmtMoney(delta)} ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)
          </div>
          <div className="text-[10px] text-app-muted mt-0.5">
            {positivo ? 'Costo SUBIÓ → perdiste margen' : negativo ? 'Costo BAJÓ → ganaste margen' : 'Sin cambios'}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[9px] uppercase tracking-widest text-app-muted border-b" style={{ borderColor: 'var(--border-soft)' }}>
              <th className="px-2 py-2">Sección</th>
              <th className="px-2 py-2">Concepto</th>
              <th className="px-2 py-2 text-right">Cant.</th>
              <th className="px-2 py-2 text-right">Costo snapshot</th>
              <th className="px-2 py-2 text-right">Costo actual</th>
              <th className="px-2 py-2 text-right">Δ unit</th>
              <th className="px-2 py-2 text-right">Δ total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it) => {
              const dt = Number(it.delta_total)
              const color = dt > 0 ? '#E11D48' : dt < 0 ? '#059669' : 'var(--text-secondary)'
              return (
                <tr key={it.item_id} className="border-b last:border-0" style={{ borderColor: 'var(--border-soft)' }}>
                  <td className="px-2 py-1.5 text-app-secondary text-[10px]">{it.seccion_nombre}</td>
                  <td className="px-2 py-1.5 text-app">{it.nombre}</td>
                  <td className="px-2 py-1.5 text-right">{Number(it.cantidad)}</td>
                  <td className="px-2 py-1.5 text-right text-app-secondary">{fmtMoney(it.costo_snapshot)}</td>
                  <td className="px-2 py-1.5 text-right">{fmtMoney(it.costo_actual)}</td>
                  <td className="px-2 py-1.5 text-right" style={{ color }}>{Number(it.delta_unit) >= 0 ? '+' : ''}{fmtMoney(it.delta_unit)}</td>
                  <td className="px-2 py-1.5 text-right font-bold" style={{ color }}>{Number(it.delta_total) >= 0 ? '+' : ''}{fmtMoney(it.delta_total)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Pill ────────────────────────────────────────────────────────────────
function Pill({
  label, active, onClick, count, dashed,
}: { label: string; active: boolean; onClick: () => void; count?: number; dashed?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition whitespace-nowrap"
      style={{
        background: active ? 'var(--accent)' : 'var(--bg-card)',
        color: active ? 'var(--text-on-accent)' : 'var(--text-primary)',
        borderColor: active ? 'var(--accent)' : 'var(--border)',
        borderStyle: dashed ? 'dashed' : 'solid',
        opacity: dashed && !active ? 0.7 : 1,
      }}
    >
      {label}
      {count !== undefined && (
        <span className="ml-1.5 text-[10px] opacity-70">({count})</span>
      )}
    </button>
  )
}

// ─── Vista Resumen ───────────────────────────────────────────────────────
function ResumenView({
  cot, proyecto, showCosts,
}: { cot: Cotizacion; proyecto: ProyectoRow; showCosts: boolean }) {
  const [mode, setMode] = useState<'web' | 'pdf'>('web')

  return (
    <div className="space-y-3">
      {/* Toggle Vista Web / Vista PDF */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-app">Resumen de cotización</h3>
        <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
          {(['web', 'pdf'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition"
              style={{
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              }}
            >
              {m === 'web' ? '🖥️ Vista Web' : '📄 Vista PDF'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'web' ? (
        <ResumenWeb cot={cot} proyecto={proyecto} showCosts={showCosts} />
      ) : (
        <ResumenPdf cot={cot} proyecto={proyecto} />
      )}
    </div>
  )
}

function ResumenWeb({ cot, proyecto, showCosts }: { cot: Cotizacion; proyecto: ProyectoRow; showCosts: boolean }) {
  const margenReal = Number(cot.margen_real) * 100
  return (
    <div
      className="rounded-2xl border p-6 space-y-5"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-start justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-soft)' }}>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-app-muted font-semibold">
            Cotización v{cot.version} · {cot.estado}
          </div>
          <h2 className="text-2xl font-bold text-app mt-1">{proyecto.nombre}</h2>
          <div className="text-sm text-app-secondary">
            Cliente: <strong>{proyecto.cliente_nombre}</strong>
            {proyecto.fecha_evento && <> · Evento: {new Date(proyecto.fecha_evento + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-app-muted font-semibold">Total</div>
          <div className="text-3xl font-bold" style={{ color: 'var(--accent-text)' }}>
            {fmtMoney(cot.total_venta)}
          </div>
        </div>
      </div>

      {cot.secciones.length === 0 ? (
        <div className="py-8 text-center text-sm text-app-muted">
          La cotización está vacía. Agrega secciones desde la pill "+".
        </div>
      ) : (
        cot.secciones.map((s) => (
          <div key={s.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-app">{s.nombre}</h4>
              <span className="text-sm font-bold text-app">{fmtMoney(s.subtotal_venta)}</span>
            </div>
            <div className="space-y-1 pl-3">
              {s.items.length === 0 ? (
                <div className="text-xs text-app-muted italic">Sin items.</div>
              ) : (
                s.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between text-sm">
                    <span className="text-app-secondary">
                      {Number(it.cantidad)} × {it.nombre}
                    </span>
                    <span className="text-app font-medium">{fmtMoney(it.subtotal_venta)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))
      )}

      {/* Bloque de utilidad (solo si showCosts) */}
      {showCosts && (
        <div className="pt-4 border-t grid grid-cols-3 gap-4" style={{ borderColor: 'var(--border-soft)' }}>
          <Stat label="Costo total" value={fmtMoney(cot.total_costo)} />
          <Stat
            label="Utilidad"
            value={fmtMoney(Number(cot.total_venta) - Number(cot.total_costo))}
            hint={`Margen ${margenReal.toFixed(1)}%`}
          />
          <Stat label="Precio cliente" value={fmtMoney(cot.total_venta)} big />
        </div>
      )}

      {/* Desviación: solo si congelada y mostrando costo interno */}
      {cot.snapshot_at && showCosts && (
        <DesviacionPanel cotizacionId={cot.id} />
      )}
    </div>
  )
}

function ResumenPdf({ cot, proyecto }: { cot: Cotizacion; proyecto: ProyectoRow }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button variant="secondary" onClick={() => window.print()}>
          📥 Descargar / Imprimir
        </Button>
      </div>

      {/* Marco gris simulando un visor de PDF */}
      <div
        className="rounded-xl p-6 flex justify-center"
        style={{ background: '#5b5b5b' }}
      >
        {/* Hoja A4 estilo documento */}
        <div
          className="shadow-2xl"
          style={{
            background: 'white',
            color: '#1a1a1a',
            width: '100%',
            maxWidth: '780px',
            minHeight: '1000px',
            padding: '56px 64px',
            fontFamily: 'Georgia, serif',
          }}
        >
          {/* Header del documento */}
          <div className="flex items-start justify-between mb-8 pb-4 border-b" style={{ borderColor: '#e5e5e5' }}>
            <div>
              <div style={{ fontSize: '10px', letterSpacing: '0.18em', color: '#888', textTransform: 'uppercase' }}>
                Terra de Flora
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: '#1A2E5A' }}>
                Cotización {proyecto.codigo}
              </h1>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                Versión {cot.version} · {new Date(cot.created_at).toLocaleDateString('es-MX')}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.18em', color: '#888', textTransform: 'uppercase' }}>
                Para
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
                {proyecto.cliente_nombre}
              </div>
              {proyecto.fecha_evento && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Evento: {new Date(proyecto.fecha_evento + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', color: '#1A2E5A' }}>
            {proyecto.nombre}
          </h2>
          {cot.notas && (
            <p style={{ fontSize: '12px', color: '#555', marginBottom: '20px', fontStyle: 'italic' }}>
              {cot.notas}
            </p>
          )}

          {/* Secciones */}
          {cot.secciones.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: '40px 0', fontStyle: 'italic' }}>
              Cotización vacía.
            </div>
          ) : (
            cot.secciones.map((s) => (
              <div key={s.id} style={{ marginBottom: '24px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    paddingBottom: '6px',
                    borderBottom: '1px solid #e5e5e5',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#1A2E5A' }}>{s.nombre}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{fmtMoney(s.subtotal_venta)}</span>
                </div>
                {s.items.map((it) => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0' }}>
                    <span style={{ color: '#444' }}>{Number(it.cantidad)} × {it.nombre}</span>
                    <span style={{ color: '#444' }}>{fmtMoney(it.subtotal_venta)}</span>
                  </div>
                ))}
              </div>
            ))
          )}

          {/* Total grande */}
          <div
            style={{
              marginTop: '32px',
              padding: '16px 20px',
              background: '#F5F7FA',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#1A2E5A' }}>
              Total
            </span>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#1A2E5A' }}>
              {fmtMoney(cot.total_venta)}
            </span>
          </div>

          <div style={{ marginTop: '40px', fontSize: '10px', color: '#999', textAlign: 'center' }}>
            Esta cotización es vigente por 30 días a partir de la fecha de emisión.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Vista Consolidado ───────────────────────────────────────────────────
function ConsolidadoView({ cot, showCosts }: { cot: Cotizacion; showCosts: boolean }) {
  const rows = useMemo(() => {
    const out: { seccion: string; nombre: string; cantidad: number; costoUnit: number; precioUnit: number; subCosto: number; subVenta: number }[] = []
    for (const s of cot.secciones) {
      for (const it of s.items) {
        out.push({
          seccion: s.nombre,
          nombre: it.nombre,
          cantidad: Number(it.cantidad),
          costoUnit: Number(it.costo_unit),
          precioUnit: Number(it.precio_venta_calc),
          subCosto: Number(it.subtotal_costo),
          subVenta: Number(it.subtotal_venta),
        })
      }
    }
    return out
  }, [cot])

  if (rows.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed py-12 text-center"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="text-3xl mb-2 opacity-70">📦</div>
        <p className="text-sm text-app-secondary">Sin items todavía.</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-left text-[10px] uppercase tracking-widest text-app-muted border-b"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <th className="px-4 py-3 font-semibold">Sección</th>
            <th className="px-4 py-3 font-semibold">Concepto</th>
            <th className="px-4 py-3 font-semibold text-right">Cant.</th>
            {showCosts && <th className="px-4 py-3 font-semibold text-right">Costo unit.</th>}
            <th className="px-4 py-3 font-semibold text-right">P. venta unit.</th>
            {showCosts && <th className="px-4 py-3 font-semibold text-right">Subtotal costo</th>}
            <th className="px-4 py-3 font-semibold text-right">Subtotal venta</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b last:border-0" style={{ borderColor: 'var(--border-soft)' }}>
              <td className="px-4 py-2 text-app-secondary text-xs">{r.seccion}</td>
              <td className="px-4 py-2 text-app font-medium">{r.nombre}</td>
              <td className="px-4 py-2 text-right text-app">{r.cantidad}</td>
              {showCosts && <td className="px-4 py-2 text-right text-app-secondary">{fmtMoney(r.costoUnit)}</td>}
              <td className="px-4 py-2 text-right text-app">{fmtMoney(r.precioUnit)}</td>
              {showCosts && <td className="px-4 py-2 text-right text-app-secondary">{fmtMoney(r.subCosto)}</td>}
              <td className="px-4 py-2 text-right text-app font-semibold">{fmtMoney(r.subVenta)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Vista Agregar sección ───────────────────────────────────────────────
function AgregarSeccionView({
  catalog, onAdd,
}: { catalog: CotizacionCatalog | null; onAdd: (nombre: string) => void }) {
  const [customName, setCustomName] = useState('')

  return (
    <div
      className="rounded-2xl border p-6 space-y-4"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      <div>
        <h3 className="text-lg font-bold text-app">Nueva sección</h3>
        <p className="text-sm text-app-secondary">
          Elige un tipo sugerido o escribe un nombre custom.
        </p>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-app-muted font-semibold mb-2">
          Sugerencias
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {catalog?.secciones_tipo.map((t) => (
            <button
              key={t.nombre}
              onClick={() => onAdd(t.nombre)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
              style={{
                background: 'var(--bg-elevated)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            >
              <span className="mr-1">{t.emoji}</span>{t.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t" style={{ borderColor: 'var(--border-soft)' }}>
        <div className="text-[10px] uppercase tracking-widest text-app-muted font-semibold mb-2 mt-3">
          Nombre custom
        </div>
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Ej. Vestíbulo, Pista, Photo booth…"
            className="flex-1 px-3 py-2 rounded-lg border text-sm"
            style={{
              background: 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customName.trim()) {
                onAdd(customName.trim())
                setCustomName('')
              }
            }}
          />
          <Button
            onClick={() => {
              if (customName.trim()) {
                onAdd(customName.trim())
                setCustomName('')
              }
            }}
            disabled={!customName.trim()}
          >
            + Crear sección
          </Button>
        </div>
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
