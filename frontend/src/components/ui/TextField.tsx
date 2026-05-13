// Input de texto con label arriba. Para forms del Catálogos / Usuarios.
import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export default function TextField({ label, hint, className = '', ...rest }: Props) {
  return (
    <label className="block">
      <div className="text-[11px] font-semibold tracking-widest uppercase mb-1 text-app-secondary">{label}</div>
      <input
        {...rest}
        className={`w-full px-3 py-2 rounded-lg border transition text-sm ${className}`}
        style={{
          background: 'var(--bg-input)',
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      />
      {hint && <div className="text-[11px] text-app-muted mt-1">{hint}</div>}
    </label>
  )
}
