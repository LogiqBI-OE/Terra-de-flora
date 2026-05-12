export default function SproutIcon({ size = 34, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M32 56 V34" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M32 36 C 22 36, 14 28, 14 16 C 26 16, 32 22, 32 34 Z" fill="currentColor" />
      <path d="M32 36 C 42 36, 50 28, 50 16 C 38 16, 32 22, 32 34 Z" fill="currentColor" opacity="0.85" />
    </svg>
  )
}
