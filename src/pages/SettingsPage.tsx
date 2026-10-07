import { useEffect, useRef, useState } from 'react'
import { setLocale, t } from '../i18n'
import { usePreferences } from '../context/PreferencesContext'
import { COMMON_DATE_FORMATS } from '../types/stamp'
import { STAMP_COLOR_SWATCHES } from '../lib/stamp/style'
import { clearAllStore } from '../lib/storage'
import { getActiveOrganization, saveOrganization } from '../lib/organizations'
import { fileToDataUrl, cn, formatBytes } from '../lib/utils'
import { SERVER_PROCESSING_AVAILABLE, MAX_FILE_BYTES } from '../lib/env'
import type { Organization, UserPreferences } from '../types/organization'

function Section({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section className="card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      {desc && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{desc}</p>}
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-slate-800 dark:text-slate-100">{label}</span>
        {hint && <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </span>
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700',
        )}
      >
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </span>
    </label>
  )
}

const THEMES: { value: UserPreferences['theme']; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export function SettingsPage() {
  const { prefs, update, reset } = usePreferences()
  const [org, setOrg] = useState<Organization>(() => getActiveOrganization(prefs))
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Persist the organization whenever it changes.
  useEffect(() => {
    saveOrganization(org)
    if (prefs.lastOrganizationId !== org.id) update({ lastOrganizationId: org.id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org])

  const setField = <K extends keyof Organization>(key: K, value: Organization[K]) =>
    setOrg((o) => ({ ...o, [key]: value }))

  async function onLogoPick(file?: File) {
    if (!file) return
    try {
      setField('logoDataUrl', await fileToDataUrl(file))
    } catch {
      /* ignore unreadable image */
    }
  }

  function hardReset() {
    if (!window.confirm('Reset all app data on this device? Templates, history, organizations and preferences will be erased.')) return
    clearAllStore()
    reset()
    window.location.reload()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h2 className="text-xl font-semibold">{t('nav.settings')}</h2>

      <Section title="Appearance">
        <div>
          <span className="field-label">Theme</span>
          <div className="flex gap-1">
            {THEMES.map((th) => (
              <button
                key={th.value}
                type="button"
                onClick={() => update({ theme: th.value })}
                aria-pressed={prefs.theme === th.value}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-medium capitalize',
                  prefs.theme === th.value
                    ? 'border-brand-600 bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {th.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Privacy & processing" desc={prefs.processLocally ? t('privacy.localOn') : t('privacy.localOff')}>
        <Toggle
          checked={prefs.processLocally}
          onChange={(v) => update({ processLocally: v })}
          label="Process documents locally"
          hint={
            SERVER_PROCESSING_AVAILABLE
              ? 'When off, large documents can use the configured server engine.'
              : `Keep on — no server is configured. Limit ${formatBytes(MAX_FILE_BYTES)}.`
          }
        />
      </Section>

      <Section title="Stamping behaviour">
        <Toggle
          checked={prefs.rememberLastPosition}
          onChange={(v) => update({ rememberLastPosition: v })}
          label="Remember my last stamp placement"
          hint="New stamps start where you last placed and sized one."
        />
      </Section>

      <Section title="Organization defaults" desc="Pre-filled into new stamps and used on exported history records.">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            {org.logoDataUrl ? (
              <img src={org.logoDataUrl} alt="Organization logo" className="h-full w-full object-contain" />
            ) : (
              <span className="text-[10px] text-slate-400">Logo</span>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={() => logoInputRef.current?.click()}>
              Upload logo
            </button>
            {org.logoDataUrl && (
              <button type="button" className="btn btn-ghost" onClick={() => setField('logoDataUrl', undefined)}>
                Remove
              </button>
            )}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg"
              className="sr-only"
              onChange={(e) => onLogoPick(e.target.files?.[0])}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Organization name</span>
            <input className="input" value={org.name} onChange={(e) => setField('name', e.target.value)} placeholder="Optimal Family Hospital" />
          </label>
          <label className="block">
            <span className="field-label">Department</span>
            <input className="input" value={org.department ?? ''} onChange={(e) => setField('department', e.target.value)} placeholder="Administration" />
          </label>
        </div>

        <div>
          <span className="field-label">Default stamp color</span>
          <div className="flex flex-wrap items-center gap-2">
            {STAMP_COLOR_SWATCHES.map((s) => (
              <button
                key={s.hex}
                type="button"
                title={s.name}
                aria-pressed={org.defaultStampColor === s.hex}
                onClick={() => setField('defaultStampColor', s.hex)}
                className={cn(
                  'h-7 w-7 rounded-full border-2',
                  org.defaultStampColor === s.hex ? 'border-slate-900 dark:border-white' : 'border-transparent',
                )}
                style={{ backgroundColor: s.hex }}
              />
            ))}
            <input
              type="color"
              value={org.defaultStampColor}
              onChange={(e) => setField('defaultStampColor', e.target.value)}
              className="h-7 w-9 cursor-pointer rounded border border-slate-300 bg-transparent"
              aria-label="Custom default color"
            />
          </div>
        </div>

        <label className="block max-w-xs">
          <span className="field-label">Default date format</span>
          <select className="input" value={org.defaultDateFormat} onChange={(e) => setField('defaultDateFormat', e.target.value)}>
            {COMMON_DATE_FORMATS.map((f) => (
              <option key={f.pattern} value={f.pattern}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </Section>

      <Section title="Language">
        <label className="block max-w-xs">
          <span className="field-label">Interface language</span>
          <select
            className="input"
            value={prefs.locale}
            onChange={(e) => {
              const loc = e.target.value as 'en'
              setLocale(loc)
              update({ locale: loc })
            }}
          >
            <option value="en">English</option>
          </select>
        </label>
        <p className="text-xs text-slate-400">More locales are planned and will appear here.</p>
      </Section>

      <Section title="Data">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              reset()
              window.location.reload()
            }}
          >
            Reset preferences
          </button>
          <button
            type="button"
            className="btn border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            onClick={hardReset}
          >
            Erase all app data
          </button>
        </div>
      </Section>
    </div>
  )
}
