// Panel de chat de un proyecto.
// Usado por: ComentariosTab (dentro de proyecto) y MuroComentariosPage (consolidado).
// Encapsula: carga, polling, send, reply, edit, react, mark-as-read,
// @ autocomplete y highlight de menciones.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../lib/auth'
import {
  ALLOWED_EMOJIS,
  ApiError,
  comentariosApi,
  type Comentario,
  type TeamUser,
} from '../../lib/api'

interface Props {
  proyectoId: number
  /** Llamado tras mark-as-read (para que el contenedor refresque badges). */
  onRead?: () => void
  /** Llamado al enviar/editar/borrar para que badges externos se refresquen. */
  onChange?: () => void
  /** Altura del contenedor; por default ocupa lo disponible. */
  className?: string
}

const POLL_MS = 8000
const EDIT_WINDOW_MS = 3 * 60 * 1000

export default function ProyectoChatPanel({ proyectoId, onRead, onChange, className }: Props) {
  const { user } = useAuth()
  const myLevel = user?.level ?? 0
  const myId = user?.id

  const [messages, setMessages] = useState<Comentario[]>([])
  const [team, setTeam] = useState<TeamUser[]>([])
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<Comentario | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Tick para refrescar countdown de edición sin re-fetch.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const lastCountRef = useRef(0)
  // Mensajes que recién mandamos pero el polling aún no ve. Los conservamos
  // en la UI para que no parezca que se "borraron".
  const pendingRef = useRef<Map<number, Comentario>>(new Map())

  /** Mezcla la lista del servidor con los pendientes locales. Si el server
   *  ya tiene un id, lo retira de pendientes. */
  function mergeServerList(serverList: Comentario[]): Comentario[] {
    const ids = new Set(serverList.map((m) => m.id))
    for (const id of pendingRef.current.keys()) {
      if (ids.has(id)) pendingRef.current.delete(id)
    }
    if (pendingRef.current.size === 0) return serverList
    return [...serverList, ...Array.from(pendingRef.current.values())]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  // Cargar equipo (mencionables) una vez
  useEffect(() => {
    comentariosApi.listTeam().then(setTeam).catch(() => {/* opcional */})
  }, [])

  // Carga + polling
  useEffect(() => {
    let alive = true
    let timer: ReturnType<typeof setTimeout> | null = null

    async function tick() {
      if (!alive) return
      try {
        const list = await comentariosApi.list(proyectoId)
        if (alive) setMessages(mergeServerList(list))
      } catch {/* polling silencioso */}
      if (alive) timer = setTimeout(tick, POLL_MS)
    }

    setLoading(true)
    setMessages([])
    lastCountRef.current = 0
    comentariosApi.list(proyectoId)
      .then((list) => {
        if (!alive) return
        setMessages(mergeServerList(list))
        // Marca como leído al cargar
        comentariosApi.markRead(proyectoId).then(() => onRead?.()).catch(() => {})
      })
      .catch((e) => {
        if (alive) setError(e instanceof ApiError ? e.message : 'Error cargando comentarios')
      })
      .finally(() => { if (alive) { setLoading(false); timer = setTimeout(tick, POLL_MS) } })

    return () => { alive = false; if (timer) clearTimeout(timer) }
  }, [proyectoId])

  // Auto-scroll cuando llega un mensaje nuevo
  useEffect(() => {
    if (messages.length > lastCountRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
      // Mensaje nuevo visto → marca como leído también
      comentariosApi.markRead(proyectoId).then(() => onRead?.()).catch(() => {})
    }
    lastCountRef.current = messages.length
  }, [messages.length, proyectoId, onRead])

  function replaceMessage(updated: Comentario) {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
  }

  async function handleSend() {
    const texto = draft.trim()
    if (!texto || sending) return
    setSending(true); setError(null)
    try {
      const nuevo = await comentariosApi.create(proyectoId, {
        texto,
        parent_id: replyTo?.id ?? null,
      })
      // Marca como pendiente hasta que el polling confirme que el server lo tiene.
      pendingRef.current.set(nuevo.id, nuevo)
      setMessages((prev) => [...prev, nuevo])
      setDraft('')
      setReplyTo(null)
      onChange?.()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo enviar')
    } finally { setSending(false) }
  }

  async function handleDelete(c: Comentario) {
    if (!confirm('¿Borrar este mensaje?')) return
    try {
      await comentariosApi.delete(proyectoId, c.id)
      setMessages((prev) => prev.filter((m) => m.id !== c.id))
      onChange?.()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo borrar')
    }
  }

  async function handleEdit(c: Comentario, newText: string) {
    const texto = newText.trim()
    if (!texto || texto === c.texto) { setEditingId(null); return }
    try {
      const updated = await comentariosApi.update(proyectoId, c.id, { texto })
      replaceMessage(updated)
      setEditingId(null)
      onChange?.()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo editar')
    }
  }

  async function handleReact(c: Comentario, emoji: string) {
    try {
      const updated = await comentariosApi.toggleReaccion(proyectoId, c.id, emoji)
      replaceMessage(updated)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo reaccionar')
    }
  }

  function canEditDelete(c: Comentario): { edit: boolean; del: boolean } {
    const isMine = c.user_id === myId
    const withinWindow = Date.now() - new Date(c.created_at).getTime() < EDIT_WINDOW_MS
    return {
      edit: isMine && withinWindow,
      del: (isMine && withinWindow) || myLevel >= 6,
    }
  }

  // ── @ autocomplete ────────────────────────────────────────────────────
  const mentionQuery = useMemo(() => {
    // Detecta si el cursor está después de un @token sin cerrar
    const m = draft.match(/(?:^|\s)@([A-Za-z0-9_.\-]*)$/)
    return m ? m[1] : null
  }, [draft])

  const mentionMatches = useMemo(() => {
    if (mentionQuery === null) return []
    const q = mentionQuery.toLowerCase()
    return team
      .filter((u) =>
        (u.username ?? '').toLowerCase().includes(q) ||
        u.nombre.toLowerCase().includes(q),
      )
      .slice(0, 6)
  }, [mentionQuery, team])

  function applyMention(u: TeamUser) {
    const tokenName = u.username || u.nombre
    const replaced = draft.replace(/(?:^|\s)@([A-Za-z0-9_.\-]*)$/, (full, _q) => {
      const prefix = full.startsWith(' ') ? ' ' : ''
      // Si el nombre tiene espacios, lo envolvemos en comillas
      return `${prefix}@${tokenName.includes(' ') ? `"${tokenName}"` : tokenName} `
    })
    setDraft(replaced)
    inputRef.current?.focus()
  }

  return (
    <div className={`flex flex-col ${className ?? 'h-full min-h-[400px]'}`}>
      {/* Lista */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-2 py-4 space-y-3 rounded-t-xl border"
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
          const sameAuthor = prev && prev.user_id === m.user_id
          const closeInTime = prev && timeDiffMin(prev.created_at, m.created_at) < 5
          const groupWithPrev = !!(sameAuthor && closeInTime && !m.parent_id && !prev?.parent_id)
          const isMe = myId === m.user_id
          const perms = canEditDelete(m)
          return (
            <MessageRow
              key={m.id}
              m={m}
              isMe={isMe}
              myUsername={user?.username ?? null}
              myName={user?.full_name ?? null}
              groupWithPrev={groupWithPrev}
              canEdit={perms.edit}
              canDelete={perms.del}
              isEditing={editingId === m.id}
              onStartEdit={() => setEditingId(m.id)}
              onCancelEdit={() => setEditingId(null)}
              onSubmitEdit={(text) => handleEdit(m, text)}
              onDelete={() => handleDelete(m)}
              onReply={() => setReplyTo(m)}
              onReact={(emoji) => handleReact(m, emoji)}
            />
          )
        })}
      </div>

      {/* Reply context */}
      {replyTo && (
        <div
          className="flex items-center gap-2 px-3 py-2 border-l border-r text-xs"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-soft)',
            borderLeftWidth: 3,
            borderLeftColor: 'var(--accent)',
          }}
        >
          <span className="text-app-muted">Respondiendo a</span>
          <strong className="text-app">{replyTo.user_nombre}</strong>
          <span className="text-app-secondary truncate flex-1">
            "{replyTo.texto.slice(0, 80)}{replyTo.texto.length > 80 ? '…' : ''}"
          </span>
          <button
            onClick={() => setReplyTo(null)}
            className="text-app-muted hover:text-app text-base"
            title="Cancelar"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input + @ autocomplete */}
      <div
        className="relative flex items-center gap-2 p-3 border-l border-r border-b rounded-b-xl"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-soft)' }}
      >
        {mentionMatches.length > 0 && (
          <div
            className="absolute bottom-full left-2 right-2 mb-1 rounded-lg border shadow-lg max-h-56 overflow-y-auto"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            {mentionMatches.map((u) => (
              <button
                key={u.id}
                onMouseDown={(e) => { e.preventDefault(); applyMention(u) }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-black/5 transition text-left"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
                >
                  {u.iniciales}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-app truncate">{u.nombre}</div>
                  {u.username && (
                    <div className="text-[11px] text-app-muted">@{u.username}</div>
                  )}
                </div>
                <span className="text-[10px] text-app-muted">L{u.level}</span>
              </button>
            ))}
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={replyTo ? `Responder a ${replyTo.user_nombre}…` : 'Escribe (usa @ para etiquetar)…'}
          className="flex-1 px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && mentionMatches.length === 0) {
              e.preventDefault()
              handleSend()
            } else if (e.key === 'Escape' && replyTo) {
              setReplyTo(null)
            } else if (e.key === 'Enter' && mentionMatches.length > 0) {
              e.preventDefault()
              applyMention(mentionMatches[0])
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

/** Renderiza el texto destacando @menciones. Si la mención coincide con
 *  el usuario actual, usa color "danger" para resaltar.
 */
function renderTexto(texto: string, myUsername: string | null, myName: string | null) {
  const re = /@(?:"([^"]+)"|([A-Za-z0-9_.\-]+))/g
  const parts: Array<{ kind: 'text' | 'mention'; value: string; me?: boolean }> = []
  let last = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(texto)) !== null) {
    if (match.index > last) parts.push({ kind: 'text', value: texto.slice(last, match.index) })
    const tag = match[1] ?? match[2] ?? ''
    const me =
      (myUsername && tag.toLowerCase() === myUsername.toLowerCase()) ||
      (myName && tag.toLowerCase() === myName.toLowerCase()) || false
    parts.push({ kind: 'mention', value: tag, me })
    last = match.index + match[0].length
  }
  if (last < texto.length) parts.push({ kind: 'text', value: texto.slice(last) })

  return parts.map((p, i) => {
    if (p.kind === 'text') return <span key={i}>{p.value}</span>
    return (
      <span
        key={i}
        className="px-1 rounded font-semibold"
        style={p.me
          ? { background: 'rgba(244,63,94,0.18)', color: '#E11D48' }
          : { background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' }}
      >
        @{p.value}
      </span>
    )
  })
}

interface MessageRowProps {
  m: Comentario
  isMe: boolean
  myUsername: string | null
  myName: string | null
  groupWithPrev: boolean
  canEdit: boolean
  canDelete: boolean
  isEditing: boolean
  onStartEdit: () => void
  onCancelEdit: () => void
  onSubmitEdit: (text: string) => void
  onDelete: () => void
  onReply: () => void
  onReact: (emoji: string) => void
}

function MessageRow(p: MessageRowProps) {
  const { m, isMe, myUsername, myName, groupWithPrev, canEdit, canDelete, isEditing } = p
  const [editText, setEditText] = useState(m.texto)
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => { setEditText(m.texto) }, [m.id, m.texto, isEditing])

  const grouped = !isEditing && groupWithPrev

  const Avatar = (
    !grouped ? (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
        style={{
          background: isMe ? 'var(--accent-bg-soft)' : 'var(--bg-toggle)',
          color: isMe ? 'var(--accent-text)' : 'var(--text-secondary)',
        }}
      >
        {m.user_iniciales}
      </div>
    ) : <div className="w-8 shrink-0" />
  )

  const Meta = (
    !grouped ? (
      <div className={`text-[10px] uppercase tracking-widest text-app-muted mb-1 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
        {m.user_nombre} · {fmtTime(m.created_at)}
        {m.edited_at && <span className="ml-1 italic" style={{ textTransform: 'none' }}>(editado)</span>}
      </div>
    ) : null
  )

  const Bubble = (
    <div
      className="rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap border"
      style={
        isMe
          ? { background: 'var(--accent)', color: 'var(--text-on-accent)', borderColor: 'transparent', borderBottomRightRadius: '0.25rem' }
          : { background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-soft)', borderBottomLeftRadius: '0.25rem' }
      }
    >
      {m.parent && (
        <div
          className="mb-1.5 px-2 py-1 rounded text-[11px] border-l-2"
          style={{
            borderLeftColor: isMe ? 'rgba(255,255,255,0.5)' : 'var(--accent)',
            background: isMe ? 'rgba(255,255,255,0.1)' : 'var(--bg-elevated)',
            color: isMe ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)',
          }}
        >
          <div className="font-semibold opacity-90">↪ {m.parent.user_nombre}</div>
          <div className="opacity-80 truncate">{m.parent.texto}</div>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={Math.min(6, Math.max(1, editText.split('\n').length))}
            className="w-full px-2 py-1 rounded border text-sm resize-none"
            style={{
              background: 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                p.onSubmitEdit(editText)
              } else if (e.key === 'Escape') {
                p.onCancelEdit()
              }
            }}
          />
          <div className="flex justify-end gap-2 text-[11px]">
            <button onClick={p.onCancelEdit} className="px-2 py-0.5 rounded hover:bg-black/10 transition" style={{ color: isMe ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)' }}>
              Cancelar (Esc)
            </button>
            <button onClick={() => p.onSubmitEdit(editText)} className="px-2 py-0.5 rounded font-semibold" style={{ background: isMe ? 'rgba(255,255,255,0.2)' : 'var(--accent)', color: isMe ? 'inherit' : 'var(--text-on-accent)' }}>
              Guardar (↵)
            </button>
          </div>
        </div>
      ) : (
        <span>{renderTexto(m.texto, myUsername, myName)}</span>
      )}
    </div>
  )

  const Reactions = (
    m.reacciones.length > 0 ? (
      <div className={`flex items-center gap-1 mt-1 flex-wrap ${isMe ? 'justify-end' : ''}`}>
        {m.reacciones.map((r) => (
          <button
            key={r.emoji}
            onClick={() => p.onReact(r.emoji)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[11px] transition"
            style={{
              background: r.by_me ? 'var(--accent-bg-soft)' : 'var(--bg-card)',
              borderColor: r.by_me ? 'var(--accent)' : 'var(--border-soft)',
              color: r.by_me ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <span>{r.emoji}</span>
            <span className="font-semibold">{r.count}</span>
          </button>
        ))}
      </div>
    ) : null
  )

  const Toolbar = (
    !isEditing ? (
      <div className={`opacity-0 group-hover:opacity-100 transition flex items-center gap-1 ${isMe ? 'order-first' : ''}`}>
        <div className="relative">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            title="Reaccionar"
            className="px-1.5 py-0.5 rounded hover:bg-black/10 text-xs"
          >
            😊
          </button>
          {pickerOpen && (
            <div
              className="absolute z-10 rounded-lg border shadow-lg p-1 flex items-center gap-1"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border)',
                bottom: '100%',
                right: isMe ? 0 : 'auto',
                left: isMe ? 'auto' : 0,
                marginBottom: 4,
              }}
              onMouseLeave={() => setPickerOpen(false)}
            >
              {ALLOWED_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => { p.onReact(e); setPickerOpen(false) }}
                  className="text-base px-1.5 py-0.5 rounded hover:bg-black/10 transition"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={p.onReply}
          title="Responder"
          className="px-1.5 py-0.5 rounded hover:bg-black/10 text-xs"
        >
          ↩
        </button>
        {canEdit && (
          <button
            onClick={p.onStartEdit}
            title="Editar"
            className="px-1.5 py-0.5 rounded hover:bg-black/10 text-xs"
          >
            ✏️
          </button>
        )}
        {canDelete && (
          <button
            onClick={p.onDelete}
            title="Borrar"
            className="px-1.5 py-0.5 rounded hover:bg-black/10 text-xs text-app-muted hover:text-red-500"
          >
            ✕
          </button>
        )}
      </div>
    ) : null
  )

  return (
    <div className={`group flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${grouped ? '-mt-1' : ''}`}>
      {!isMe && Avatar}
      <div className={`max-w-md flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        {Meta}
        <div className={`flex items-end gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
          {Bubble}
          {Toolbar}
        </div>
        {Reactions}
      </div>
      {isMe && Avatar}
    </div>
  )
}
