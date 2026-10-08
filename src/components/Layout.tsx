import { NavLink, Outlet } from 'react-router-dom'
import { usePreferences } from '../context/PreferencesContext'
import { t } from '../i18n'
import { cn } from '../lib/utils'
import { Logo } from './Logo'
import { InstallPrompt } from './InstallPrompt'
import { ThemeToggle } from './ThemeToggle'
import {
  IconDocument,
  IconHistory,
  IconSettings,
  IconStamp,
  IconShield,
} from './icons'

const NAV = [
  { to: '/', label: t('nav.dashboard'), Icon: IconDocument, end: true },
  { to: '/stamp', label: t('nav.stamp'), Icon: IconStamp, end: false },
  { to: '/design', label: t('nav.design'), Icon: IconStamp, end: false },
  { to: '/history', label: t('nav.history'), Icon: IconHistory, end: false },
  { to: '/settings', label: t('nav.settings'), Icon: IconSettings, end: false },
]

function navClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  )
}

function PrivacyPill() {
  const { prefs } = usePreferences()
  const local = prefs.processLocally
  return (
    <span
      className={cn(
        'hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium sm:inline-flex',
        local
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
          : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      )}
      title={local ? t('privacy.localOn') : t('privacy.localOff')}
    >
      <IconShield width={14} height={14} />
      {local ? 'Local processing' : 'Server may be used'}
    </span>
  )
}

export function Layout() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2.5 text-brand-700 dark:text-brand-300">
            <Logo size={30} />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
                Universal Rubber Stamp
              </span>
              <span className="block text-xs leading-tight text-slate-500 dark:text-slate-400">
                {t('app.tagline')}
              </span>
            </span>
          </NavLink>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={navClass}>
                <Icon width={18} height={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-3">
            <InstallPrompt />
            <PrivacyPill />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom tab bar (mobile-first, spec section 21). */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 md:hidden"
        aria-label="Primary"
      >
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                isActive
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-slate-500 dark:text-slate-400',
              )
            }
          >
            <Icon width={20} height={20} />
            <span className="max-w-[64px] truncate">{label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
