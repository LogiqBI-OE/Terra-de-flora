// Modal de Nuevo/Editar usuario.
// Recibe el catálogo de niveles+permisos del backend (sin hardcoded).

import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import TextField from '../../../components/ui/TextField'
import type { Customer, PermissionsCatalog } from '../../../lib/api'

export interface UserFormValue {
  id: number | null
  email: string
  full_name: string
  password: string
  level: number
  permissions: string[]
  customer_id: number | null
  is_active: boolean
}

interface Props {
  open: boolean
  value: UserFormValue
  onChange: (v: UserFormValue) => void
  onSave: (v: UserFormValue) => void
  onClose: () => void
  catalog: PermissionsCatalog
  customers: Customer[]
  busy: boolean
  error: string | null
}

export default function UsuarioFormModal({
  open, value, onChange, onSave, onClose, catalog, customers, busy, error,
}: Props) {
  const defaultsForLevel = new Set(catalog.defaults_by_level[value.level] ?? [])
  const isRestricted = (p: string) => catalog.restricted.includes(p)
  // permisos efectivos = defaults del nivel ∪ custom seleccionados
  const isChecked = (p: string) => defaultsForLevel.has(p) || value.permissions.includes(p)

  function togglePermission(p: string) {
    // Si está en defaults del nivel, lo "apagamos" añadiéndolo a un "negados" futuro?
    // Por simplicidad: si está marcado por default, no se permite desmarcar (queda visible read-only).
    // Si NO está en defaults, se añade/quita como custom.
    if (defaultsForLevel.has(p)) return
    if (value.permissions.includes(p)) {
      onChange({ ...value, permissions: value.permissions.filter((x) => x !== p) })
    } else {
      onChange({ ...value, permissions: [...value.permissions, p] })
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={value.id === null ? 'Nuevo usuario' : `Editar ${value.email}`}
      width={560}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(value)} disabled={busy}>
            {busy ? 'Guardando...' : 'Guardar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Email"
            value={value.email}
            disabled={value.id !== null}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder="usuario@oleolab.com"
          />
          <TextField
            label="Nombre completo"
            value={value.full_name}
            onChange={(e) => onChange({ ...value, full_name: e.target.value })}
            placeholder="Juan Pérez"
          />
        </div>

        <TextField
          label={value.id === null ? 'Contraseña' : 'Contraseña (dejar en blanco para no cambiar)'}
          type="password"
          value={value.password}
          onChange={(e) => onChange({ ...value, password: e.target.value })}
          placeholder="••••••••"
        />

        {/* Nivel */}
        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">Nivel</div>
          <select
            value={value.level}
            onChange={(e) => onChange({ ...value, level: Number(e.target.value), permissions: [] })}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            {catalog.levels.map((l) => (
              <option key={l.level} value={l.level} disabled={l.reserved}>
                L{l.level} · {l.label}{l.reserved ? ' (reservado)' : ''}
              </option>
            ))}
          </select>
          <div className="text-[11px] text-app-muted mt-1">
            El nivel determina los permisos por default. Puedes prender extras abajo.
          </div>
        </div>

        {/* Customer (solo si nivel ≤ 2 y sin view_all_customers) */}
        {value.level <= 2 && !isChecked('view_all_customers') && (
          <div>
            <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">Customer asociado</div>
            <select
              value={value.customer_id ?? ''}
              onChange={(e) => onChange({ ...value, customer_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            >
              <option value="">— Ninguno —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Permisos */}
        <div>
          <div className="text-[11px] font-semibold tracking-widest uppercase mb-2 text-app-secondary">
            Permisos {`(L${value.level} default + custom)`}
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
                      onChange={() => togglePermission(p)}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                  </div>
                </label>
              )
            })}
          </div>
          <div className="text-[11px] text-app-muted mt-2">
            Los <em>default</em> vienen del nivel y no se pueden apagar aquí. Para apagar uno, baja el nivel del usuario.
          </div>
        </div>

        {/* Activo */}
        {value.id !== null && (
          <label className="flex items-center gap-2 text-sm text-app">
            <input
              type="checkbox"
              checked={value.is_active}
              onChange={(e) => onChange({ ...value, is_active: e.target.checked })}
              style={{ accentColor: 'var(--accent)' }}
            />
            Usuario activo
          </label>
        )}

        {error && <div className="text-xs text-danger">{error}</div>}
      </div>
    </Modal>
  )
}
