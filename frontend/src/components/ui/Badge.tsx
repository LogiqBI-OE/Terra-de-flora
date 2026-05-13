import type { ReactNode } from 'react'

type Tone = 'neutral' | 'green' | 'yellow' | 'red' | 'blue'

// Cada tono apunta a tokens semánticos definidos en index.css.
const STYLES: Record<Tone, { background: string; color: string }> = {
  neutral: { background: 'var(--neutral-bg)', color: 'var(--neutral-text)' },
  green: { background: 'var(--accent-bg-soft)', color: 'var(--accent-text)' },
  yellow: { background: 'var(--warning-bg)', color: 'var(--warning)' },
  red: { background: 'var(--danger-bg)', color: 'var(--danger)' },
  blue: { background: 'var(--info-bg)', color: 'var(--info)' },
}

export default function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase"
      style={STYLES[tone]}
    >
      {children}
    </span>
  )
}
