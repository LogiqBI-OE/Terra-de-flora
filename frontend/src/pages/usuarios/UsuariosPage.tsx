// Página Usuarios — solo nivel 9.
// Drawer slide-in para form + tabla con acciones (edit · reset password · delete).

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/layout/AppShell'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { IconHistory, IconPlus } from '../../components/icons/Icons'
import {
  ApiError,
  usersApi,
  type PermissionsCatalog,
  type UserDetail,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import UsuariosTable from './sections/UsuariosTable'
import UsuarioFormDrawer, { type UserFormValue } from './sections/UsuarioFormDrawer'

export default function UsuariosPage() {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const currentLevel = currentUser?.level ?? 0
  const [rows, setRows] = useState<UserDetail[]>([])
  const [catalog, setCatalog] = useState<PermissionsCatalog | null>(null)
  const [editing, setEditing] = useState<UserFormValue | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Catalogo filtrado para el form: solo niveles <= currentLevel
  const scopedCatalog = useMemo<PermissionsCatalog | null>(() => {
    if (!catalog) return null
    return {
      ...catalog,
      levels: catalog.levels.filter((l) => l.level <= currentLevel),
    }
  }, [catalog, currentLevel])

  async function reload() {
    const [u, c] = await Promise.all([usersApi.list(), usersApi.catalog()])
    setRows(u)
    setCatalog(c)
  }
  useEffect(() => { reload().catch(() => {}) }, [])

  function flash(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave(value: UserFormValue) {
    setBusy(true)
    setError(null)
    try {
      if (value.id === null) {
        await usersApi.create({
          email: value.email,
          username: value.username,
          first_name: value.first_name,
          last_name_paterno: value.last_name_paterno || undefined,
          last_name_materno: value.last_name_materno || undefined,
          password: value.password,
          level: value.level,
          permissions: value.permissions,
        })
        flash('Usuario creado')
      } else {
        await usersApi.update(value.id, {
          username: value.username || undefined,
          first_name: value.first_name,
          last_name_paterno: value.last_name_paterno,
          last_name_materno: value.last_name_materno,
          password: value.password || undefined,
          level: value.level,
          permissions: value.permissions,
          is_active: value.is_active,
        })
        flash('Usuario actualizado')
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
      flash('Usuario eliminado')
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Error al eliminar')
    }
  }

  async function handleResetPassword(row: UserDetail) {
    if (!confirm(`¿Resetear contraseña de ${row.email}?\nSe aplicará el password estándar configurado en /configuracion.`)) return
    try {
      await usersApi.resetPassword(row.id)
      flash(`Contraseña de ${row.email} reseteada al standard.`)
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Error al resetear')
    }
  }

  function startNew() {
    setError(null)
    // Default level: el más bajo dentro del scope del actor (típicamente L1 o L2)
    const allowedLevels = (scopedCatalog?.levels ?? []).filter((l) => !l.reserved).map((l) => l.level)
    const defaultLevel = allowedLevels.length > 0 ? Math.min(...allowedLevels) : 1
    setEditing({
      id: null,
      email: '',
      username: '',
      first_name: '',
      last_name_paterno: '',
      last_name_materno: '',
      password: '',
      level: defaultLevel,
      permissions: [],
      is_active: true,
    })
  }

  function startEdit(row: UserDetail) {
    setError(null)
    setEditing({
      id: row.id,
      email: row.email,
      username: row.username ?? '',
      first_name: row.first_name ?? '',
      last_name_paterno: row.last_name_paterno ?? '',
      last_name_materno: row.last_name_materno ?? '',
      password: '',
      level: row.level,
      permissions: [...row.permissions],
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
              Visible desde nivel 5. Cada usuario solo puede gestionar a otros de su nivel para abajo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/usuarios/log')}>
              <IconHistory size={14} /> Log de usuarios
            </Button>
            <Button onClick={startNew}>
              <IconPlus size={14} /> Nuevo usuario
            </Button>
          </div>
        </div>

        <Card>
          <UsuariosTable
            rows={rows}
            currentUserLevel={currentLevel}
            currentUserEmail={currentUser?.email}
            onEdit={startEdit}
            onDelete={handleDelete}
            onResetPassword={handleResetPassword}
          />
        </Card>

        {editing && scopedCatalog && (
          <UsuarioFormDrawer
            open
            value={editing}
            onChange={setEditing}
            onSave={handleSave}
            onClose={() => setEditing(null)}
            catalog={scopedCatalog}
            busy={busy}
            error={error}
          />
        )}

        {toast && (
          <div
            className="fixed bottom-6 right-6 px-4 py-3 rounded-lg text-sm text-app shadow-lg border"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
              zIndex: 200,
            }}
          >
            ✓ {toast}
          </div>
        )}
      </div>
    </AppShell>
  )
}
