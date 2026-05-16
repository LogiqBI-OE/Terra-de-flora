// Drawer para crear/editar un evento de calendario.

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Button from '../../components/ui/Button'
import Drawer from '../../components/ui/Drawer'
import {
  ApiError,
  eventosApi,
  proyectosApi,
  type Evento,
  type ProyectoRow,
  type TeamUser,
  type TipoEvento,
} from '../../lib/api'
import { TIPO_META } from './CalendarioPage'

interface Props {
  editing: Evento | null
  initialDay: Date | null
  team: TeamUser[]
  onSaved: () => void
  onClose: () => void
}

const TIPOS: TipoEvento[] = ['junta', 'llamada', 'pendiente', 'custom']

export default function EventoDrawer({ editing, initialDay, team, onSaved, onClose }: Props) {
  const [tipo, setTipo] = useState<TipoEvento>('junta')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [fecha, setFecha] = useState('')         // yyyy-mm-dd
  const [horaInicio, setHoraInicio] = useState('') // hh:mm
  const [horaFin, setHoraFin] = useState('')
  const [proyectoId, setProyectoId] = useState<number | null>(null)
  const [participantes, setParticipantes] = useState<Set<number>>(new Set())
  const [isDone, setIsDone] = useState(false)
  const [proyectos, setProyectos] = useState<ProyectoRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Hidratar form desde editing o initialDay
  useEffect(() => {
    if (editing) {
      setTipo((editing.tipo ?? 'custom') as TipoEvento)
      setTitulo(editing.titulo)
      setDescripcion(editing.descripcion ?? '')
      setAllDay(editing.all_day)
      const start = new Date(editing.start_at)
      setFecha(toDateStr(start))
      setHoraInicio(toTimeStr(start))
      setHoraFin(editing.end_at ? toTimeStr(new Date(editing.end_at)) : '')
      setProyectoId(editing.proyecto_id)
      setParticipantes(new Set(editing.participantes.map((p) => p.user_id)))
      setIsDone(editing.is_done)
    } else {
      const day = initialDay ?? new Date()
      setTipo('junta')
      setTitulo('')
      setDescripcion('')
      setAllDay(false)
      setFecha(toDateStr(day))
      // Default: próxima hora redondeada
      const now = new Date()
      const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0)
      setHoraInicio(toTimeStr(nextHour))
      setHoraFin(toTimeStr(new Date(nextHour.getTime() + 60 * 60 * 1000)))
      setProyectoId(null)
      setParticipantes(new Set())
      setIsDone(false)
    }
    setError(null)
  }, [editing, initialDay])

  // Cargar proyectos para el picker
  useEffect(() => {
    proyectosApi.list().then(setProyectos).catch(() => {})
  }, [])

  const canSubmit = useMemo(() =>
    titulo.trim().length > 0 && fecha.length > 0 && (allDay || horaInicio.length > 0),
    [titulo, fecha, allDay, horaInicio],
  )

  async function handleSave() {
    if (!canSubmit) return
    setBusy(true); setError(null)
    try {
      const startIso = buildIso(fecha, allDay ? '00:00' : horaInicio)
      const endIso = (!allDay && horaFin) ? buildIso(fecha, horaFin) : null

      const payload = {
        tipo,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        start_at: startIso,
        end_at: endIso,
        all_day: allDay,
        proyecto_id: proyectoId,
        participante_ids: Array.from(participantes),
        is_done: isDone,
      }

      if (editing) {
        await eventosApi.update(editing.id, payload)
      } else {
        await eventosApi.create(payload)
      }
      onSaved()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar')
    } finally { setBusy(false) }
  }

  function toggleParticipante(uid: number) {
    setParticipantes((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) next.delete(uid)
      else next.add(uid)
      return next
    })
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={editing ? 'Editar evento' : 'Nuevo evento'}
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!canSubmit || busy}>
            {busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear evento'}
          </Button>
        </>
      )}
    >
      <div className="space-y-4">
        {/* Tipo */}
        <Field label="Tipo">
          <div className="flex items-center gap-2 flex-wrap">
            {TIPOS.map((t) => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold transition"
                style={{
                  background: tipo === t ? TIPO_META[t].bg : 'var(--bg-elevated)',
                  borderColor: tipo === t ? TIPO_META[t].border : 'var(--border)',
                  color: tipo === t ? TIPO_META[t].text : 'var(--text-secondary)',
                }}
              >
                <span className="mr-1">{TIPO_META[t].emoji}</span>{TIPO_META[t].label}
              </button>
            ))}
          </div>
        </Field>

        {/* Título */}
        <Field label="Título" required>
          <input
            autoFocus
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Llamar a cliente Ana"
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </Field>

        {/* All day toggle */}
        <Field label="">
          <label className="inline-flex items-center gap-2 text-sm text-app-secondary">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
            />
            Todo el día
          </label>
        </Field>

        {/* Fecha + horas */}
        <div className="grid grid-cols-12 gap-3">
          <div className={allDay ? 'col-span-12' : 'col-span-6'}>
            <Field label="Fecha" required>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                onFocus={(e) => { try { (e.target as HTMLInputElement & { showPicker?: () => void }).showPicker?.() } catch {/*noop*/} }}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </Field>
          </div>
          {!allDay && (
            <>
              <div className="col-span-3">
                <Field label="Inicio" required>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </Field>
              </div>
              <div className="col-span-3">
                <Field label="Fin">
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </Field>
              </div>
            </>
          )}
        </div>

        {/* Pendiente: checkbox de done */}
        {tipo === 'pendiente' && editing && (
          <Field label="">
            <label className="inline-flex items-center gap-2 text-sm text-app-secondary">
              <input
                type="checkbox"
                checked={isDone}
                onChange={(e) => setIsDone(e.target.checked)}
              />
              Marcar como completado
            </label>
          </Field>
        )}

        {/* Descripción */}
        <Field label="Descripción / Notas">
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            placeholder="Detalles, link de zoom, contexto…"
            className="w-full px-3 py-2 rounded-lg border text-sm resize-y"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
        </Field>

        {/* Proyecto */}
        <Field label="Vincular a proyecto (opcional)">
          <select
            value={proyectoId ?? 0}
            onChange={(e) => setProyectoId(Number(e.target.value) || null)}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <option value={0}>— Sin proyecto —</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} · {p.nombre} ({p.cliente_nombre})
              </option>
            ))}
          </select>
        </Field>

        {/* Participantes */}
        <Field label={`Invitar al equipo${participantes.size > 0 ? ` (${participantes.size})` : ''}`}>
          <div
            className="rounded-lg border max-h-48 overflow-y-auto"
            style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}
          >
            {team.length === 0 && (
              <div className="px-3 py-2 text-xs text-app-muted text-center">
                Sin compañeros para invitar.
              </div>
            )}
            {team.map((u) => {
              const checked = participantes.has(u.id)
              return (
                <label
                  key={u.id}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-black/5 transition"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleParticipante(u.id)}
                  />
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
                  >
                    {u.iniciales}
                  </div>
                  <span className="text-sm text-app">{u.nombre}</span>
                  <span className="text-[10px] text-app-muted ml-auto">L{u.level}</span>
                </label>
              )
            })}
          </div>
        </Field>

        {error && (
          <div
            className="rounded-lg border px-3 py-2 text-xs"
            style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)', color: 'var(--danger)' }}
          >
            {error}
          </div>
        )}
      </div>
    </Drawer>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      {label && (
        <label className="block text-[10px] uppercase tracking-widest text-app-muted font-semibold mb-1">
          {label}{required && <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      {children}
    </div>
  )
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function buildIso(fecha: string, hora: string): string {
  // fecha = yyyy-mm-dd, hora = hh:mm. Resultado: ISO con offset local.
  const [y, m, d] = fecha.split('-').map(Number)
  const [hh, mm] = hora.split(':').map(Number)
  const local = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0)
  return local.toISOString()
}
