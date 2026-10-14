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
        'group flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-all duration-300',
        dragOver
          ? 'scale-[1.01] border-brand-500 bg-brand-gradient-soft shadow-glow'
          : 'border-slate-300 bg-white/70 hover:border-brand-400 hover:shadow-card-hover dark:border-slate-700 dark:bg-slate-900/60',
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
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-white shadow-md shadow-brand-900/25 ring-1 ring-inset ring-white/20 transition-transform duration-300 group-hover:scale-105">
        <IconUpload width={26} height={26} />
      </span>
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
