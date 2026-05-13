// Página Usuarios: solo nivel 9 (System Admin) ve esto.
// Estructura:
//   - tabla con todos los usuarios (UsuariosTable)
//   - botón "+ Nuevo"
//   - drawer/modal con form para crear/editar (UsuarioFormModal)

import { useEffect, useState } from 'react'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { IconPlus } from '../../components/icons/Icons'
import {
  ApiError,
  catalogApi,
  usersApi,
  type Customer,
  type PermissionsCatalog,
  type UserDetail,
} from '../../lib/api'
import UsuariosTable from './sections/UsuariosTable'
import UsuarioFormModal, { type UserFormValue } from './sections/UsuarioFormModal'

export default function UsuariosPage() {
  const [rows, setRows] = useState<UserDetail[]>([])
  const [catalog, setCatalog] = useState<PermissionsCatalog | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [editing, setEditing] = useState<UserFormValue | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    const [u, c, cs] = await Promise.all([
      usersApi.list(),
      usersApi.catalog(),
      catalogApi.customers(),
    ])
    setRows(u)
    setCatalog(c)
    setCustomers(cs)
  }
  useEffect(() => { reload().catch(() => {}) }, [])

  async function handleSave(value: UserFormValue) {
    setBusy(true)
    setError(null)
    try {
      if (value.id === null) {
        await usersApi.create({
          email: value.email,
          full_name: value.full_name,
          password: value.password,
          level: value.level,
          permissions: value.permissions,
          customer_id: value.customer_id,
        })
      } else {
        await usersApi.update(value.id, {
          full_name: value.full_name,
          password: value.password || undefined,
          level: value.level,
          permissions: value.permissions,
          customer_id: value.customer_id,
          is_active: value.is_active,
        })
      }
      setEditing(null)
      await reload()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Error inesperado.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(row: UserDetail) {
    if (!confirm(`¿Eliminar usuario ${row.email}? Esta acción no se puede deshacer.`)) return
    try {
      await usersApi.delete(row.id)
      await reload()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Error al eliminar')
    }
  }

  function startNew() {
    setError(null)
    setEditing({
      id: null,
      email: '',
      full_name: '',
      password: '',
      level: 2,
      permissions: [],
      customer_id: null,
      is_active: true,
    })
  }

  function startEdit(row: UserDetail) {
    setError(null)
    setEditing({
      id: row.id,
      email: row.email,
      full_name: row.full_name ?? '',
      password: '',
      level: row.level,
      permissions: [...row.permissions],
      customer_id: row.customer_id,
      is_active: row.is_active,
    })
  }

  return (
    <AppShell title="Usuarios">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-app">Usuarios</h2>
            <p className="text-sm text-app-secondary">
              Solo nivel 9 ve esta página. Aquí defines niveles + permisos custom.
            </p>
          </div>
          <Button onClick={startNew}>
            <IconPlus size={14} /> Nuevo usuario
          </Button>
        </div>

        <Card>
          <UsuariosTable rows={rows} customers={customers} onEdit={startEdit} onDelete={handleDelete} />
        </Card>

        {editing && catalog && (
          <UsuarioFormModal
            open
            value={editing}
            onChange={setEditing}
            onSave={handleSave}
            onClose={() => setEditing(null)}
            catalog={catalog}
            customers={customers}
            busy={busy}
            error={error}
          />
        )}
      </div>
    </AppShell>
  )
}
