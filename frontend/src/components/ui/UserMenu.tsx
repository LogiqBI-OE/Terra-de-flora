// Dropdown del usuario. Trigger ahora es un pill con: avatar + nombre + nivel + chevron.
// Dropdown contiene: nombre completo · email · badge L<nivel> + label · Log out.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { IconChevronDown } from '../icons/Icons'
import Avatar from './Avatar'

function firstName(full: string | null | undefined, email: string): string {
  if (full && full.trim()) return full.trim().split(/\s+/)[0]!
  return email.split('@')[0]!
}

export default function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  if (!user) return null

  function handleLogout() {
    logout()
    setOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger: avatar + nombre + nivel + chevron */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menú de usuario"
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition"
        style={{ background: open ? 'var(--bg-hover)' : 'transparent' }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = 'var(--bg-hover)'
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = 'transparent'
        }}
      >
        <Avatar name={user.full_name} email={user.email} size={32} />
        <div className="text-left leading-tight hidden sm:block">
          <div className="text-xs font-semibold text-app">
            {firstName(user.full_name, user.email)}
          </div>
          <div className="text-[10px] text-app-muted">{user.level_label}</div>
        </div>
        <IconChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-xl border surface-menu z-50 overflow-hidden"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="px-4 py-4 flex items-center gap-3"
            style={{ borderBottom: '1px solid var(--border-soft)' }}
          >
            <Avatar name={user.full_name} email={user.email} size={44} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-app truncate">
                {user.full_name ?? user.email}
              </div>
              <div className="text-xs text-app-muted truncate">{user.email}</div>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-semibold tracking-widest uppercase">
                <span
                  className="px-1.5 py-0.5 rounded font-mono"
                  style={{ background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' }}
                >
                  L{user.level}
                </span>
                <span className="text-app-muted">·</span>
                <span className="text-accent">{user.level_label}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm text-app hover:bg-[var(--bg-hover)] flex items-center gap-2"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
