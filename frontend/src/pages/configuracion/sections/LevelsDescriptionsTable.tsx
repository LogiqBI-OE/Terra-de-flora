// Sub-componente: tabla de 9 niveles con label + descripción editables.
// Nueva columna "Visible" (checkbox) controla is_reserved (invertido).
// is_reserved=true  → checkbox unchecked → badge "oculto"
// is_reserved=false → checkbox checked

import type { LevelDetail } from '../../../lib/api'

interface Props {
  levels: LevelDetail[]
  drafts: Record<number, LevelDetail>
  onChange: (level: number, field: 'label' | 'description' | 'is_reserved', value: string | boolean) => void
}

export default function LevelsDescriptionsTable({ levels, drafts, onChange }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-soft)' }}>
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-left text-[11px] uppercase tracking-widest text-app-muted border-b"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <th className="px-4 py-2 w-16 font-semibold">Nivel</th>
            <th className="px-4 py-2 w-20 font-semibold text-center">Visible</th>
            <th className="px-4 py-2 w-56 font-semibold">Label</th>
            <th className="px-4 py-2 font-semibold">Descripción</th>
          </tr>
        </thead>
        <tbody>
          {levels.map((l) => {
            const draft = drafts[l.level] ?? l
            const isHidden = draft.is_reserved
            return (
              <tr
                key={l.level}
                className="border-b"
                style={{
                  borderColor: 'var(--border-soft)',
                  opacity: isHidden ? 0.55 : 1,
                }}
              >
                <td className="px-4 py-2">
                  <span
                    className="inline-block px-2 py-0.5 rounded text-xs font-semibold font-mono"
                    style={{
                      background: isHidden ? 'var(--bg-toggle)' : 'var(--accent-bg-soft)',
                      color: isHidden ? 'var(--text-muted)' : 'var(--accent-text)',
                    }}
                  >
                    L{l.level}
                  </span>
                  {isHidden && (
                    <span className="ml-2 text-[10px] uppercase tracking-widest text-warning">oculto</span>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={!draft.is_reserved}
                    onChange={(e) => onChange(l.level, 'is_reserved', !e.target.checked)}
                    style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    value={draft.label}
                    onChange={(e) => onChange(l.level, 'label', e.target.value)}
                    className="w-full px-2 py-1 rounded border text-sm"
                    style={{
                      background: 'var(--bg-input)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    value={draft.description}
                    onChange={(e) => onChange(l.level, 'description', e.target.value)}
                    placeholder="¿Quién es este nivel? ¿Qué hace?"
                    className="w-full px-2 py-1 rounded border text-sm"
                    style={{
                      background: 'var(--bg-input)',
                      borderColor: 'var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
