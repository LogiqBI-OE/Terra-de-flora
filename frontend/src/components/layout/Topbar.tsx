// Topbar: título de la página a la izquierda, controles a la derecha.
//   Controles: Help · Bell · Theme · UserMenu (avatar + nombre + nivel + chevron)

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBell, IconHelp } from '../icons/Icons'
import IconButton from '../ui/IconButton'
import ThemeToggle from '../ui/ThemeToggle'
import UserMenu from '../ui/UserMenu'
import { useAuth } from '../../lib/auth'
import { usePolling } from '../../lib/usePolling'
import { comentariosApi, type TopbarBadge as TopbarBadgeData } from '../../lib/api'

const POLL_MS = 60000  // 60s — bajado de 30s, polling se pausa cuando pestaña oculta

export default function Topbar({ title }: { title: string }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [badge, setBadge] = useState<TopbarBadgeData | null>(null)

  const eligible = !!user && user.level >= 5

  async function fetchBadge() {
    if (!eligible) return
    try {
      const b = await comentariosApi.getTopbarBadge()
      setBadge(b)
    } catch {/* silencioso */}
  }

  useEffect(() => {
    if (eligible) fetchBadge()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.level])

  usePolling(fetchBadge, POLL_MS, eligible)

  const totalUnread = badge?.total_mensajes ?? 0
  const hasMention = badge?.has_mention ?? false
  const showBell = !!user && user.level >= 5

  return (
    <header
      className="h-14 shrink-0 border-b px-6 flex items-center justify-between"
      style={{
        background: 'var(--bg-elevated-strong)',
        borderColor: 'var(--border-soft)',
      }}
    >
      <h1 className="text-base font-semibold text-app">{title}</h1>

      <div className="flex items-center gap-1">
        <IconButton icon={<IconHelp size={16} />} label="Ayuda · Pronto" />
        {showBell ? (
          <BellWithBadge
            count={totalUnread}
            mention={hasMention}
            onClick={() => navigate('/muro-comentarios')}
          />
        ) : (
          <IconButton icon={<IconBell size={16} />} label="Notificaciones" />
        )}
        <ThemeToggle />
        <div className="ml-1">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

function BellWithBadge({
  count, mention, onClick,
}: { count: number; mention: boolean; onClick: () => void }) {
  const label = count > 0
    ? `${count} mensaje${count === 1 ? '' : 's'} sin leer${mention ? ' · te etiquetaron' : ''}`
    : 'Notificaciones'
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="relative h-9 w-9 rounded-full flex items-center justify-center transition"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <IconBell size={16} />
      {mention ? (
        <span
          className="absolute top-0.5 right-0.5 px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{ background: '#E11D48' }}
        >
          @
        </span>
      ) : count > 0 ? (
        <span
          className="absolute top-0.5 right-0.5 px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
          style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
        >
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </button>
  )
}
