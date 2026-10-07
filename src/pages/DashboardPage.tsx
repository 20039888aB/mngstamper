import { Link } from 'react-router-dom'
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
    accent: 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
  },
  {
    to: '/design',
    label: t('nav.design'),
    desc: 'Craft reusable stamps and save them as templates.',
    Icon: IconStamp,
    accent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  },
  {
    to: '/history',
    label: t('nav.history'),
    desc: 'Review what you have stamped on this device.',
    Icon: IconHistory,
    accent: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  },
  {
    to: '/settings',
    label: t('nav.settings'),
    desc: 'Tune defaults, appearance, and privacy.',
    Icon: IconSettings,
    accent: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
]

export function DashboardPage() {
  const { entries } = useHistory()
  const { builtin } = useTemplates()
  const recent = entries.slice(0, 5)

  return (
    <div className="space-y-6">
      <section className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-8 text-white">
          <h1 className="text-2xl font-bold">{t('app.name')}</h1>
          <p className="mt-1 max-w-xl text-sm text-brand-100">{t('app.tagline')}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
            {t('privacy.localOn')}
          </p>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {ACTIONS.map(({ to, label, desc, Icon, accent }) => (
          <Link
            key={to}
            to={to}
            className="card flex items-start gap-4 p-4 transition-shadow hover:shadow-md"
          >
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${accent}`}>
              <Icon width={22} height={22} />
            </span>
            <span>
              <span className="block font-semibold text-slate-900 dark:text-slate-100">{label}</span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">{desc}</span>
            </span>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Recent activity
            </h2>
            {entries.length > 0 && (
              <Link to="/history" className="text-xs font-medium text-brand-700 dark:text-brand-300">
                View all
              </Link>
            )}
          </div>
          {recent.length === 0 ? (
            <div className="card p-6 text-center text-sm text-slate-500 dark:text-slate-400">
              No documents stamped yet.{' '}
              <Link to="/stamp" className="font-medium text-brand-700 underline dark:text-brand-300">
                Stamp your first document →
              </Link>
            </div>
          ) : (
            <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
              {recent.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      e.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {e.documentName}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {e.stampNames.join(', ') || e.format.toUpperCase()} · {timeAgo(e.processedAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Quick stamps
            </h2>
            <Link to="/design" className="text-xs font-medium text-brand-700 dark:text-brand-300">
              Design
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {builtin.slice(0, 6).map((tpl) => (
              <Link
                key={tpl.id}
                to="/stamp"
                title={tpl.name}
                className="card flex aspect-square items-center justify-center overflow-hidden p-2 transition-shadow hover:shadow-md"
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
  )
}
