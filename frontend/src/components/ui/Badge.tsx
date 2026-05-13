import type { ReactNode } from 'react'

type Tone = 'neutral' | 'green' | 'yellow' | 'red' | 'blue'

const tones: Record<Tone, string> = {
  neutral: 'bg-white/10 text-slate-300',
  green: 'bg-oleo-green/20 text-oleo-green',
  yellow: 'bg-yellow-500/15 text-yellow-300',
  red: 'bg-red-500/15 text-red-300',
  blue: 'bg-sky-500/15 text-sky-300',
}

export default function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${tones[tone]}`}>
      {children}
    </span>
  )
}
