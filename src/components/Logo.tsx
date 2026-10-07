import { cn } from '../lib/utils'

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <path
        d="M20 14h18l8 8v22a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3z"
        fill="#fff"
      />
      <path d="M38 14l8 8h-8z" fill="#bfdbfe" />
      <g fill="#1e40af">
        <rect x="17" y="46" width="24" height="4" rx="1" />
        <rect x="22" y="34" width="14" height="9" rx="2" />
        <rect x="27" y="28" width="4" height="7" />
        <circle cx="29" cy="26" r="3" />
      </g>
    </svg>
  )
}
