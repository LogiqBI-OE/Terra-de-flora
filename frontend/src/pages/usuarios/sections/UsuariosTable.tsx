// Tabla de usuarios — fuentes uniformes (text-sm en todo el body).
// Sin columna Cliente (eso vivirá en otra vista). Botón de reset password.

import { IconEdit, IconTrash } from '../../../components/icons/Icons'
import { fmtDateTime } from '../../../lib/format'
import type { UserDetail } from '../../../lib/api'

interface Props {
  rows: UserDetail[]
  onEdit: (row: UserDetail) => void
  onDelete: (row: UserDetail) => void
  onResetPassword: (row: UserDetail) => void
}

// Icono inline "candado/refresh" para reset password
function IconResetKey({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

export default function UsuariosTable({ rows, onEdit, onDelete, onResetPassword }: Props) {
  if (rows.length === 0) {
    return <div className="text-app-secondary text-sm py-8 text-center">Sin usuarios.</div>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-left text-[11px] uppercase tracking-widest text-app-muted border-b"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <th className="px-4 py-3 font-semibold">Correo</th>
            <th className="px-4 py-3 font-semibold">Usuario</th>
            <th className="px-4 py-3 font-semibold">Nombre</th>
            <th className="px-4 py-3 font-semibold">Nivel</th>
            <th className="px-4 py-3 font-semibold">Permisos</th>
            <th className="px-4 py-3 font-semibold">Activo</th>
            <th className="px-4 py-3 font-semibold">Creado</th>
            <th className="px-4 py-3 w-32"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
              <td className="px-4 py-3 text-app">{u.email}</td>
              <td className="px-4 py-3 text-app-secondary font-mono text-xs">{u.username ?? '—'}</td>
              <td className="px-4 py-3 text-app">{u.full_name || '—'}</td>
              <td className="px-4 py-3">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
                  style={{ background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' }}
                >
                  <span className="font-mono">L{u.level}</span>
                  <span>·</span>
                  <span>{u.level_label}</span>
                </span>
              </td>
              <td className="px-4 py-3 text-app-secondary">
                {u.effective_permissions.length} efectivos
                {u.permissions.length > 0 && (
                  <span className="text-accent ml-1">(+{u.permissions.length} custom)</span>
                )}
              </td>
              <td className="px-4 py-3 text-app-secondary">{u.is_active ? 'Sí' : 'No'}</td>
              <td className="px-4 py-3 text-xs text-app-muted">{fmtDateTime(u.created_at)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <button
                  onClick={() => onResetPassword(u)}
                  aria-label="Resetear contraseña"
                  title="Resetear al password estándar"
                  className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary"
                >
                  <IconResetKey />
                </button>
                <button
                  onClick={() => onEdit(u)}
                  aria-label="Editar"
                  title="Editar"
                  className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary ml-1"
                >
                  <IconEdit size={14} />
                </button>
                <button
                  onClick={() => onDelete(u)}
                  aria-label="Eliminar"
                  title="Eliminar"
                  className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary ml-1"
                >
                  <IconTrash size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
