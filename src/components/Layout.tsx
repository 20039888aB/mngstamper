import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
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
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98]',
    isActive
      ? 'bg-brand-gradient text-white shadow-sm shadow-brand-900/30'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  )
}

function PrivacyPill() {
  const { prefs } = usePreferences()
  const local = prefs.processLocally
  return (
    <span
      className={cn(
        'hidden items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset sm:inline-flex',
        local
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-400/20'
          : 'bg-amber-50 text-amber-700 ring-amber-600/15 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-400/20',
      )}
      title={local ? t('privacy.localOn') : t('privacy.localOff')}
    >
      <IconShield width={14} height={14} />
      {local ? 'Local processing' : 'Server may be used'}
    </span>
  )
}

export function Layout() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)

  // Elevate the header only once the user scrolls — a quieter, premium feel.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="flex min-h-full flex-col">
      <header
        className={cn(
          'sticky top-0 z-20 border-b transition-all duration-300',
          scrolled
            ? 'border-slate-200/80 bg-white/80 shadow-header-scrolled backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/75'
            : 'border-transparent bg-white/50 backdrop-blur-md dark:bg-slate-950/40',
        )}
      >
        {/* Brand accent hairline across the very top. */}
        <div className="absolute inset-x-0 top-0 h-px bg-brand-gradient opacity-70" />
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <NavLink to="/" className="group flex items-center gap-2.5 text-brand-700 dark:text-brand-300">
            <span className="transition-transform duration-300 group-hover:scale-105">
              <Logo size={30} />
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
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
        {/* Re-mount on route change so each page plays its entrance motion. */}
        <div key={pathname} className="animate-fade-in-up">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar (mobile-first, spec section 21). */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80 md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary"
      >
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
                isActive ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute inset-x-3 top-0 h-0.5 rounded-full bg-brand-gradient transition-opacity duration-300',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <Icon width={20} height={20} />
                <span className="max-w-[64px] truncate">{label.split(' ')[0]}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
