// Sub-sección de NivelesTab: matriz de checkbox permiso × nivel.
// Filas = permisos (cada uno con su nombre). Columnas = niveles (L9 → L1).

import type { LevelsPayload } from '../../../lib/api'

interface Props {
  payload: LevelsPayload
  matrix: Record<number, string[]>
  onToggle: (level: number, permission: string) => void
}

export default function LevelsPermissionsMatrix({ payload, matrix, onToggle }: Props) {
  const restricted = new Set(payload.restricted)

  function isChecked(level: number, perm: string) {
    return (matrix[level] ?? []).includes(perm)
  }

  function isDisabled(level: number, perm: string) {
    // manage_users solo para L9
    return restricted.has(perm) && level < 9
  }

  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-soft)' }}>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr
            className="text-left text-[11px] uppercase tracking-widest text-app-muted border-b"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <th className="px-4 py-2 font-semibold sticky left-0 z-10" style={{ background: 'var(--bg-card)' }}>
              Permiso
            </th>
            {payload.levels.map((l) => (
              <th key={l.level} className="px-2 py-2 text-center font-semibold whitespace-nowrap">
                <div className="font-mono">L{l.level}</div>
                <div className="text-[9px] normal-case text-app-faint">{l.label}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payload.permissions.map((p) => (
            <tr key={p} className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
              <td
                className="px-4 py-2 font-mono text-app sticky left-0 z-10"
                style={{ background: 'var(--bg-card)' }}
              >
                {p}
                {restricted.has(p) && (
                  <span className="ml-2 text-[10px] uppercase tracking-widest text-warning">solo L9</span>
                )}
              </td>
              {payload.levels.map((l) => {
                const checked = isChecked(l.level, p)
                const disabled = isDisabled(l.level, p)
                return (
                  <td key={l.level} className="px-2 py-2 text-center border-l" style={{ borderColor: 'var(--border-soft)' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => onToggle(l.level, p)}
                      style={{ accentColor: 'var(--accent)', cursor: disabled ? 'not-allowed' : 'pointer' }}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
