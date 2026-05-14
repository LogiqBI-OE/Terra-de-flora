// Tab Pagos — por ahora muestra la tabla de etapas/lugares del evento.
// Cuando construyamos el modulo de pagos real, aqui van los pagos.

import type { ProyectoRow } from '../../../lib/api'

const ETAPA_EMOJI: Record<string, string> = {
  Iglesia: '⛪', Civil: '⚖️', Recepción: '🥂',
  Brunch: '🍳', 'Sesión de fotos': '📸', Otro: '✨',
}

interface Props {
  proyecto: ProyectoRow
}

export default function PagosTab({ proyecto }: Props) {
  const direccion = proyecto.direccion_evento ?? '—'
  const fecha = proyecto.fecha_evento
    ? new Date(proyecto.fecha_evento + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-app">Calendario del evento</h3>
        <p className="text-sm text-app-secondary">
          Cronograma con la información de cada etapa del evento.
        </p>
      </div>

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
              <th className="px-4 py-3 font-semibold">Tipo de evento</th>
              <th className="px-4 py-3 font-semibold">Lugar</th>
              <th className="px-4 py-3 font-semibold">Dirección</th>
              <th className="px-4 py-3 font-semibold">Fecha de evento</th>
              <th className="px-4 py-3 font-semibold">Hora de evento</th>
              <th className="px-4 py-3 font-semibold">Montaje</th>
              <th className="px-4 py-3 font-semibold">Desmontaje</th>
            </tr>
          </thead>
          <tbody>
            {proyecto.locations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-app-muted">
                  Este proyecto aún no tiene lugares definidos.
                  <br />Edítalo desde la tab <strong>Folio</strong> y agrega al menos uno.
                </td>
              </tr>
            ) : (
              proyecto.locations.map((loc, idx) => (
                <tr key={idx} className="border-b last:border-0" style={{ borderColor: 'var(--border-soft)' }}>
                  <td className="px-4 py-3 font-semibold text-app">
                    <span className="mr-1.5">{ETAPA_EMOJI[loc.tipo] ?? '📍'}</span>
                    {loc.tipo}
                  </td>
                  <td className="px-4 py-3 text-app">{loc.nombre || <span className="text-app-muted">—</span>}</td>
                  <td className="px-4 py-3 text-app-secondary text-xs">{direccion}</td>
                  <td className="px-4 py-3 text-app">{fecha}</td>
                  <td className="px-4 py-3 text-app">{loc.hora_evento ?? <span className="text-app-muted">—</span>}</td>
                  <td className="px-4 py-3 text-app-secondary">{loc.hora_montaje ?? <span className="text-app-muted">—</span>}</td>
                  <td className="px-4 py-3 text-app-secondary">{loc.hora_desmontaje ?? <span className="text-app-muted">—</span>}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-app-muted">
        💡 La tabla de pagos reales (depósito, anticipos, liquidación) se conectará aquí cuando construyamos el módulo de cotización.
      </div>
    </div>
  )
}
