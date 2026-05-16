// Calendario — vista mes con agenda lateral del día seleccionado.
// Eventos propios + invitaciones + sintéticos de proyectos (fecha_evento).

import { useEffect, useMemo, useState, type JSX, type MouseEvent as ReactMouseEvent } from 'react'
import AppShell from '../../components/layout/AppShell'
import Button from '../../components/ui/Button'
import { IconChevronRight, IconPlus } from '../../components/icons/Icons'
import {
  ApiError,
  comentariosApi,
  eventosApi,
  type Evento,
  type TeamUser,
  type TipoEvento,
} from '../../lib/api'
import EventoDrawer from './EventoDrawer'

// Colores por tipo (mantener sync con EventoDrawer y la doc del modelo)
export const TIPO_META: Record<TipoEvento, { label: string; emoji: string; bg: string; border: string; text: string }> = {
  junta:     { label: 'Junta',     emoji: '👥', bg: 'rgba(14, 165, 233, 0.18)', border: 'rgba(14, 165, 233, 0.6)',  text: '#0284C7' },
  llamada:   { label: 'Llamada',   emoji: '📞', bg: 'rgba(16, 185, 129, 0.18)', border: 'rgba(16, 185, 129, 0.6)',  text: '#059669' },
  pendiente: { label: 'Pendiente', emoji: '✅', bg: 'rgba(245, 158, 11, 0.18)', border: 'rgba(245, 158, 11, 0.6)',  text: '#D97706' },
  custom:    { label: 'Otro',      emoji: '📌', bg: 'rgba(148, 163, 184, 0.18)', border: 'rgba(148, 163, 184, 0.6)', text: '#475569' },
}

// Color especial para eventos sintéticos de proyectos
export const PROYECTO_COLORS = {
  bg: 'rgba(244, 63, 94, 0.18)',
  border: 'rgba(244, 63, 94, 0.6)',
  text: '#E11D48',
}

type FilterKey = 'junta' | 'llamada' | 'pendiente' | 'proyecto'
const ALL_FILTERS: FilterKey[] = ['junta', 'llamada', 'pendiente', 'proyecto']

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function CalendarioPage() {
  const today = new Date()
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(() => stripTime(today))
  const [eventos, setEventos] = useState<Evento[]>([])
  const [team, setTeam] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Evento | null>(null)
  const [drawerInitialDay, setDrawerInitialDay] = useState<Date | null>(null)

  const [filters, setFilters] = useState<Set<FilterKey>>(new Set(ALL_FILTERS))

  // Rango = todo el mes mostrado en el grid (incluye días de mes anterior/siguiente)
  const { gridStart, gridEnd } = useMemo(() => monthGridRange(cursor), [cursor])

  async function reload() {
    try {
      const list = await eventosApi.list(isoDate(gridStart), isoDate(gridEnd))
      setEventos(list)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando calendario')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    setLoading(true)
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor])

  useEffect(() => {
    comentariosApi.listTeam().then(setTeam).catch(() => {})
  }, [])

  // Indexa eventos por día (yyyy-mm-dd) para render rápido
  const byDay = useMemo(() => {
    const map: Record<string, Evento[]> = {}
    for (const e of eventos) {
      if (!passesFilter(e, filters)) continue
      const key = isoDate(new Date(e.start_at))
      ;(map[key] ??= []).push(e)
    }
    return map
  }, [eventos, filters])

  function toggleFilter(k: FilterKey) {
    setFilters((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  function gotoMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  function openCreate(day: Date | null) {
    setEditing(null)
    setDrawerInitialDay(day ?? selectedDay)
    setDrawerOpen(true)
  }

  function openEdit(e: Evento) {
    if (e.kind === 'proyecto') {
      // Sintético: link al proyecto en lugar de abrir editor
      window.location.href = `/proyectos/${e.proyecto_id}`
      return
    }
    setEditing(e)
    setDrawerInitialDay(null)
    setDrawerOpen(true)
  }

  async function handleSaved() {
    setDrawerOpen(false)
    setEditing(null)
    await reload()
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Borrar este evento?')) return
    try {
      await eventosApi.delete(id)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo borrar')
    }
  }

  return (
    <AppShell title="Calendario">
      <div className="space-y-4">
        {/* Header */}
        <div
          className="rounded-2xl border p-5 flex items-center justify-between flex-wrap gap-3"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => gotoMonth(-1)}>‹</Button>
            <h1 className="text-2xl font-bold text-app capitalize">
              {MONTHS_ES[cursor.getMonth()]} <span className="text-app-secondary font-medium">{cursor.getFullYear()}</span>
            </h1>
            <Button variant="secondary" onClick={() => gotoMonth(1)}>›</Button>
            <Button variant="secondary" onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(stripTime(today)) }}>
              Hoy
            </Button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <FilterChip active={filters.has('junta')} meta={TIPO_META.junta} onClick={() => toggleFilter('junta')} />
            <FilterChip active={filters.has('llamada')} meta={TIPO_META.llamada} onClick={() => toggleFilter('llamada')} />
            <FilterChip active={filters.has('pendiente')} meta={TIPO_META.pendiente} onClick={() => toggleFilter('pendiente')} />
            <FilterChip
              active={filters.has('proyecto')}
              meta={{ label: 'Fechas de evento', emoji: '🌸', bg: PROYECTO_COLORS.bg, border: PROYECTO_COLORS.border, text: PROYECTO_COLORS.text }}
              onClick={() => toggleFilter('proyecto')}
            />
            <Button onClick={() => openCreate(selectedDay)}>
              <IconPlus size={14} /> Nuevo evento
            </Button>
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

        <div className="grid grid-cols-12 gap-4">
          {/* Grid mes */}
          <div className="col-span-12 lg:col-span-9">
            <div
              className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              {/* Cabecera días */}
              <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border-soft)' }}>
                {DAYS_ES.map((d) => (
                  <div key={d} className="px-3 py-2 text-[10px] uppercase tracking-widest text-app-muted font-semibold">
                    {d}
                  </div>
                ))}
              </div>
              {/* Celdas */}
              <div className="grid grid-cols-7">
                {(() => {
                  const cells: JSX.Element[] = []
                  const cur = new Date(gridStart)
                  while (cur <= gridEnd) {
                    const day = new Date(cur)
                    cells.push(
                      <DayCell
                        key={day.toISOString()}
                        day={day}
                        cursorMonth={cursor.getMonth()}
                        today={today}
                        selected={sameDay(day, selectedDay)}
                        events={byDay[isoDate(day)] ?? []}
                        onSelect={() => setSelectedDay(stripTime(day))}
                        onDblClick={() => openCreate(day)}
                        onEventClick={openEdit}
                      />,
                    )
                    cur.setDate(cur.getDate() + 1)
                  }
                  return cells
                })()}
              </div>
            </div>
          </div>

          {/* Agenda del día */}
          <aside className="col-span-12 lg:col-span-3">
            <div
              className="rounded-2xl border p-4 sticky top-4"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-app-muted font-semibold">
                    Agenda
                  </div>
                  <h3 className="text-base font-bold text-app capitalize">
                    {selectedDay.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'short' })}
                  </h3>
                </div>
                <button
                  onClick={() => openCreate(selectedDay)}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold"
                  style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
                >
                  +
                </button>
              </div>

              <DayAgenda
                day={selectedDay}
                events={byDay[isoDate(selectedDay)] ?? []}
                onClick={openEdit}
                onDelete={handleDelete}
                loading={loading}
              />
            </div>
          </aside>
        </div>

        {drawerOpen && (
          <EventoDrawer
            onClose={() => { setDrawerOpen(false); setEditing(null) }}
            editing={editing}
            initialDay={drawerInitialDay}
            team={team}
            onSaved={handleSaved}
          />
        )}
      </div>
    </AppShell>
  )
}

// ─── Filter chip ─────────────────────────────────────────────────────────
function FilterChip({
  active, meta, onClick,
}: { active: boolean; meta: { label: string; emoji: string; bg: string; border: string; text: string }; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-full border text-[11px] font-semibold transition"
      style={{
        background: active ? meta.bg : 'var(--bg-elevated)',
        borderColor: active ? meta.border : 'var(--border)',
        color: active ? meta.text : 'var(--text-secondary)',
        opacity: active ? 1 : 0.6,
      }}
    >
      <span className="mr-1">{meta.emoji}</span>{meta.label}
    </button>
  )
}

// ─── Day cell ────────────────────────────────────────────────────────────
function DayCell({
  day, cursorMonth, today, selected, events, onSelect, onDblClick, onEventClick,
}: {
  day: Date; cursorMonth: number; today: Date; selected: boolean
  events: Evento[]
  onSelect: () => void
  onDblClick: () => void
  onEventClick: (e: Evento) => void
}) {
  const inMonth = day.getMonth() === cursorMonth
  const isToday = sameDay(day, today)

  return (
    <div
      onClick={onSelect}
      onDoubleClick={onDblClick}
      className="min-h-[110px] p-1.5 border-r border-b cursor-pointer flex flex-col gap-0.5"
      style={{
        borderColor: 'var(--border-soft)',
        background: selected
          ? 'var(--accent-bg-soft)'
          : inMonth ? 'var(--bg-card)' : 'var(--bg-elevated)',
        opacity: inMonth ? 1 : 0.55,
      }}
    >
      <div className="flex items-center justify-between mb-0.5">
        <span
          className={`text-xs font-bold ${isToday ? 'rounded-full px-1.5 py-0.5' : ''}`}
          style={isToday
            ? { background: 'var(--accent)', color: 'var(--text-on-accent)' }
            : { color: 'var(--text-primary)' }}
        >
          {day.getDate()}
        </span>
      </div>
      {events.slice(0, 4).map((e) => (
        <EventChip key={e.kind + e.id} ev={e} onClick={(ev) => { ev.stopPropagation(); onEventClick(e) }} />
      ))}
      {events.length > 4 && (
        <div className="text-[10px] text-app-muted text-center mt-auto">
          +{events.length - 4} más
        </div>
      )}
    </div>
  )
}

// ─── Event chip dentro de día ────────────────────────────────────────────
function EventChip({ ev, onClick }: { ev: Evento; onClick: (e: ReactMouseEvent) => void }) {
  const colors = ev.kind === 'proyecto'
    ? PROYECTO_COLORS
    : (ev.tipo ? TIPO_META[ev.tipo] : TIPO_META.custom)
  const time = !ev.all_day ? new Date(ev.start_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : null
  const done = ev.is_done && ev.tipo === 'pendiente'

  return (
    <button
      onClick={onClick}
      className="w-full px-1.5 py-0.5 rounded text-[10px] text-left truncate border"
      style={{
        background: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        textDecoration: done ? 'line-through' : 'none',
        opacity: done ? 0.6 : 1,
      }}
      title={ev.titulo}
    >
      {time && <span className="font-semibold mr-1">{time}</span>}
      {ev.titulo}
    </button>
  )
}

// ─── Day agenda (sidebar) ────────────────────────────────────────────────
function DayAgenda({
  day, events, onClick, onDelete, loading,
}: {
  day: Date; events: Evento[]
  onClick: (e: Evento) => void
  onDelete: (id: number) => void
  loading: boolean
}) {
  // Marcar día desde props para evitar warning unused
  void day

  if (loading) return <div className="py-4 text-center text-xs text-app-muted">Cargando…</div>
  if (events.length === 0) {
    return (
      <div className="py-6 text-center">
        <div className="text-2xl opacity-60 mb-1">📅</div>
        <p className="text-xs text-app-muted">Sin eventos este día.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {events.map((e) => {
        const colors = e.kind === 'proyecto'
          ? PROYECTO_COLORS
          : (e.tipo ? TIPO_META[e.tipo] : TIPO_META.custom)
        const time = e.all_day
          ? 'Todo el día'
          : new Date(e.start_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
        const endTime = (!e.all_day && e.end_at)
          ? new Date(e.end_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
          : null

        return (
          <li key={e.kind + e.id}>
            <button
              onClick={() => onClick(e)}
              className="w-full p-3 rounded-lg border text-left transition hover:opacity-90"
              style={{
                background: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-widest font-bold">
                    {time}{endTime ? ` – ${endTime}` : ''}
                  </div>
                  <div className="text-sm font-bold mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>
                    {e.titulo}
                  </div>
                  {e.descripcion && (
                    <div className="text-[11px] mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {e.descripcion}
                    </div>
                  )}
                  {e.proyecto_codigo && (
                    <div className="text-[10px] uppercase tracking-wide mt-1 flex items-center gap-0.5">
                      {e.proyecto_codigo} · {e.proyecto_nombre}
                      <IconChevronRight size={10} />
                    </div>
                  )}
                  {e.participantes.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {e.participantes.slice(0, 4).map((p) => (
                        <span
                          key={p.user_id}
                          title={p.nombre}
                          className="w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center"
                          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
                        >
                          {p.iniciales}
                        </span>
                      ))}
                      {e.participantes.length > 4 && (
                        <span className="text-[9px]">+{e.participantes.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
                {e.can_edit && (
                  <button
                    onClick={(ev) => { ev.stopPropagation(); onDelete(e.id) }}
                    className="text-xs opacity-60 hover:opacity-100"
                    title="Borrar"
                  >
                    ✕
                  </button>
                )}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// ─── Utils de fecha ──────────────────────────────────────────────────────
function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Devuelve el rango del grid del mes: lunes anterior al día 1 hasta el
 *  domingo posterior al último día. Total 6 semanas (42 días) máximo. */
function monthGridRange(cursor: Date): { gridStart: Date; gridEnd: Date } {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  // Lunes como inicio (getDay: 0=Sun, 1=Mon, ..., 6=Sat). Queremos Mon=0.
  const dow = (first.getDay() + 6) % 7
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - dow)

  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0)
  const dowEnd = (last.getDay() + 6) % 7
  const gridEnd = new Date(last)
  gridEnd.setDate(last.getDate() + (6 - dowEnd))

  return { gridStart, gridEnd }
}

function passesFilter(e: Evento, filters: Set<FilterKey>): boolean {
  if (e.kind === 'proyecto') return filters.has('proyecto')
  if (e.tipo === 'junta') return filters.has('junta')
  if (e.tipo === 'llamada') return filters.has('llamada')
  if (e.tipo === 'pendiente') return filters.has('pendiente')
  // custom siempre se muestra
  return true
}
