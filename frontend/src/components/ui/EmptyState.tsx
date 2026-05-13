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
    <div
      className="rounded-xl border px-8 py-12 text-center"
      style={{ background: 'var(--bg-card-soft)', borderColor: 'var(--border-soft)' }}
    >
      <h3 className="text-lg font-semibold text-app mb-2">{title}</h3>
      {description && <p className="text-sm text-app-secondary mb-5">{description}</p>}
      {action}
    </div>
  )
}
