import { useState } from 'react'
import { useInstallPrompt } from '../lib/pwa/useInstallPrompt'
import { cn } from '../lib/utils'
import { IconDownload } from './icons'

/**
 * "Install app" control. On Chromium (desktop + Android) it fires the native
 * install prompt; where that isn't available (iOS Safari, or a browser that
 * only exposes install via its menu) it reveals manual instructions. Renders
 * nothing once the app is already installed.
 */
export function InstallPrompt({
  variant = 'compact',
  className,
}: {
  variant?: 'compact' | 'full' | 'glass'
  className?: string
}) {
  const { canInstall, installed, promptInstall, isIOS } = useInstallPrompt()
  const [open, setOpen] = useState(false)

  if (installed) return null

  const label = 'Install app'
  const buttonClass = cn(
    variant === 'full' && 'btn btn-primary',
    variant === 'compact' && 'btn btn-secondary',
    variant === 'glass' &&
      'glass-surface inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-white',
    className,
  )
  const labelClass = variant === 'compact' ? 'hidden sm:inline' : undefined

  if (canInstall) {
    return (
      <button type="button" title={label} className={buttonClass} onClick={() => void promptInstall()}>
        <IconDownload width={18} height={18} />
        <span className={labelClass}>{label}</span>
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        title={label}
        aria-expanded={open}
        className={buttonClass}
        onClick={() => setOpen((v) => !v)}
      >
        <IconDownload width={18} height={18} />
        <span className={labelClass}>{label}</span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="How to install"
          className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-500 dark:text-slate-400">
            {isIOS ? (
              <>
                <li>Tap the Share button in Safari.</li>
                <li>Choose “Add to Home Screen”.</li>
              </>
            ) : (
              <>
                <li>Open the browser menu (⋮ / ⋯).</li>
                <li>Choose “Install app” or “Add to Home screen”.</li>
              </>
            )}
          </ol>
        </div>
      )}
    </div>
  )
}
