import { useCallback, useRef, useState, type DragEvent } from 'react'
import { t } from '../i18n'
import { cn, formatBytes } from '../lib/utils'
import { IconUpload } from './icons'

const ACCEPT = '.pdf,.docx,.xlsx,.png,.jpg,.jpeg'

interface Props {
  onFile: (file: File) => void
  busy?: boolean
  maxBytes: number
}

export function FileDropzone({ onFile, busy, maxBytes }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (busy) return
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t('drop.title')}
      onClick={() => !busy && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !busy) inputRef.current?.click()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!busy) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors',
        dragOver
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30'
          : 'border-slate-300 bg-white hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900',
        busy ? 'cursor-wait opacity-70' : 'cursor-pointer',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <IconUpload width={32} height={32} className="text-brand-600 dark:text-brand-300" />
      <div>
        <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
          {t('drop.title')}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('drop.or')}{' '}
          <span className="font-medium text-brand-700 underline dark:text-brand-300">
            {t('drop.browse')}
          </span>
        </p>
      </div>
      <p className="text-xs text-slate-400">
        {t('drop.supported')} · max {formatBytes(maxBytes)}
      </p>
      <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        {t('drop.privacy')}
      </p>
    </div>
  )
}
