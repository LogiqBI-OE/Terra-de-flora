// Log de usuarios — timeline global de actividad (login events).
// Acceso: L5+ (mismo que el resto de /users).
// Navegacion: boton back arrow regresa a /usuarios.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import { IconChevronRight } from '../../components/icons/Icons'
import {
  ApiError,
  usersApi,
  type LoginEvent,
  type UserDetail,
} from '../../lib/api'

type TipoFilter = 'todos' | 'exitoso' | 'user_not_found' | 'bad_password' | 'inactive' | 'role_mismatch'

const TIPO_LABELS: Record<TipoFilter, string> = {
  todos: 'Todos',
  exitoso: '✅ Login exitoso',
  user_not_found: '❌ Usuario no encontrado',
  bad_password: '🔒 Contraseña incorrecta',
  inactive: '⏸️ Cuenta inactiva',
  role_mismatch: '🚫 Rol no coincide',
}

const FAILURE_LABELS: Record<string, string> = {
  user_not_found: 'Usuario no encontrado',
  bad_password: 'Contraseña incorrecta',
  inactive: 'Cuenta inactiva',
  role_mismatch: 'Rol no coincide',
}

export default function LogUsuariosPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserDetail[]>([])
  const [events, setEvents] = useState<LoginEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userFilter, setUserFilter] = useState<number | 'todos'>('todos')
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('todos')

  async function load() {
    setLoading(true); setError(null)
    try {
      const filters: { user_id?: number; success?: boolean; failure_reason?: string; limit: number } = { limit: 500 }
      if (userFilter !== 'todos') filters.user_id = userFilter
      if (tipoFilter === 'exitoso') filters.success = true
      else if (tipoFilter !== 'todos') {
        filters.success = false
        filters.failure_reason = tipoFilter
      }
      const [u, e] = await Promise.all([
        usersApi.list(),
        usersApi.allLoginEvents(filters),
      ])
      setUsers(u); setEvents(e)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error al cargar')
    } finally { setLoading(false) }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [userFilter, tipoFilter])

  // Agrupar por dia
  const grouped = useMemo(() => groupByDay(events), [events])

  // Stats simples
  const stats = useMemo(() => {
    const total = events.length
    const exito = events.filter(e => e.success).length
    const fallos = total - exito
    return { total, exito, fallos }
  }, [events])

  return (
    <AppShell title="Log de usuarios">
      <div className="h-full flex flex-col">
        {/* TOP FIJO — header + stats + filtros */}
        <div className="shrink-0 space-y-4 pb-4 border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <button
                onClick={() => navigate('/usuarios')}
                className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-app-muted hover:text-app transition mb-2"
              >
                <span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}>
                  <IconChevronRight size={12} />
                </span>
                <span>Volver a usuarios</span>
              </button>
              <h1 className="text-2xl font-bold text-app">Log de usuarios</h1>
              <p className="text-sm text-app-secondary">
                Bitácora cronológica de intentos de inicio de sesión. Los más recientes arriba.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Stat label="Total" value={stats.total} color="var(--text-secondary)" />
              <Stat label="✅ Éxito" value={stats.exito} color="#059669" />
              <Stat label="❌ Fallidos" value={stats.fallos} color="#DC2626" />
            </div>
          </div>

          <Card>
            <div className="p-4 flex flex-wrap items-end gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Usuario</div>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg border text-sm cursor-pointer min-w-[200px]"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  <option value="todos">Todos los usuarios</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Tipo de actividad</div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(TIPO_LABELS) as TipoFilter[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipoFilter(t)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition border"
                      style={{
                        background: tipoFilter === t ? 'var(--text-primary)' : 'var(--bg-input)',
                        color: tipoFilter === t ? 'var(--bg-page)' : 'var(--text-secondary)',
                        borderColor: tipoFilter === t ? 'var(--text-primary)' : 'var(--border)',
                      }}
                    >
                      {TIPO_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {error && (
            <div
              className="rounded-lg border px-4 py-3 text-sm"
              style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)', color: 'var(--danger)' }}
            >
              {error}
            </div>
          )}
        </div>

        {/* TIMELINE — scrollea internamente */}
        <div className="flex-1 min-h-0 overflow-auto pt-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-app-muted">Cargando…</div>
          ) : events.length === 0 ? (
            <Card>
              <div className="py-12 text-center text-sm text-app-muted">
                No hay actividad que coincida con los filtros.
              </div>
            </Card>
          ) : (
            <Card>
              <div className="p-4 space-y-6">
                {grouped.map(([day, dayEvents]) => (
                  <div key={day}>
                    <div
                      className="sticky top-0 z-10 -mx-4 px-4 py-2 mb-3 border-b"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent-text)' }}>
                        {day} <span className="text-app-muted font-normal normal-case ml-2">· {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}</span>
                      </div>
                    </div>

                    <ul className="space-y-2">
                      {dayEvents.map((e) => (
                        <li key={e.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center pt-2 shrink-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: e.success ? '#059669' : '#DC2626' }}
                            />
                          </div>

                          <div
                            className="flex-1 rounded-lg border px-3 py-2.5"
                            style={{
                              borderColor: e.success ? 'rgba(16, 185, 129, 0.25)' : 'rgba(220, 38, 38, 0.25)',
                              background: e.success ? 'rgba(16, 185, 129, 0.04)' : 'rgba(220, 38, 38, 0.04)',
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold text-app">
                                    {e.user_full_name || e.user_email || `(${e.identifier_used})`}
                                  </span>
                                  {!e.success && e.failure_reason && (
                                    <span
                                      className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                                      style={{ background: 'rgba(220, 38, 38, 0.12)', color: '#DC2626' }}
                                    >
                                      {FAILURE_LABELS[e.failure_reason] ?? e.failure_reason}
                                    </span>
                                  )}
                                  {e.success && (
                                    <span
                                      className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                                      style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}
                                    >
                                      Exitoso
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-app-muted mt-0.5">
                                  Identifier: <span className="font-mono">{e.identifier_used}</span>
                                  {e.ip && <> · IP <span className="font-mono">{e.ip}</span></>}
                                </div>
                                {e.user_agent && (
                                  <div className="text-[10px] text-app-faint mt-0.5 truncate max-w-2xl" title={e.user_agent}>
                                    {e.user_agent}
                                  </div>
                                )}
                              </div>
                              <div className="text-[11px] text-app-muted shrink-0 font-mono">
                                {fmtTime(e.created_at)}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="px-3 py-1.5 rounded-lg border"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}
    >
      <div className="text-[10px] uppercase tracking-widest text-app-muted">{label}</div>
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
    </div>
  )
}

function groupByDay(events: LoginEvent[]): [string, LoginEvent[]][] {
  const map = new Map<string, LoginEvent[]>()
  for (const e of events) {
    const d = new Date(e.created_at)
    const key = d.toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return Array.from(map.entries())
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
