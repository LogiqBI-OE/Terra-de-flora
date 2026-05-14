// Tabla de usuarios — fuentes uniformes (text-sm en todo el body).
// Las acciones (editar / reset / eliminar) se deshabilitan cuando el target
// tiene un nivel mayor al del usuario actual.

import { IconEdit, IconTrash } from '../../../components/icons/Icons'
import { fmtDateTime } from '../../../lib/format'
import type { UserDetail } from '../../../lib/api'

interface Props {
  rows: UserDetail[]
  currentUserLevel: number
  currentUserEmail?: string
  onEdit: (row: UserDetail) => void
  onDelete: (row: UserDetail) => void
  onResetPassword: (row: UserDetail) => void
}

function IconResetKey({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

export default function UsuariosTable({
  rows, currentUserLevel, currentUserEmail, onEdit, onDelete, onResetPassword,
}: Props) {
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
          {rows.map((u) => {
            const canManage = currentUserLevel >= u.level
            const isSelf = currentUserEmail !== undefined && u.email.toLowerCase() === currentUserEmail.toLowerCase()
            const canDelete = canManage && !isSelf
            const lockTitle = canManage
              ? undefined
              : `Solo niveles iguales o superiores a L${u.level} pueden gestionar este usuario.`
            return (
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
                    disabled={!canManage}
                    aria-label="Resetear contraseña"
                    title={canManage ? 'Resetear al password estándar' : lockTitle}
                    className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <IconResetKey />
                  </button>
                  <button
                    onClick={() => onEdit(u)}
                    disabled={!canManage}
                    aria-label="Editar"
                    title={canManage ? 'Editar' : lockTitle}
                    className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary ml-1 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <IconEdit size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(u)}
                    disabled={!canDelete}
                    aria-label="Eliminar"
                    title={
                      isSelf
                        ? 'No puedes eliminarte a ti mismo'
                        : canManage ? 'Eliminar' : lockTitle
                    }
                    className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary ml-1 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  >
                    <IconTrash size={14} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
