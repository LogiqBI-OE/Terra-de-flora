// Tab Comentarios — mockup de chat por proyecto. No persiste todavia.

import { useState } from 'react'
import { useAuth } from '../../../lib/auth'
import type { ProyectoRow } from '../../../lib/api'

interface Message {
  id: number
  author: string
  authorInitials: string
  text: string
  timestamp: string
  isMe: boolean
}

function buildMockMessages(currentUserName: string, currentInitials: string): Message[] {
  return [
    {
      id: 1, author: 'Ana Torres', authorInitials: 'AT',
      text: 'Hola equipo, ya tengo la propuesta inicial del evento. La subo al folio en un rato.',
      timestamp: '10:14', isMe: false,
    },
    {
      id: 2, author: 'Luis Garza', authorInitials: 'LG',
      text: 'Perfecto Ana, ¿llegaste a hablar con la cliente sobre los centros de mesa?',
      timestamp: '10:18', isMe: false,
    },
    {
      id: 3, author: 'Ana Torres', authorInitials: 'AT',
      text: 'Sí. Quiere mantener la paleta amarillo/rosa con base blanca. Confirma que serán 8 mesas redondas + mesa de honor imperial.',
      timestamp: '10:20', isMe: false,
    },
    {
      id: 4, author: currentUserName, authorInitials: currentInitials,
      text: '¿Ya está la receta de centro redondo actualizada? Si no, agenda una rápida hoy y la dejamos lista.',
      timestamp: '10:24', isMe: true,
    },
    {
      id: 5, author: 'Ana Torres', authorInitials: 'AT',
      text: 'Voy ahora. Me confirmas si hay cambio de Lisianthus por algo más barato? El presupuesto está apretado.',
      timestamp: '10:27', isMe: false,
    },
    {
      id: 6, author: currentUserName, authorInitials: currentInitials,
      text: 'Te paso opciones después de comer. Pedido provisional viene de Chiltepec esta semana.',
      timestamp: '10:30', isMe: true,
    },
    {
      id: 7, author: 'Carolina Moreno', authorInitials: 'CM',
      text: '📸 Adjunto: moodboard_v2.pdf (3.2 MB)',
      timestamp: '11:02', isMe: false,
    },
  ]
}

interface Props {
  proyecto: ProyectoRow
}

export default function ComentariosTab({ proyecto: _proyecto }: Props) {
  const { user } = useAuth()
  const currentName = user?.full_name || user?.email?.split('@')[0] || 'Tú'
  const currentInitials = currentName
    .split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase() || 'TÚ'

  const [messages] = useState<Message[]>(() => buildMockMessages(currentName, currentInitials))
  const [draft, setDraft] = useState('')

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] min-h-[500px]">
      {/* Lista de mensajes */}
      <div
        className="flex-1 overflow-y-auto px-2 py-4 space-y-4 rounded-t-xl border"
        style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-soft)' }}
      >
        {messages.map((m, i) => {
          const prev = i > 0 ? messages[i - 1] : null
          const groupWithPrev = prev && prev.author === m.author
          return (
            <MessageRow key={m.id} m={m} groupWithPrev={!!groupWithPrev} />
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
            if (e.key === 'Enter' && draft.trim()) {
              setDraft('')  // mockup: no persiste
            }
          }}
        />
        <button
          onClick={() => setDraft('')}
          disabled={!draft.trim()}
          className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
        >
          Enviar
        </button>
      </div>

      <div className="text-[11px] text-app-muted mt-2 text-center">
        💬 Vista de prueba — los mensajes aún no se guardan. Próximamente: chat en tiempo real con notificaciones.
      </div>
    </div>
  )
}

function MessageRow({ m, groupWithPrev }: { m: Message; groupWithPrev: boolean }) {
  if (m.isMe) {
    return (
      <div className={`flex justify-end items-end gap-2 ${groupWithPrev ? '-mt-2' : ''}`}>
        <div className="max-w-md">
          {!groupWithPrev && (
            <div className="text-[10px] uppercase tracking-widest text-app-muted text-right mb-1 mr-1">
              {m.author} · {m.timestamp}
            </div>
          )}
          <div
            className="rounded-2xl rounded-br-sm px-3 py-2 text-sm"
            style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
          >
            {m.text}
          </div>
        </div>
        {!groupWithPrev ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' }}
          >
            {m.authorInitials}
          </div>
        ) : (
          <div className="w-8 shrink-0" />
        )}
      </div>
    )
  }
  return (
    <div className={`flex justify-start items-end gap-2 ${groupWithPrev ? '-mt-2' : ''}`}>
      {!groupWithPrev ? (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
          style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
        >
          {m.authorInitials}
        </div>
      ) : (
        <div className="w-8 shrink-0" />
      )}
      <div className="max-w-md">
        {!groupWithPrev && (
          <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1 ml-1">
            {m.author} · {m.timestamp}
          </div>
        )}
        <div
          className="rounded-2xl rounded-bl-sm px-3 py-2 text-sm border"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-soft)' }}
        >
          {m.text}
        </div>
      </div>
    </div>
  )
}
