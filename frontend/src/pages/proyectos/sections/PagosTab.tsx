// Tab Pagos — status general + alertas + tabla con deposito + pagos.

import { useEffect, useState } from 'react'
import Button from '../../../components/ui/Button'
import { fmtMoney } from '../../../lib/format'
import {
  ApiError,
  pagosApi,
  type MetodoPago,
  type PagoRow,
  type PagosTabResponse,
  type ProyectoRow,
  type StatusPago,
} from '../../../lib/api'

interface Props {
  proyecto: ProyectoRow
}

const STATUS_META: Record<StatusPago, { label: string; bg: string; text: string }> = {
  pendiente:   { label: 'Pendiente',   bg: 'rgba(148, 163, 184, 0.20)', text: '#475569' },
  pagado:      { label: 'Pagado',      bg: 'rgba(16, 185, 129, 0.20)',  text: '#059669' },
  vencido:     { label: 'Vencido',     bg: 'rgba(244, 63, 94, 0.20)',   text: '#E11D48' },
  por_regresar:{ label: 'Por regresar',bg: 'rgba(245, 158, 11, 0.20)',  text: '#D97706' },
  regresado:   { label: 'Regresado',   bg: 'rgba(14, 165, 233, 0.20)',  text: '#0284C7' },
}

export default function PagosTab({ proyecto }: Props) {
  const [data, setData] = useState<PagosTabResponse | null>(null)
  const [metodos, setMetodos] = useState<MetodoPago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function reload() {
    const [d, ms] = await Promise.all([
      pagosApi.getTab(proyecto.id),
      pagosApi.listMetodos(),
    ])
    setData(d)
    setMetodos(ms)
  }

  useEffect(() => {
    setLoading(true)
    reload()
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Error cargando pagos'))
      .finally(() => setLoading(false))
  }, [proyecto.id])

  async function handleUpdate(id: number, patch: Parameters<typeof pagosApi.update>[1]) {
    try {
      await pagosApi.update(id, patch)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error actualizando')
    }
  }

  async function handleAddPago() {
    setBusy(true); setError(null)
    try {
      await pagosApi.createPago(proyecto.id, { monto: 0 })
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al agregar pago')
    } finally { setBusy(false) }
  }

  async function handleDeletePago(id: number) {
    if (!confirm('¿Borrar este pago?')) return
    try {
      await pagosApi.delete(id)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al borrar')
    }
  }

  async function handleRegresarDeposito() {
    if (!data) return
    await handleUpdate(data.deposito.id, { status: 'por_regresar' })
  }

  if (loading) {
    return <div className="py-12 text-center text-sm text-app-muted">Cargando pagos…</div>
  }
  if (!data) {
    return <div className="py-12 text-center text-sm" style={{ color: 'var(--danger)' }}>{error}</div>
  }

  const { resumen, deposito, pagos } = data
  const cotFinalNum = Number(resumen.cotizacion_final)
  const pendienteNum = Number(resumen.pendiente)
  const pendienteColor =
    pendienteNum <= 0 ? '#059669' : pendienteNum > 0 ? '#D97706' : 'var(--text-primary)'

  return (
    <div className="space-y-5">
      {/* ── Status general + Alertas ─────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Status general */}
        <div
          className="col-span-12 md:col-span-8 rounded-2xl border p-5"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
        >
          <div className="text-[10px] uppercase tracking-widest text-app-muted font-semibold mb-3">
            Status general
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-app-secondary mb-1">Cotización final</div>
              <div className="text-2xl font-bold text-app">{fmtMoney(resumen.cotizacion_final)}</div>
              <div className="text-[10px] text-app-muted mt-0.5">
                {resumen.cotizacion_origen === 'aprobada' && resumen.cotizacion_version != null && (
                  <>✓ v{resumen.cotizacion_version} aprobada</>
                )}
                {resumen.cotizacion_origen === 'enviada' && resumen.cotizacion_version != null && (
                  <>📤 v{resumen.cotizacion_version} enviada (no aprobada)</>
                )}
                {resumen.cotizacion_origen === 'sin_cotizacion' && (
                  <span style={{ color: '#D97706' }}>⚠ Sin cotización aprobada</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-app-secondary mb-1">Total pagado</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-text)' }}>
                {fmtMoney(resumen.total_pagado)}
              </div>
              <div className="text-[10px] text-app-muted mt-0.5">
                {cotFinalNum > 0
                  ? `${((Number(resumen.total_pagado) / cotFinalNum) * 100).toFixed(0)}% del total`
                  : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-app-secondary mb-1">Pendiente</div>
              <div className="text-2xl font-bold" style={{ color: pendienteColor }}>
                {fmtMoney(resumen.pendiente)}
              </div>
              <div className="text-[10px] text-app-muted mt-0.5">
                {pendienteNum <= 0 ? '🎉 Cuenta saldada' : `Faltan por cobrar`}
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div
          className="col-span-12 md:col-span-4 rounded-2xl border p-5"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
        >
          <div className="text-[10px] uppercase tracking-widest text-app-muted font-semibold mb-3">
            Alertas
          </div>
          {resumen.alerta_regresar_deposito ? (
            <button
              onClick={handleRegresarDeposito}
              className="w-full px-4 py-3 rounded-lg font-bold text-sm text-white shadow-md transition hover:opacity-90"
              style={{ background: '#E11D48' }}
            >
              ⚠ REGRESAR DEPÓSITO
            </button>
          ) : (
            <div className="text-center text-app-muted py-3">
              <div className="text-2xl mb-1">✓</div>
              <div className="text-xs">Sin alertas pendientes.</div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg border px-4 py-2 text-sm"
          style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)', color: 'var(--danger)' }}
        >
          {error}
        </div>
      )}

      {/* ── Tabla de pagos ───────────────────────────────────────────── */}
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
              <th className="px-4 py-3 font-semibold w-[18%]">Concepto</th>
              <th className="px-4 py-3 font-semibold w-[18%]">Monto</th>
              <th className="px-4 py-3 font-semibold w-[18%]">Fecha</th>
              <th className="px-4 py-3 font-semibold w-[18%]">Método</th>
              <th className="px-4 py-3 font-semibold w-[20%]">Status</th>
              <th className="px-4 py-3 w-[8%]"></th>
            </tr>
          </thead>
          <tbody>
            <PagoFila
              row={deposito}
              metodos={metodos}
              isDeposito
              busy={busy}
              onUpdate={(patch) => handleUpdate(deposito.id, patch)}
              onDelete={undefined}
            />
            {pagos.map((p, i) => (
              <PagoFila
                key={p.id}
                row={p}
                etiqueta={`Pago ${i + 1}`}
                metodos={metodos}
                busy={busy}
                onUpdate={(patch) => handleUpdate(p.id, patch)}
                onDelete={() => handleDeletePago(p.id)}
              />
            ))}
          </tbody>
        </table>

        <div
          className="px-4 py-3 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border-soft)', background: 'var(--bg-elevated)' }}
        >
          <span className="text-xs text-app-muted">
            {pagos.length === 0
              ? 'Aún no agregas pagos parciales más allá del depósito.'
              : `${pagos.length} ${pagos.length === 1 ? 'pago' : 'pagos'} registrados.`}
          </span>
          <Button variant="secondary" onClick={handleAddPago} disabled={busy}>
            + Agregar pago
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Fila ────────────────────────────────────────────────────────────────
interface FilaProps {
  row: PagoRow
  metodos: MetodoPago[]
  etiqueta?: string
  isDeposito?: boolean
  busy: boolean
  onUpdate: (patch: Parameters<typeof pagosApi.update>[1]) => void
  onDelete?: () => void
}

function PagoFila({ row, metodos, etiqueta, isDeposito, onUpdate, onDelete }: FilaProps) {
  const [monto, setMonto] = useState(String(row.monto))
  const [fecha, setFecha] = useState(row.fecha ?? '')

  useEffect(() => {
    setMonto(String(row.monto))
    setFecha(row.fecha ?? '')
  }, [row.id, row.monto, row.fecha])

  const statusMeta = STATUS_META[row.status_efectivo]

  return (
    <tr className="border-b last:border-0" style={{ borderColor: 'var(--border-soft)' }}>
      <td className="px-4 py-3 font-semibold text-app">
        {isDeposito ? <><span className="mr-1.5">💰</span>Depósito</> : etiqueta}
      </td>

      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="text-app-muted text-xs">$</span>
          <input
            type="number"
            min={0}
            step={1}
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            onBlur={() => {
              const n = Number(monto)
              if (Number.isFinite(n) && n !== Number(row.monto)) {
                onUpdate({ monto: n })
              }
            }}
            className="w-full px-2 py-1.5 rounded-md border text-sm text-right"
            style={{
              background: 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </td>

      <td className="px-3 py-2">
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          onBlur={() => {
            if (fecha !== (row.fecha ?? '')) {
              onUpdate({ fecha: fecha || null })
            }
          }}
          onFocus={(e) => {
            try { (e.target as HTMLInputElement & { showPicker?: () => void }).showPicker?.() } catch {/* noop */}
          }}
          className="w-full px-2 py-1.5 rounded-md border text-sm"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      </td>

      <td className="px-3 py-2">
        <select
          value={row.metodo ?? ''}
          onChange={(e) => onUpdate({ metodo: e.target.value || null })}
          className="w-full px-2 py-1.5 rounded-md border text-sm"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">&lt;Seleccionar&gt;</option>
          {metodos.map((m) => (
            <option key={m.id} value={m.nombre}>{m.nombre}</option>
          ))}
          {/* Si el método del registro ya no está en el catálogo, lo mostramos igual */}
          {row.metodo && !metodos.some((m) => m.nombre === row.metodo) && (
            <option value={row.metodo}>{row.metodo} (inactivo)</option>
          )}
        </select>
      </td>

      <td className="px-3 py-2">
        <select
          value={row.status}
          onChange={(e) => onUpdate({ status: e.target.value as StatusPago })}
          className="w-full px-2 py-1.5 rounded-md text-xs font-semibold border-0"
          style={{ background: statusMeta.bg, color: statusMeta.text }}
        >
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
          {isDeposito && <option value="por_regresar">Por regresar</option>}
          {isDeposito && <option value="regresado">Regresado</option>}
        </select>
        {row.status !== row.status_efectivo && (
          <div className="text-[9px] text-red-500 mt-0.5">
            ⚠ Vencido por fecha
          </div>
        )}
      </td>

      <td className="px-2 py-2 text-right">
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-app-muted hover:text-red-500 transition text-sm"
            title="Borrar pago"
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  )
}

