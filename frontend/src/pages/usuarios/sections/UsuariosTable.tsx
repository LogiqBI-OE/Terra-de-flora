// Tabla de usuarios con badge de nivel + acciones edit/delete.
// Fuentes uniformes: text-sm en todo el body excepto fecha (text-xs como metadato).

import { IconEdit, IconTrash } from '../../../components/icons/Icons'
import { fmtDateTime } from '../../../lib/format'
import type { Customer, UserDetail } from '../../../lib/api'

interface Props {
  rows: UserDetail[]
  customers: Customer[]
  onEdit: (row: UserDetail) => void
  onDelete: (row: UserDetail) => void
}

export default function UsuariosTable({ rows, customers, onEdit, onDelete }: Props) {
  const customerById = new Map(customers.map((c) => [c.id, c]))

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
            <th className="px-4 py-3 font-semibold">Email</th>
            <th className="px-4 py-3 font-semibold">Nombre</th>
            <th className="px-4 py-3 font-semibold">Nivel</th>
            <th className="px-4 py-3 font-semibold">Cliente</th>
            <th className="px-4 py-3 font-semibold">Permisos</th>
            <th className="px-4 py-3 font-semibold">Activo</th>
            <th className="px-4 py-3 font-semibold">Creado</th>
            <th className="px-4 py-3 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => {
            const cliente = u.customer_id ? customerById.get(u.customer_id) : null
            return (
              <tr key={u.id} className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
                <td className="px-4 py-3 font-mono text-app">{u.email}</td>
                <td className="px-4 py-3 text-app font-medium">{u.full_name || '—'}</td>
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
                  {cliente ? (
                    <span>
                      <span className="font-mono">{cliente.codigo}</span>
                      <span className="text-app-muted"> · {cliente.nombre}</span>
                    </span>
                  ) : (
                    '—'
                  )}
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
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
