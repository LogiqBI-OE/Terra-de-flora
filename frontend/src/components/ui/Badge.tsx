import type { ReactNode } from 'react'

type Tone = 'neutral' | 'green' | 'yellow' | 'red' | 'blue'

const bgByTone: Record<Tone, string> = {
  neutral: 'rgba(148, 163, 184, 0.15)',
  green: 'rgba(168, 208, 96, 0.20)',
  yellow: 'rgba(234, 179, 8, 0.15)',
  red: 'rgba(239, 68, 68, 0.15)',
  blue: 'rgba(14, 165, 233, 0.15)',
}

const textByTone: Record<Tone, string> = {
  neutral: 'var(--text-secondary)',
  green: 'var(--accent-text)',
  yellow: '#b45309',
  red: '#b91c1c',
  blue: '#0369a1',
}

export default function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase"
      style={{ background: bgByTone[tone], color: textByTone[tone] }}
    >
      {children}
    </span>
  )
}
