import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { DocumentStage } from '../components/DocumentStage'
import { FileDropzone } from '../components/FileDropzone'
import { StampInspector } from '../components/StampInspector'
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconDocument,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconLock,
  IconPlus,
  IconTrash,
  IconUnlock,
  IconZoomIn,
  IconZoomOut,
} from '../components/icons'
import { useHistory } from '../context/HistoryContext'
import { usePreferences } from '../context/PreferencesContext'
import { useTemplates } from '../context/TemplatesContext'
import { t } from '../i18n'
import { MAX_FILE_BYTES } from '../lib/env'
import { loadPdfForPreview } from '../lib/documents/pdfPreview'
import { PDFProcessor } from '../lib/documents/pdfProcessor'
import { isNativeStampable, validateFile } from '../lib/documents/validation'
import { createStampInstance, DEFAULT_CONTENT, DEFAULT_STYLE } from '../lib/stamp/defaults'
import { getActiveOrganization } from '../lib/organizations'
import { resolvePageScope } from '../lib/stamp/position'
import { cn, clamp, downloadBlob, fileToUint8Array, formatBytes } from '../lib/utils'
import type { DocumentFormat, LoadedDocumentPage } from '../types/document'
import type { Organization, UserPreferences } from '../types/organization'
import type { StampInstance, StampTemplate } from '../types/stamp'

/**
 * Build a fresh on-page stamp instance from a saved template, honouring the
 * user's "remember last position/size" smart defaults and the active
 * organization's identity for the name/department lines.
 */
function stampFromTemplate(
  template: StampTemplate,
  prefs: UserPreferences,
  org: Organization,
): StampInstance {
  const position =
    prefs.rememberLastPosition && prefs.lastPosition
      ? { ...prefs.lastPosition }
      : { ...template.defaultPlacement.position }
  return createStampInstance({
    name: template.name,
    content: {
      ...template.content,
      organizationName: template.content.organizationName || org.name,
      department: template.content.department || org.department || '',
    },
    style: { ...template.style },
    pageScope: { ...template.defaultPageScope },
    placement: {
      position,
      widthPt: prefs.lastSizePt?.width ?? template.defaultPlacement.widthPt,
      heightPt: prefs.lastSizePt?.height ?? template.defaultPlacement.heightPt,
      rotationDeg: template.defaultPlacement.rotationDeg,
    },
  })
}

/** A blank stamp seeded from the organization's default color / date format. */
function createBlankStamp(prefs: UserPreferences, org: Organization): StampInstance {
  return createStampInstance({
    name: 'Stamp',
    content: {
      ...DEFAULT_CONTENT,
      organizationName: org.name,
      department: org.department ?? '',
      dateFormat: org.defaultDateFormat,
    },
    style: { ...DEFAULT_STYLE, color: org.defaultStampColor },
    placement: {
      position: prefs.rememberLastPosition && prefs.lastPosition
        ? { ...prefs.lastPosition }
        : { ...org.defaultPosition },
      widthPt: prefs.lastSizePt?.width ?? org.defaultSizePt.width,
      heightPt: prefs.lastSizePt?.height ?? org.defaultSizePt.height,
      rotationDeg: 0,
    },
  })
}

interface DocState {
  name: string
  format: DocumentFormat
  sizeBytes: number
  pages: LoadedDocumentPage[]
}

type Panel = 'none' | 'unsupported-format' | 'load-error'

export function StampDocumentPage() {
  const { prefs, update } = usePreferences()
  const templates = useTemplates()
  const { add: addHistory } = useHistory()

  const [doc, setDoc] = useState<DocState | null>(null)
  const [previewDoc, setPreviewDoc] = useState<PDFDocumentProxy | null>(null)
  const [panel, setPanel] = useState<Panel>('none')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [stamps, setStamps] = useState<StampInstance[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  const [zoomMode, setZoomMode] = useState<'fit' | 'manual'>('fit')
  const [manualScale, setManualScale] = useState(1)
  const [containerW, setContainerW] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const processorRef = useRef<PDFProcessor | null>(null)
  // Bumping this (or unmounting) disposes the previous pdf.js document.
  const [generation, setGeneration] = useState(0)
  const templatesRef = useRef(templates)
  templatesRef.current = templates
  const prefsRef = useRef(prefs)
  prefsRef.current = prefs
  const org = useMemo(() => getActiveOrganization(prefs), [prefs])
  const orgRef = useRef(org)
  orgRef.current = org

  useEffect(() => {
    return () => {
      previewDoc?.destroy()
      processorRef.current?.cleanup()
    }
  }, [previewDoc])

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setContainerW(entries[0]?.contentRect.width ?? 0)
    })
    ro.observe(el)
    setContainerW(el.clientWidth)
    return () => ro.disconnect()
  }, [doc])

  /* ---------------- document loading ---------------- */

  const loadFile = useCallback(async (file: File) => {
    setBusy(true)
    setError(null)
    setPanel('none')
    try {
      const result = await validateFile(file, { maxBytes: MAX_FILE_BYTES })
      if (!result.ok) {
        setDoc(null)
        setPanel('load-error')
        setError(result.reason)
        return
      }
      if (!isNativeStampable(result.format)) {
        setDoc({
          name: file.name,
          format: result.format,
          sizeBytes: file.size,
          pages: [],
        })
        setPanel('unsupported-format')
        return
      }

      const bytes = await fileToUint8Array(file)
      const processor = new PDFProcessor(bytes, file.name)
      await processor.load()
      const proxy = await loadPdfForPreview(bytes)

      processorRef.current = processor
      setStamps([])
      setSelectedId(null)
      setCurrentPage(1)
      setZoomMode('fit')
      setPreviewDoc(proxy)
      setDoc({
        name: file.name,
        format: result.format,
        sizeBytes: file.size,
        pages: processor.getPages(),
      })
      setGeneration((g) => g + 1)

      // Smart default: start with the user's last-used (or the Received) stamp.
      const last = prefsRef.current.lastStampTemplateId
      const template =
        templatesRef.current.all.find((tpl) => tpl.name === last) ??
        templatesRef.current.all.find((tpl) => tpl.name === 'Received') ??
        templatesRef.current.builtin[0]
      if (template) {
        const first = stampFromTemplate(template, prefsRef.current, orgRef.current)
        setStamps([first])
        setSelectedId(first.id)
      }
    } catch (e) {
      setDoc(null)
      setPanel('load-error')
      setError(e instanceof Error ? e.message : t('error.generic'))
    } finally {
      setBusy(false)
    }
  }, [])

  /* ---------------- stamp operations ---------------- */

  const addBlankStamp = () => {
    const s = createBlankStamp(prefs, org)
    setStamps((prev) => [...prev, s])
    setSelectedId(s.id)
  }

  const addFromTemplate = (template: StampTemplate) => {
    const s = stampFromTemplate(template, prefs, org)
    setStamps((prev) => [...prev, s])
    setSelectedId(s.id)
    setShowTemplates(false)
  }

  const removeStamp = (id: string) => {
    setStamps((prev) => prev.filter((s) => s.id !== id))
    setSelectedId((sel) => (sel === id ? null : sel))
  }

  const updateStamp = useCallback((id: string, patch: Partial<StampInstance>) => {
    setStamps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch, placement: { ...s.placement, ...patch.placement } } : s)),
    )
  }, [])

  const toggleStampFlag = (id: string, flag: 'locked' | 'hidden') => {
    setStamps((prev) => prev.map((s) => (s.id === id ? { ...s, [flag]: !s[flag] } : s)))
  }

  const selected = useMemo(
    () => stamps.find((s) => s.id === selectedId) ?? null,
    [stamps, selectedId],
  )

  /* ---------------- export ---------------- */

  const pageCount = doc?.pages.length ?? 0

  const pagesThatWillBeStamped = useMemo(() => {
    const set = new Set<number>()
    for (const s of stamps) {
      if (s.hidden) continue
      try {
        resolvePageScope(s.pageScope, pageCount, currentPage).forEach((p) => set.add(p))
      } catch {
        /* invalid range — inspector already warns */
      }
    }
    return set.size
  }, [stamps, pageCount, currentPage])

  async function handleExport() {
    const processor = processorRef.current
    if (!processor || !doc || stamps.length === 0) return
    setExporting(true)
    setError(null)
    setProgress({ done: 0, total: 1 })
    try {
      const result = await processor.export(stamps, currentPage, (done, total) =>
        setProgress({ done, total }),
      )
      downloadBlob(result.blob, result.suggestedName)

      // Audit record — metadata only, never document contents.
      addHistory({
        documentName: doc.name,
        format: doc.format,
        organizationName: stamps.find((s) => s.content.organizationName.trim())?.content
          .organizationName ?? null,
        stampNames: stamps.map((s) => s.content.mainText.trim().toUpperCase() || s.name),
        pagesStamped: pagesThatWillBeStamped,
        outputFormat: doc.format,
        status: 'success',
      })

      // "Smart defaults": remember how the stamps were configured.
      if (prefs.rememberLastPosition && stamps[0]) {
        update({
          rememberLastPosition: true,
          lastPosition: { ...stamps[0].placement.position },
          lastSizePt: {
            width: stamps[0].placement.widthPt,
            height: stamps[0].placement.heightPt,
          },
          lastColor: stamps[0].style.color,
          lastDateFormat: stamps[0].content.dateFormat,
          lastPageScopeKind: stamps[0].pageScope.kind,
          lastStampTemplateId: stamps[0].name,
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error.generic'))
      addHistory({
        documentName: doc.name,
        format: doc.format,
        organizationName: null,
        stampNames: stamps.map((s) => s.name),
        pagesStamped: 0,
        outputFormat: doc.format,
        status: 'failed',
      })
    } finally {
      setExporting(false)
      setProgress(null)
    }
  }

  function handleNewDocument() {
    previewDoc?.destroy().catch(() => undefined)
    processorRef.current?.cleanup()
    processorRef.current = null
    setPreviewDoc(null)
    setDoc(null)
    setStamps([])
    setSelectedId(null)
    setPanel('none')
    setError(null)
  }

  /* ---------------- zoom geometry ---------------- */

  const basePage = doc?.pages[currentPage - 1]
  const fitScale =
    basePage && containerW > 0
      ? clamp((containerW - 8) / basePage.width, 0.2, 4)
      : 1
  const scale = zoomMode === 'fit' ? fitScale : manualScale
  const zoomPercent = Math.round(scale * 100)

  function zoomBy(factor: number) {
    setZoomMode('manual')
    setManualScale(clamp(scale * factor, 0.25, 4))
  }

  /* ---------------- render ---------------- */

  if (!doc) {
    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-1 text-xl font-semibold">{t('nav.stamp')}</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {t('drop.supported')} — {t('privacy.localOn')}
        </p>
        {panel === 'load-error' && error && (
          <ErrorBanner message={error} onRetry={() => setPanel('none')} onDismiss={() => setPanel('none')} />
        )}
        <FileDropzone onFile={loadFile} busy={busy} maxBytes={MAX_FILE_BYTES} />
      </div>
    )
  }

  if (panel === 'unsupported-format') {
    return (
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-4 text-xl font-semibold">{t('nav.stamp')}</h2>
        <div className="card p-6 text-center">
          <IconDocument width={40} height={40} className="mx-auto mb-3 text-brand-600 dark:text-brand-300" />
          <h3 className="text-base font-semibold">{doc.name}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {doc.format.toUpperCase()} · {formatBytes(doc.sizeBytes)}
          </p>
          <p className="mx-auto mt-4 max-w-md text-sm text-slate-600 dark:text-slate-300">
            On-device stamping is available for PDFs in this build. {doc.format.toUpperCase()} support
            (keeping your original format) arrives with the optional secure server engine — enable it
            in Settings once a backend is configured.
          </p>
          <button type="button" className="btn btn-secondary mt-5" onClick={handleNewDocument}>
            Choose another file
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* File header */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold" title={doc.name}>
            {doc.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            PDF · {pageCount} {t('common.pages')} · {formatBytes(doc.sizeBytes)}
            {pagesThatWillBeStamped > 0 && <> · {pagesThatWillBeStamped} page(s) will be stamped</>}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="btn btn-ghost" onClick={handleNewDocument}>
            New document
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting || stamps.length === 0}
          >
            <IconDownload width={16} height={16} />
            {exporting ? 'Exporting…' : t('common.download')}
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} onRetry={handleExport} />}
      {exporting && progress && (
        <div className="card px-4 py-2 text-sm" role="status" aria-live="polite">
          Stamping page {progress.done} of {progress.total}…
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Stage */}
        <div ref={contentRef} className="min-w-0">
          <div className="card mb-3 flex flex-wrap items-center gap-2 p-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="btn btn-ghost px-2"
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => clamp(p - 1, 1, pageCount))}
              >
                <IconChevronLeft width={18} height={18} />
              </button>
              <input
                type="number"
                className="input w-16 px-2 py-1 text-center"
                aria-label="Page number"
                min={1}
                max={pageCount}
                value={currentPage}
                onChange={(e) =>
                  setCurrentPage(clamp(Number(e.target.value) || 1, 1, pageCount))
                }
              />
              <span className="text-sm text-slate-500">/ {pageCount}</span>
              <button
                type="button"
                className="btn btn-ghost px-2"
                aria-label="Next page"
                disabled={currentPage >= pageCount}
                onClick={() => setCurrentPage((p) => clamp(p + 1, 1, pageCount))}
              >
                <IconChevronRight width={18} height={18} />
              </button>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button type="button" className="btn btn-ghost px-2" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.25)}>
                <IconZoomOut width={18} height={18} />
              </button>
              <span className="w-12 text-center text-sm tabular-nums text-slate-500">{zoomPercent}%</span>
              <button type="button" className="btn btn-ghost px-2" aria-label="Zoom in" onClick={() => zoomBy(1.25)}>
                <IconZoomIn width={18} height={18} />
              </button>
              <button
                type="button"
                className={cn('btn btn-ghost px-2 text-xs', zoomMode === 'fit' && 'text-brand-700 dark:text-brand-300')}
                onClick={() => setZoomMode('fit')}
              >
                Fit
              </button>
            </div>
          </div>

          {previewDoc && basePage && (
            <div className="overflow-x-auto pb-2">
              <DocumentStage
                key={`stage-${generation}`}
                doc={previewDoc}
                currentPage={currentPage}
                scale={scale}
                pages={doc.pages}
                stamps={stamps}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onUpdate={updateStamp}
              />
            </div>
          )}
        </div>

        {/* Side panel */}
        <aside className="card p-4 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
          <div className="mb-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-secondary" onClick={addBlankStamp}>
              <IconPlus width={16} height={16} /> Blank stamp
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              aria-expanded={showTemplates}
              onClick={() => setShowTemplates((v) => !v)}
            >
              From template…
            </button>
          </div>

          {showTemplates && (
            <div className="mb-3 grid grid-cols-2 gap-1.5">
              {templates.all.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className="truncate rounded-md border border-slate-200 px-2 py-1.5 text-left text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  onClick={() => addFromTemplate(tpl)}
                >
                  {tpl.name}
                  {!tpl.id.startsWith('urs-') && tpl.isDefault && ' ★'}
                </button>
              ))}
            </div>
          )}

          {stamps.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No stamps yet. Add one above, then drag it on the page.
            </p>
          ) : (
            <ul className="mb-2 space-y-1">
              {stamps.map((s) => (
                <li key={s.id}>
                  <div
                    className={cn(
                      'flex items-center gap-1 rounded-lg border px-2 py-1.5',
                      s.id === selectedId
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800',
                      s.hidden && 'opacity-50',
                    )}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate text-left text-sm font-medium"
                      onClick={() => setSelectedId(s.id)}
                    >
                      {s.content.mainText.trim().toUpperCase() || s.name}
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        {s.pageScope.kind === 'all'
                          ? t('stamp.pageScope.all')
                          : s.pageScope.kind === 'current'
                            ? t('stamp.pageScope.current')
                            : s.pageScope.kind}
                      </span>
                    </button>
                    <IconToggle
                      label={s.hidden ? 'Show stamp' : 'Hide stamp'}
                      on={s.hidden}
                      onToggle={() => toggleStampFlag(s.id, 'hidden')}
                      OnIcon={IconEyeOff}
                      OffIcon={IconEye}
                    />
                    <IconToggle
                      label={s.locked ? 'Unlock stamp' : 'Lock stamp'}
                      on={!s.locked}
                      onToggle={() => toggleStampFlag(s.id, 'locked')}
                      OnIcon={IconUnlock}
                      OffIcon={IconLock}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost px-1.5 text-slate-400 hover:text-red-700"
                      aria-label={`${t('common.delete')}: ${s.name}`}
                      onClick={() => removeStamp(s.id)}
                    >
                      <IconTrash width={16} height={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {selected ? (
            <StampInspectorWrapper
              stamp={selected}
              pageCount={pageCount}
              currentPage={currentPage}
              onChange={(patch) => {
                if (!selected.locked) updateStamp(selected.id, patch)
              }}
            />
          ) : (
            stamps.length > 0 && (
              <p className="text-xs text-slate-400">Select a stamp above to edit its properties.</p>
            )
          )}
        </aside>
      </div>
    </div>
  )
}

function StampInspectorWrapper({
  stamp,
  pageCount,
  currentPage,
  onChange,
}: {
  stamp: StampInstance
  pageCount: number
  currentPage: number
  onChange: (patch: Partial<StampInstance>) => void
}) {
  return (
    <>
      <h3 className="mb-1 text-sm font-semibold">{stamp.name}</h3>
      {stamp.locked && (
        <p className="mb-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          This stamp is locked. Unlock it to edit.
        </p>
      )}
      <StampInspector
        stamp={stamp}
        pageCount={pageCount}
        currentPage={currentPage}
        onChange={onChange}
      />
    </>
  )
}

function IconToggle({
  label,
  on,
  onToggle,
  OnIcon,
  OffIcon,
}: {
  label: string
  on: boolean
  onToggle: () => void
  OnIcon: typeof IconEye
  OffIcon: typeof IconEye
}) {
  const Icon = on ? OffIcon : OnIcon
  return (
    <button
      type="button"
      className="btn btn-ghost px-1.5 py-1"
      aria-label={label}
      aria-pressed={on}
      onClick={onToggle}
    >
      <Icon width={16} height={16} />
    </button>
  )
}

function ErrorBanner({
  message,
  onRetry,
  onDismiss,
}: {
  message: string
  onRetry?: () => void
  onDismiss: () => void
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
    >
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" className="btn btn-secondary px-2 py-1 text-xs" onClick={onRetry}>
          {t('common.retry')}
        </button>
      )}
      <button type="button" className="btn btn-ghost px-1.5 py-1" aria-label={t('common.close')} onClick={onDismiss}>
        <IconClose width={14} height={14} />
      </button>
    </div>
  )
}
