import { Link } from 'react-router-dom'
import { InstallPrompt } from '../components/InstallPrompt'
import { StampPreview } from '../components/StampPreview'
import {
  IconDocument,
  IconHistory,
  IconSettings,
  IconStamp,
} from '../components/icons'
import { useHistory } from '../context/HistoryContext'
import { useTemplates } from '../context/TemplatesContext'
import { t } from '../i18n'
import dashboardBg from '../images/home page image.jpg'

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  const days = Math.round(hrs / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}

const ACTIONS = [
  {
    to: '/stamp',
    label: t('nav.stamp'),
    desc: 'Upload a PDF and place stamps on any page.',
    Icon: IconDocument,
    accent: 'bg-brand-500/25 text-brand-50',
  },
  {
    to: '/design',
    label: t('nav.design'),
    desc: 'Craft reusable stamps and save them as templates.',
    Icon: IconStamp,
    accent: 'bg-emerald-500/25 text-emerald-50',
  },
  {
    to: '/history',
    label: t('nav.history'),
    desc: 'Review what you have stamped on this device.',
    Icon: IconHistory,
    accent: 'bg-amber-500/25 text-amber-50',
  },
  {
    to: '/settings',
    label: t('nav.settings'),
    desc: 'Tune defaults, appearance, and privacy.',
    Icon: IconSettings,
    accent: 'bg-slate-400/25 text-slate-50',
  },
]

export function DashboardPage() {
  const { entries } = useHistory()
  const { builtin } = useTemplates()
  const recent = entries.slice(0, 5)

  return (
    <div className="relative isolate overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
      {/* Background photograph, shown in full and centered on a light surround
          that blends with the image's own white backdrop (no crop, even fit). */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white via-slate-100 to-slate-300">
        <img
          src={dashboardBg}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-contain object-center"
        />
        <div className="absolute inset-0 bg-slate-900/5" />
      </div>

      <div className="space-y-6 p-5 sm:p-8">
        {/* Hero */}
        <section className="glass-surface glass-surface-soft p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl">
            {t('app.name')}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/70">{t('app.tagline')}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              to="/stamp"
              className="btn btn-primary shadow-lg shadow-brand-900/40 ring-1 ring-white/20"
            >
              <IconDocument width={18} height={18} />
              {t('nav.stamp')}
            </Link>
            <span className="glass-surface inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white/85">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {t('privacy.localOn')}
            </span>
            <InstallPrompt variant="glass" />
          </div>
        </section>

        {/* Quick actions */}
        <section className="grid gap-3 sm:grid-cols-2">
          {ACTIONS.map(({ to, label, desc, Icon, accent }) => (
            <Link
              key={to}
              to={to}
              className="glass-surface glass-hover flex items-start gap-4 p-4"
            >
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset ring-white/20 ${accent}`}
              >
                <Icon width={22} height={22} />
              </span>
              <span>
                <span className="block font-semibold text-white">{label}</span>
                <span className="block text-sm text-white/65">{desc}</span>
              </span>
            </Link>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent activity */}
          <section className="glass-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
                Recent activity
              </h2>
              {entries.length > 0 && (
                <Link to="/history" className="text-xs font-medium text-white/80 hover:text-white">
                  View all
                </Link>
              )}
            </div>
            {recent.length === 0 ? (
              <div className="py-6 text-center text-sm text-white/70">
                No documents stamped yet.{' '}
                <Link to="/stamp" className="font-medium text-white underline underline-offset-2">
                  Stamp your first document →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {recent.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ring-2 ring-white/20 ${
                        e.status === 'success' ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">
                        {e.documentName}
                      </span>
                      <span className="block text-xs text-white/60">
                        {e.stampNames.join(', ') || e.format.toUpperCase()} · {timeAgo(e.processedAt)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Quick stamps */}
          <section className="glass-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
                Quick stamps
              </h2>
              <Link to="/design" className="text-xs font-medium text-white/80 hover:text-white">
                Design
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {builtin.slice(0, 6).map((tpl) => (
                <Link
                  key={tpl.id}
                  to="/stamp"
                  title={tpl.name}
                  className="glass-surface glass-hover flex aspect-square items-center justify-center overflow-hidden bg-white/85 p-2"
                >
                  <StampPreview
                    stamp={{
                      content: tpl.content,
                      style: tpl.style,
                      placement: tpl.defaultPlacement,
                    }}
                    widthPx={96}
                  />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
