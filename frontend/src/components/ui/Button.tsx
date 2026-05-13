import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const baseClasses =
  'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed'

export default function Button({ variant = 'primary', className = '', children, disabled, style, ...rest }: Props) {
  const stylesByVariant: Record<Variant, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: 'var(--text-on-accent)' },
    secondary: { background: 'var(--bg-toggle)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
    ghost: { background: 'transparent', color: 'var(--accent-text)' },
    danger: { background: 'var(--danger)', color: 'var(--on-danger)' },
  }
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
      style={{ ...stylesByVariant[variant], ...style }}
      onMouseEnter={(e) => {
        if (disabled) return
        if (variant === 'primary') (e.currentTarget.style.background = 'var(--accent-dark)')
        if (variant === 'secondary') (e.currentTarget.style.background = 'var(--bg-hover)')
        if (variant === 'ghost') (e.currentTarget.style.textDecoration = 'underline')
      }}
      onMouseLeave={(e) => {
        const s = stylesByVariant[variant]
        e.currentTarget.style.background = (s.background as string) ?? ''
        if (variant === 'ghost') e.currentTarget.style.textDecoration = 'none'
      }}
    >
      {children}
    </button>
  )
}
