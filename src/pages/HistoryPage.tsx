import { useMemo, useState } from 'react'
import { IconHistory, IconTrash } from '../components/icons'
import { useHistory, type HistoryStatus } from '../context/HistoryContext'
import { t } from '../i18n'
import { useDocumentMeta } from '../lib/seo'
import { cn } from '../lib/utils'

type Filter = 'all' | HistoryStatus

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function HistoryPage() {
  useDocumentMeta(
    'Stamping History',
    'Browse every document you have stamped, with status, dates and a quick way to review your stamping records.',
  )
  const { entries, remove, clear } = useHistory()
  const [filter, setFilter] = useState<Filter>('all')

  const shown = useMemo(
    () => (filter === 'all' ? entries : entries.filter((e) => e.status === filter)),
    [entries, filter],
  )

  const counts = useMemo(
    () => ({
      all: entries.length,
      success: entries.filter((e) => e.status === 'success').length,
      failed: entries.filter((e) => e.status === 'failed').length,
    }),
    [entries],
  )

  if (entries.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 py-16 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient-soft text-brand-700 ring-1 ring-inset ring-brand-600/15 dark:text-brand-300">
          <IconHistory width={26} height={26} />
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{t('nav.history')}</h2>
        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
          Nothing here yet. Every document you stamp is logged on this device only —
          names and settings, never the file contents.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{t('nav.history')}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {counts.success} succeeded · {counts.failed} failed
        </p>
        <button
          type="button"
          className="btn btn-ghost ml-auto text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          onClick={() => {
            if (window.confirm('Clear all history on this device?')) clear()
          }}
        >
          <IconTrash width={16} height={16} /> Clear all
        </button>
      </div>

      <div className="flex gap-1" role="tablist" aria-label="Filter history">
        {(['all', 'success', 'failed'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-all duration-200 active:scale-[0.98]',
              filter === f
                ? 'bg-brand-gradient text-white shadow-sm shadow-brand-900/30'
                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
            )}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      <ul className="card divide-y divide-slate-100 dark:divide-slate-800">
        {shown.map((e) => (
          <li
            key={e.id}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
          >
            <span
              className={cn(
                'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2',
                e.status === 'success'
                  ? 'bg-emerald-500 ring-emerald-500/20'
                  : 'bg-red-500 ring-red-500/20',
              )}
              title={e.status}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate font-medium text-slate-800 dark:text-slate-100" title={e.documentName}>
                  {e.documentName}
                </span>
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {e.format}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {formatDateTime(e.processedAt)}
                {e.organizationName && <> · {e.organizationName}</>}
                {e.pagesStamped > 0 && <> · {e.pagesStamped} page(s) stamped</>}
              </p>
              {e.stampNames.length > 0 && (
                <p className="mt-1 flex flex-wrap gap-1">
                  {e.stampNames.map((n, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {n}
                    </span>
                  ))}
                </p>
              )}
            </div>
            <button
              type="button"
              className="btn btn-ghost px-1.5 py-1 text-slate-400 hover:text-red-700"
              aria-label={`${t('common.delete')} entry`}
              onClick={() => remove(e.id)}
            >
              <IconTrash width={16} height={16} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
