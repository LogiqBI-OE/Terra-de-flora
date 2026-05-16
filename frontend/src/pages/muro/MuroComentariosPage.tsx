// Muro de Comentarios — consolidado de chats por proyecto (estilo messenger).
// Sidebar izquierdo con conversaciones; panel derecho con la conversación
// seleccionada.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import ProyectoChatPanel from '../../components/comentarios/ProyectoChatPanel'
import { ApiError, comentariosApi, type ConversacionItem } from '../../lib/api'

export default function MuroComentariosPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [items, setItems] = useState<ConversacionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const selectedFromUrl = Number(searchParams.get('p')) || null
  const [selectedId, setSelectedId] = useState<number | null>(selectedFromUrl)

  async function reload() {
    try {
      const res = await comentariosApi.listConversaciones()
      setItems(res.items)
      // Si no hay selección y hay items, escoge el primero
      if (selectedId === null && res.items.length > 0) {
        const first = res.items[0].proyecto_id
        setSelectedId(first)
        setSearchParams({ p: String(first) }, { replace: true })
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error cargando conversaciones')
    } finally { setLoading(false) }
  }

  useEffect(() => {
    setLoading(true)
    reload()
    const id = setInterval(reload, 12000)  // polling lista cada 12s
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sincroniza selectedId con la URL cuando cambia
  function selectProyecto(pid: number) {
    setSelectedId(pid)
    setSearchParams({ p: String(pid) }, { replace: true })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return items
    return items.filter((it) =>
      it.proyecto_nombre.toLowerCase().includes(q) ||
      it.cliente_nombre.toLowerCase().includes(q) ||
      it.proyecto_codigo.toLowerCase().includes(q),
    )
  }, [items, search])

  const selected = items.find((it) => it.proyecto_id === selectedId) ?? null

  return (
    <AppShell title="Muro de comentarios">
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)] min-h-[600px]">
        {/* Sidebar conversaciones */}
        <aside
          className="col-span-12 md:col-span-4 lg:col-span-3 rounded-2xl border flex flex-col overflow-hidden"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <h2 className="text-base font-bold text-app">Proyectos</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="mt-2 w-full px-3 py-1.5 rounded-md border text-sm"
              style={{
                background: 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="py-8 text-center text-sm text-app-muted">Cargando…</div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-app-muted">
                Sin proyectos.
              </div>
            )}
            {filtered.map((it) => (
              <ConversacionRow
                key={it.proyecto_id}
                item={it}
                active={it.proyecto_id === selectedId}
                onClick={() => selectProyecto(it.proyecto_id)}
              />
            ))}
          </div>
        </aside>

        {/* Panel de conversación */}
        <main className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col">
          {selected ? (
            <>
              <div
                className="rounded-t-xl border-l border-r border-t px-4 py-3 flex items-center justify-between"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}
              >
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-app-muted">
                    {selected.proyecto_codigo} · {selected.cliente_nombre}
                  </div>
                  <h3 className="text-base font-bold text-app truncate">
                    {selected.proyecto_nombre}
                  </h3>
                </div>
                <button
                  onClick={() => navigate(`/proyectos/${selected.proyecto_id}`)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold transition"
                  style={{
                    background: 'var(--bg-elevated)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Ir al proyecto ↗
                </button>
              </div>
              <div className="flex-1">
                <ProyectoChatPanel
                  proyectoId={selected.proyecto_id}
                  className="h-full"
                  onRead={reload}
                  onChange={reload}
                />
              </div>
            </>
          ) : (
            <div
              className="flex-1 rounded-xl border flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
            >
              <div className="text-center">
                <div className="text-4xl mb-2 opacity-60">💬</div>
                <p className="text-sm text-app-muted">
                  {loading ? 'Cargando…' : 'Selecciona una conversación.'}
                </p>
              </div>
            </div>
          )}
          {error && (
            <div className="mt-2 text-xs" style={{ color: 'var(--danger)' }}>
              {error}
            </div>
          )}
        </main>
      </div>
    </AppShell>
  )
}

function ConversacionRow({
  item, active, onClick,
}: { item: ConversacionItem; active: boolean; onClick: () => void }) {
  const hasUnread = item.unread_count > 0
  const lastTime = item.ultimo_at
    ? new Date(item.ultimo_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-3 border-b text-left transition"
      style={{
        background: active ? 'var(--accent-bg-soft)' : 'transparent',
        borderColor: 'var(--border-soft)',
      }}
    >
      <div className="relative shrink-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
          style={{
            background: active ? 'var(--accent)' : 'var(--bg-toggle)',
            color: active ? 'var(--text-on-accent)' : 'var(--text-secondary)',
          }}
        >
          {item.proyecto_nombre.slice(0, 2).toUpperCase()}
        </div>
        {item.has_mention && (
          <span
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ring-2"
            style={{ background: '#E11D48', ['--tw-ring-color' as string]: 'var(--bg-card)' }}
            title="Te etiquetaron"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-sm truncate ${hasUnread ? 'font-bold text-app' : 'font-semibold text-app-secondary'}`}
          >
            {item.proyecto_nombre}
          </span>
          {lastTime && (
            <span className="text-[10px] text-app-muted shrink-0">{lastTime}</span>
          )}
        </div>
        <div className="text-[11px] text-app-muted truncate">{item.cliente_nombre}</div>
        {item.ultimo_mensaje && (
          <div
            className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-app font-medium' : 'text-app-secondary'}`}
          >
            {item.ultimo_autor && <span className="text-app-muted">{item.ultimo_autor}: </span>}
            {item.ultimo_mensaje}
          </div>
        )}
      </div>

      {hasUnread && (
        <span
          className="shrink-0 ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
        >
          {item.unread_count > 9 ? '9+' : item.unread_count}
        </span>
      )}
    </button>
  )
}
