// Dropdown que aparece al hacer click en el avatar.
// Contiene: nombre · email · tipo de cuenta · Log out.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import Avatar from './Avatar'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  cliente: 'Cliente',
}

export default function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
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
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menú de usuario"
        className="rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition"
        style={{
          // ring offset coloured against page bg
          boxShadow: open ? '0 0 0 2px var(--accent)' : 'none',
        }}
      >
        <Avatar name={user.full_name} email={user.email} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-xl border surface-menu z-50 overflow-hidden"
          style={{ borderColor: 'var(--border)' }}
        >
          {/* Header del menú */}
          <div className="px-4 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-soft)' }}>
            <Avatar name={user.full_name} email={user.email} size={42} />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-app truncate">{user.full_name ?? user.email}</div>
              <div className="text-xs text-app-muted truncate">{user.email}</div>
              <div className="text-[10px] uppercase tracking-widest mt-0.5 text-accent font-semibold">
                {ROLE_LABEL[user.role] ?? user.role}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm text-app hover:bg-[var(--bg-hover)] flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
