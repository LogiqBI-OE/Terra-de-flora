// Placeholder reusable para tabs que aun no estan construidos.

interface Props {
  emoji: string
  title: string
  description: string
  hint?: string
}

export default function PlaceholderTab({ emoji, title, description, hint }: Props) {
  return (
    <div className="py-16 text-center">
      <div className="text-5xl mb-4 opacity-70">{emoji}</div>
      <h3 className="text-lg font-bold text-app mb-1">{title}</h3>
      <p className="text-sm text-app-secondary max-w-md mx-auto">{description}</p>
      {hint && (
        <div
          className="mt-6 inline-block px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest"
          style={{ background: 'var(--bg-toggle)', color: 'var(--text-secondary)' }}
        >
          {hint}
        </div>
      )}
    </div>
  )
}
