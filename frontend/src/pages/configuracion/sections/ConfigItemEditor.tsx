// Editor de UN item de SystemConfig.
// Si secret=true, muestra el valor enmascarado con toggle "Mostrar".
// Si input_type="number", agrega min=1 y filtra a numerico.

import { useState } from 'react'
import type { SystemConfigItem } from '../../../lib/api'

interface Props {
  item: SystemConfigItem
  draft: string
  onChange: (value: string) => void
}

export default function ConfigItemEditor({ item, draft, onChange }: Props) {
  const [show, setShow] = useState(!item.secret)

  const isBool = item.input_type === 'boolean'
  const inputType =
    item.secret && !show
      ? 'password'
      : item.input_type === 'number'
      ? 'number'
      : item.input_type === 'password'
      ? 'password'
      : 'text'

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-app">{item.label}</div>
          <div className="text-xs text-app-muted">{item.description}</div>
        </div>
        <code
          className="text-[10px] px-2 py-0.5 rounded font-mono shrink-0 mt-0.5"
          style={{ background: 'var(--bg-toggle)', color: 'var(--text-muted)' }}
        >
          {item.key}
        </code>
      </div>
      <div className="flex items-center gap-2">
        {isBool ? (
          <label className="inline-flex items-center gap-2 text-sm text-app cursor-pointer">
            <input
              type="checkbox"
              checked={draft === 'true'}
              onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
              className="w-4 h-4"
              style={{ accentColor: 'var(--accent)' }}
            />
            <span>{draft === 'true' ? 'Activado' : 'Apagado'}</span>
          </label>
        ) : (
          <input
            type={inputType}
            value={draft}
            onChange={(e) => onChange(e.target.value)}
            min={item.input_type === 'number' ? 1 : undefined}
            className="w-full max-w-sm px-3 py-2 rounded-lg border text-sm"
            style={{
              background: 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        )}
        {item.secret && !isBool && (
          <button
            onClick={() => setShow((v) => !v)}
            className="text-xs text-app-secondary hover:text-app px-2 py-1"
          >
            {show ? 'Ocultar' : 'Mostrar'}
          </button>
        )}
      </div>
    </div>
  )
}
