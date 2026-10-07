import { useMemo, useState } from 'react'
import { StampInspector } from '../components/StampInspector'
import { StampPreview } from '../components/StampPreview'
import { IconCopy, IconPlus, IconTrash } from '../components/icons'
import { useTemplates } from '../context/TemplatesContext'
import { t } from '../i18n'
import { createStampInstance } from '../lib/stamp/defaults'
import { cn } from '../lib/utils'
import type { StampInstance, StampTemplate } from '../types/stamp'

const EMPTY_NAME = 'Untitled stamp'

function draftFromTemplate(tpl?: StampTemplate): StampInstance {
  if (!tpl) return createStampInstance({ name: EMPTY_NAME })
  return createStampInstance({
    name: tpl.name,
    content: { ...tpl.content },
    style: { ...tpl.style },
    placement: { ...tpl.defaultPlacement, position: { ...tpl.defaultPlacement.position } },
    pageScope: { ...tpl.defaultPageScope },
  })
}

export function DesignStampPage() {
  const templates = useTemplates()
  const [draft, setDraft] = useState<StampInstance>(() => draftFromTemplate())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  // Which template (if any) the current draft corresponds to, for the badge.
  const sourceIsBuiltin = useMemo(
    () => !!editingId && templates.builtin.some((b) => b.id === editingId),
    [editingId, templates.builtin],
  )

  const patch = (p: Partial<StampInstance>) => setDraft((d) => ({ ...d, ...p }))

  function flash(msg: string) {
    setSavedMsg(msg)
    window.setTimeout(() => setSavedMsg(null), 2500)
  }

  function save() {
    const name = draft.name.trim() || EMPTY_NAME
    const payload = {
      name,
      content: draft.content,
      style: draft.style,
      defaultPlacement: draft.placement,
      defaultPageScope: draft.pageScope,
      isDefault: false,
    }
    // Custom templates can be updated in place; built-ins are copied on save.
    if (editingId && !sourceIsBuiltin && templates.custom.some((c) => c.id === editingId)) {
      templates.update(editingId, payload)
      flash(`Updated “${name}”`)
    } else {
      const created = templates.add(payload)
      setEditingId(created.id)
      flash(`Saved “${name}” as a new template`)
    }
  }

  function newDraft() {
    setDraft(draftFromTemplate())
    setEditingId(null)
  }

  function editTemplate(tpl: StampTemplate) {
    setDraft(draftFromTemplate(tpl))
    setEditingId(tpl.id)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t('nav.design')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Design a reusable stamp, then save it to your template library.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {savedMsg && (
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{savedMsg}</span>
          )}
          <button type="button" className="btn btn-ghost" onClick={newDraft}>
            <IconPlus width={16} height={16} /> New
          </button>
          <button type="button" className="btn btn-primary" onClick={save}>
            {editingId && !sourceIsBuiltin ? t('common.save') : 'Save as template'}
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Live preview */}
        <div className="card flex min-h-[280px] flex-col items-center justify-center gap-4 p-6">
          <div className="paper grid min-h-[200px] w-full flex-1 place-items-center rounded-lg ring-1 ring-slate-200 dark:ring-slate-700">
            <StampPreview stamp={draft} widthPx={220} />
          </div>
          <label className="flex w-full max-w-sm items-center gap-2">
            <span className="field-label mb-0 shrink-0">Name</span>
            <input
              className="input"
              value={draft.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="e.g. Finance Approved"
              aria-label="Template name"
            />
          </label>
          {sourceIsBuiltin && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              This is a built-in preset. Saving creates a new editable copy.
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="card p-4">
          <StampInspector
            stamp={draft}
            pageCount={1}
            currentPage={1}
            onChange={patch}
          />
        </div>
      </div>

      {/* Template library */}
      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Template library
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {templates.all.map((tpl) => (
            <article
              key={tpl.id}
              className={cn(
                'card group flex flex-col overflow-hidden',
                tpl.id === editingId && 'ring-2 ring-brand-500',
              )}
            >
              <button
                type="button"
                onClick={() => editTemplate(tpl)}
                className="paper flex aspect-[4/3] items-center justify-center overflow-hidden p-3"
                aria-label={`Edit ${tpl.name}`}
              >
                <StampPreview
                  stamp={{
                    content: tpl.content,
                    style: tpl.style,
                    placement: tpl.defaultPlacement,
                  }}
                  widthPx={130}
                />
              </button>
              <div className="flex items-center gap-1 border-t border-slate-100 px-2 py-1.5 dark:border-slate-800">
                <span className="min-w-0 flex-1 truncate text-xs font-medium" title={tpl.name}>
                  {tpl.name}
                  {tpl.isDefault && ' ★'}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost px-1.5 py-1"
                  aria-label={`${t('common.duplicate')} ${tpl.name}`}
                  onClick={() => templates.duplicate(tpl.id)}
                >
                  <IconCopy width={14} height={14} />
                </button>
                {templates.custom.some((c) => c.id === tpl.id) ? (
                  <button
                    type="button"
                    className="btn btn-ghost px-1.5 py-1 text-slate-400 hover:text-red-700"
                    aria-label={`${t('common.delete')} ${tpl.name}`}
                    onClick={() => {
                      templates.remove(tpl.id)
                      if (editingId === tpl.id) newDraft()
                    }}
                  >
                    <IconTrash width={14} height={14} />
                  </button>
                ) : (
                  <span className="px-1.5 text-[10px] uppercase text-slate-400">preset</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
