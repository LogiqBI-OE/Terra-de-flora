// Tabla genérica para los CRUD del catálogo.
// Recibe columnas + filas + acciones (edit, delete).
// La lógica de crear/editar vive en cada Tab (que usa este componente).

import type { ReactNode } from 'react'
import { IconEdit, IconTrash } from '../../../components/icons/Icons'

export interface Column<T> {
  header: string
  cell: (row: T) => ReactNode
  align?: 'left' | 'right'
  width?: string
}

interface Props<T extends { id: number }> {
  rows: T[]
  columns: Column<T>[]
  onEdit: (row: T) => void
  onDelete: (row: T) => void
  empty?: ReactNode
}

export default function CrudTable<T extends { id: number }>({
  rows,
  columns,
  onEdit,
  onDelete,
  empty,
}: Props<T>) {
  if (rows.length === 0) {
    return (
      <div className="text-app-secondary text-sm py-8 text-center">
        {empty ?? 'Sin registros.'}
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-widest text-app-muted border-b" style={{ borderColor: 'var(--border-soft)' }}>
            {columns.map((c) => (
              <th
                key={c.header}
                className="px-3 py-3"
                style={{ textAlign: c.align ?? 'left', width: c.width }}
              >
                {c.header}
              </th>
            ))}
            <th className="px-3 py-3 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
              {columns.map((c) => (
                <td
                  key={c.header}
                  className="px-3 py-2 text-app"
                  style={{ textAlign: c.align ?? 'left' }}
                >
                  {c.cell(row)}
                </td>
              ))}
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => onEdit(row)}
                  aria-label="Editar"
                  className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-[var(--bg-hover)] text-app-secondary"
                >
                  <IconEdit size={14} />
                </button>
                <button
                  onClick={() => onDelete(row)}
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
