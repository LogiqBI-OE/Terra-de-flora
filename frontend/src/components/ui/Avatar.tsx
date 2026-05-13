// Avatar circular con iniciales auto-calculadas del nombre/email.

interface Props {
  name?: string | null
  email: string
  size?: number
}

function getInitials(name: string | null | undefined, email: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export default function Avatar({ name, email, size = 36 }: Props) {
  const initials = getInitials(name, email)
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold select-none"
      style={{
        width: size,
        height: size,
        background: 'var(--accent)',
        color: 'var(--text-on-accent)',
        fontSize: size * 0.4,
      }}
      aria-label={name ?? email}
    >
      {initials}
    </div>
  )
}
