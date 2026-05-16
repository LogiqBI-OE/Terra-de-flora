// Tab Comentarios — chat persistido del proyecto.
//
// Cada mensaje se guarda en backend con autor y timestamp. Polling cada 8s
// mientras el tab está visible para traer mensajes nuevos del equipo.

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../lib/auth'
import {
  ApiError,
  comentariosApi,
  type Comentario,
  type ProyectoRow,
} from '../../../lib/api'

interface Props {
  proyecto: ProyectoRow
}

const POLL_MS = 8000

export default function ComentariosTab({ proyecto }: Props) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Comentario[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const listRef = useRef<HTMLDivElement | null>(null)
  const lastCountRef = useRef(0)

  // Carga inicial + polling
  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | null = null

    async function tick() {
      if (!alive) return
      try {
        const list = await comentariosApi.list(proyecto.id)
        if (alive) setMessages(list)
      } catch {/* el polling no debe ensuciar la UI; el error real se ve al enviar */}
      if (alive) timer = setTimeout(tick, POLL_MS)
    }

    setLoading(true)
    comentariosApi.list(proyecto.id)
      .then((list) => { if (alive) setMessages(list) })
      .catch((e) => {
        if (alive) setError(e instanceof ApiError ? e.message : 'Error cargando comentarios')
      })
      .finally(() => { if (alive) { setLoading(false); timer = setTimeout(tick, POLL_MS) } })

    return () => { alive = false; if (timer) clearTimeout(timer) }
  }, [proyecto.id])

  // Auto-scroll al fondo cuando llega un mensaje nuevo
  useEffect(() => {
    if (messages.length > lastCountRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
    lastCountRef.current = messages.length
  }, [messages.length])

  async function handleSend() {
    const texto = draft.trim()
    if (!texto || sending) return
    setSending(true); setError(null)
    try {
      const nuevo = await comentariosApi.create(proyecto.id, { texto })
      setMessages((prev) => [...prev, nuevo])
      setDraft('')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo enviar')
    } finally { setSending(false) }
  }

  async function handleDelete(cid: number) {
    if (!confirm('¿Borrar este mensaje?')) return
    try {
      await comentariosApi.delete(proyecto.id, cid)
      setMessages((prev) => prev.filter((m) => m.id !== cid))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo borrar')
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] min-h-[500px]">
      {/* Lista de mensajes */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-2 py-4 space-y-4 rounded-t-xl border"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
      >
        {loading && (
          <div className="text-center text-sm text-app-muted py-8">Cargando…</div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-2 opacity-60">💬</div>
            <p className="text-sm text-app-secondary">
              Sin comentarios todavía. Sé el primero en escribir al equipo.
            </p>
          </div>
        )}

        {messages.map((m, i) => {
          const prev = i > 0 ? messages[i - 1] : null
          const groupWithPrev = prev && prev.user_id === m.user_id && timeDiffMin(prev.created_at, m.created_at) < 5
          const isMe = user?.id === m.user_id
          return (
            <MessageRow
              key={m.id}
              m={m}
              isMe={isMe}
              groupWithPrev={!!groupWithPrev}
              onDelete={isMe || (user?.level ?? 0) >= 6 ? () => handleDelete(m.id) : undefined}
            />
          )
        })}
      </div>

      {/* Input */}
      <div
        className="flex items-center gap-2 p-3 rounded-b-xl border-l border-r border-b"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje al equipo…"
          className="flex-1 px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sending}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
        >
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </div>

      {error && (
        <div
          className="mt-2 px-3 py-2 rounded-lg border text-xs"
          style={{
            borderColor: 'var(--danger-border)',
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
function timeDiffMin(a: string, b: string): number {
  return Math.abs((new Date(b).getTime() - new Date(a).getTime()) / 60000)
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (sameDay) {
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function MessageRow({
  m, isMe, groupWithPrev, onDelete,
}: {
  m: Comentario
  isMe: boolean
  groupWithPrev: boolean
  onDelete?: () => void
}) {
  if (isMe) {
    return (
      <div className={`group flex justify-end items-end gap-2 ${groupWithPrev ? '-mt-2' : ''}`}>
        {onDelete && (
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition text-app-muted hover:text-red-500 text-xs"
            title="Borrar"
          >
            ✕
          </button>
        )}
        <div className="max-w-md">
          {!groupWithPrev && (
            <div className="text-[10px] uppercase tracking-widest text-app-muted text-right mb-1 mr-1">
              {m.user_nombre} · {fmtTime(m.created_at)}
            </div>
          )}
          <div
            className="rounded-2xl rounded-br-sm px-3 py-2 text-sm whitespace-pre-wrap"
            style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
          >
            {m.texto}
          </div>
        </div>
        {!groupWithPrev ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' }}
          >
            {m.user_iniciales}
          </div>
        ) : (
          <div className="w-8 shrink-0" />
        )}
      </div>
    )
  }
  return (
    <div className={`group flex justify-start items-end gap-2 ${groupWithPrev ? '-mt-2' : ''}`}>
      {!groupWithPrev ? (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
        >
          {m.user_iniciales}
        </div>
      ) : (
        <div className="w-8 shrink-0" />
      )}
      <div className="max-w-md">
        {!groupWithPrev && (
          <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1 ml-1">
            {m.user_nombre} · {fmtTime(m.created_at)}
          </div>
        )}
        <div
          className="rounded-2xl rounded-bl-sm px-3 py-2 text-sm border whitespace-pre-wrap"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-soft)' }}
        >
          {m.texto}
        </div>
      </div>
      {onDelete && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition text-app-muted hover:text-red-500 text-xs"
          title="Borrar"
        >
          ✕
        </button>
      )}
    </div>
  )
}
