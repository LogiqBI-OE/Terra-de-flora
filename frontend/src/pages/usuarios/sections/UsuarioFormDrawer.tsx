// Drawer (slide-in derecha) para crear/editar usuario.
// 3 tabs:
//   · Datos generales — email, nombre(s), apellidos, nivel
//   · Permisos       — switches (defaults del nivel locked + custom)
//   · Contraseña     — password (al crear) o cambiar pwd (al editar)

import { useState } from 'react'
import Drawer from '../../../components/ui/Drawer'
import Button from '../../../components/ui/Button'
import TextField from '../../../components/ui/TextField'
import Tabs from '../../../components/ui/Tabs'
import type { PermissionsCatalog } from '../../../lib/api'

export interface UserFormValue {
  id: number | null
  email: string
  first_name: string
  last_name_paterno: string
  last_name_materno: string
  password: string
  level: number
  permissions: string[]
  is_active: boolean
}

interface Props {
  open: boolean
  value: UserFormValue
  onChange: (v: UserFormValue) => void
  onSave: (v: UserFormValue) => void
  onClose: () => void
  catalog: PermissionsCatalog
  busy: boolean
  error: string | null
}

type TabKey = 'datos' | 'permisos' | 'password'

export default function UsuarioFormDrawer({
  open, value, onChange, onSave, onClose, catalog, busy, error,
}: Props) {
  const [tab, setTab] = useState<TabKey>('datos')
  const isCreate = value.id === null

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'datos', label: 'Datos generales' },
    { key: 'permisos', label: 'Permisos' },
    { key: 'password', label: isCreate ? 'Contraseña' : 'Cambiar contraseña' },
  ]

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isCreate ? 'Nuevo usuario' : `Editar ${value.email}`}
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(value)} disabled={busy}>
            {busy ? 'Guardando...' : isCreate ? 'Crear' : 'Guardar'}
          </Button>
        </>
      }
    >
      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="pt-5">
        {tab === 'datos' && (
          <DatosTab value={value} onChange={onChange} catalog={catalog} isCreate={isCreate} />
        )}
        {tab === 'permisos' && (
          <PermisosTab value={value} onChange={onChange} catalog={catalog} />
        )}
        {tab === 'password' && (
          <PasswordTab value={value} onChange={onChange} isCreate={isCreate} />
        )}
      </div>

      {error && <div className="text-xs text-danger mt-4">{error}</div>}
    </Drawer>
  )
}

// ── Tab: Datos generales ─────────────────────────────────────────────────────
function DatosTab({
  value, onChange, catalog, isCreate,
}: {
  value: UserFormValue
  onChange: (v: UserFormValue) => void
  catalog: PermissionsCatalog
  isCreate: boolean
}) {
  return (
    <div className="space-y-4">
      <TextField
        label="Correo"
        type="email"
        value={value.email}
        disabled={!isCreate}
        onChange={(e) => onChange({ ...value, email: e.target.value })}
        placeholder="usuario@oleolab.com"
      />
      <TextField
        label="Nombre(s)"
        value={value.first_name}
        onChange={(e) => onChange({ ...value, first_name: e.target.value })}
        placeholder="Juan Carlos"
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Apellido paterno"
          value={value.last_name_paterno}
          onChange={(e) => onChange({ ...value, last_name_paterno: e.target.value })}
          placeholder="Pérez"
        />
        <TextField
          label="Apellido materno"
          value={value.last_name_materno}
          onChange={(e) => onChange({ ...value, last_name_materno: e.target.value })}
          placeholder="López"
        />
      </div>
      <div>
        <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">
          Nivel de usuario
        </div>
        <select
          value={value.level}
          onChange={(e) => onChange({ ...value, level: Number(e.target.value), permissions: [] })}
          className="w-full px-3 py-2 rounded-lg border text-sm"
          style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          {/* Niveles ocultos (reserved=true) NO se muestran como opción */}
          {catalog.levels.filter((l) => !l.reserved).map((l) => (
            <option key={l.level} value={l.level}>
              L{l.level} · {l.label}
            </option>
          ))}
        </select>
        <div className="text-[11px] text-app-muted mt-1">
          El nivel define los permisos default. Puedes prender extras en la pestaña Permisos.
        </div>
      </div>

      {!isCreate && (
        <label className="flex items-center gap-2 text-sm text-app pt-2">
          <input
            type="checkbox"
            checked={value.is_active}
            onChange={(e) => onChange({ ...value, is_active: e.target.checked })}
            style={{ accentColor: 'var(--accent)' }}
          />
          Usuario activo
        </label>
      )}
    </div>
  )
}

// ── Tab: Permisos ────────────────────────────────────────────────────────────
function PermisosTab({
  value, onChange, catalog,
}: {
  value: UserFormValue
  onChange: (v: UserFormValue) => void
  catalog: PermissionsCatalog
}) {
  const defaultsForLevel = new Set(catalog.defaults_by_level[value.level] ?? [])
  const isRestricted = (p: string) => catalog.restricted.includes(p)
  const isChecked = (p: string) => defaultsForLevel.has(p) || value.permissions.includes(p)

  function toggle(p: string) {
    if (defaultsForLevel.has(p)) return
    if (value.permissions.includes(p)) {
      onChange({ ...value, permissions: value.permissions.filter((x) => x !== p) })
    } else {
      onChange({ ...value, permissions: [...value.permissions, p] })
    }
  }

  return (
    <div>
      <div className="text-xs text-app-muted mb-3">
        Los <em>default</em> vienen del nivel L{value.level} y no se pueden apagar aquí. Para apagar uno, baja el nivel.
      </div>
      <div className="space-y-1">
        {catalog.permissions.map((p) => {
          const isDefault = defaultsForLevel.has(p)
          const checked = isChecked(p)
          const restricted = isRestricted(p) && value.level < 9
          return (
            <label
              key={p}
              className={`flex items-center justify-between px-3 py-2 rounded-lg ${restricted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--bg-hover)]'}`}
            >
              <span className="text-sm text-app font-mono">{p}</span>
              <div className="flex items-center gap-2">
                {isDefault && (
                  <span className="text-[9px] uppercase tracking-widest text-app-muted">default</span>
                )}
                {restricted && (
                  <span className="text-[9px] uppercase tracking-widest text-warning">solo L9</span>
                )}
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isDefault || restricted}
                  onChange={() => toggle(p)}
                  style={{ accentColor: 'var(--accent)' }}
                />
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

// ── Tab: Contraseña ──────────────────────────────────────────────────────────
function PasswordTab({
  value, onChange, isCreate,
}: {
  value: UserFormValue
  onChange: (v: UserFormValue) => void
  isCreate: boolean
}) {
  return (
    <div className="space-y-3">
      <div className="text-xs text-app-muted">
        {isCreate
          ? 'Define la contraseña inicial del usuario.'
          : 'Deja en blanco para no cambiar la contraseña actual.'}
      </div>
      <TextField
        label={isCreate ? 'Contraseña' : 'Nueva contraseña'}
        type="password"
        value={value.password}
        onChange={(e) => onChange({ ...value, password: e.target.value })}
        placeholder="••••••••"
      />
      {!isCreate && (
        <div className="text-[11px] text-app-muted">
          Tip: desde la tabla puedes resetear directo al <strong>standard password</strong> sin
          escribir nada (ver “Configuración general”).
        </div>
      )}
    </div>
  )
}
