// Editor de UN item de SystemConfig.
// Si secret=true, muestra el valor enmascarado con toggle "Mostrar".

import { useState } from 'react'
import type { SystemConfigItem } from '../../../lib/api'

interface Props {
  item: SystemConfigItem
  draft: string
  onChange: (value: string) => void
}

export default function ConfigItemEditor({ item, draft, onChange }: Props) {
  const [show, setShow] = useState(!item.secret)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-app">{item.label}</div>
          <div className="text-xs text-app-muted">{item.description}</div>
        </div>
        <code
          className="text-[10px] px-2 py-0.5 rounded font-mono"
          style={{ background: 'var(--bg-toggle)', color: 'var(--text-muted)' }}
        >
          {item.key}
        </code>
      </div>
      <div className="flex items-center gap-2">
        <input
          type={show ? 'text' : 'password'}
          value={draft}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border text-sm"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        {item.secret && (
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
