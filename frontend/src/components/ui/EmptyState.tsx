import type { ReactNode } from 'react'

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/5 px-8 py-12 text-center" style={{ background: 'rgba(19,26,15,0.4)' }}>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-400 mb-5">{description}</p>}
      {action}
    </div>
  )
}
