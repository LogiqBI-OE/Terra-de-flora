// Tabla de usuarios con badge de nivel + acciones edit/delete.

import { IconEdit, IconTrash } from '../../../components/icons/Icons'
import { fmtDateTime } from '../../../lib/format'
import type { UserDetail } from '../../../lib/api'

interface Props {
  rows: UserDetail[]
  onEdit: (row: UserDetail) => void
  onDelete: (row: UserDetail) => void
}

export default function UsuariosTable({ rows, onEdit, onDelete }: Props) {
  if (rows.length === 0) {
    return <div className="text-app-secondary text-sm py-8 text-center">Sin usuarios.</div>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-widest text-app-muted border-b" style={{ borderColor: 'var(--border-soft)' }}>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Nivel</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Permisos</th>
            <th className="px-4 py-3">Activo</th>
            <th className="px-4 py-3">Creado</th>
            <th className="px-4 py-3 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
              <td className="px-4 py-2 text-app font-mono text-xs">{u.email}</td>
              <td className="px-4 py-2 text-app">{u.full_name || '—'}</td>
              <td className="px-4 py-2">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
                  style={{ background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' }}
                >
                  <span className="font-mono">L{u.level}</span>
                  <span>·</span>
                  <span>{u.level_label}</span>
                </span>
              </td>
              <td className="px-4 py-2 text-app-secondary text-xs">{u.customer_id ? `#${u.customer_id}` : '—'}</td>
              <td className="px-4 py-2 text-app-secondary text-xs">
                {u.effective_permissions.length} efectivos
                {u.permissions.length > 0 && <span className="text-accent ml-1">(+{u.permissions.length} custom)</span>}
              </td>
              <td className="px-4 py-2 text-app-secondary text-xs">{u.is_active ? 'Sí' : 'No'}</td>
              <td className="px-4 py-2 text-app-muted text-xs">{fmtDateTime(u.created_at)}</td>
              <td className="px-4 py-2 text-right">
                <button
                  onClick={() => onEdit(u)}
                  aria-label="Editar"
                  className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary"
                >
                  <IconEdit size={14} />
                </button>
                <button
                  onClick={() => onDelete(u)}
                  aria-label="Eliminar"
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
