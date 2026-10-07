import { cn } from '../lib/utils'
import logoUrl from '../images/home page image.jpg'

/**
 * Brand mark. Uses the product photograph (the same asset as the dashboard
 * background) as a small rounded-square logo. The source is square with a
 * white backdrop, so `object-cover` keeps it undistorted at any size.
 */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <img
      src={logoUrl}
      alt=""
      aria-hidden
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn(
        'shrink-0 rounded-[26%] object-cover ring-1 ring-slate-900/10 dark:ring-white/20',
        className,
      )}
    />
  )
}
