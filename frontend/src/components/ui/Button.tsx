import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-oleo-green text-oleo-bg hover:bg-oleo-green-dark',
  secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10',
  ghost: 'text-oleo-green hover:underline',
  danger: 'bg-red-500/80 text-white hover:bg-red-500',
}

export default function Button({ variant = 'primary', className = '', children, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
