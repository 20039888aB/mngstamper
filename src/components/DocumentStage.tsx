import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { LoadedDocumentPage } from '../types/document'
import type { StampInstance } from '../types/stamp'
import { renderPageToCanvas } from '../lib/documents/pdfPreview'
import {
  clampPositionToPage,
  resolvePageScope,
  snapPosition,
} from '../lib/stamp/position'
import { buildStampLines } from '../lib/stamp/renderer'
import { clamp, cn } from '../lib/utils'

interface Props {
  doc: PDFDocumentProxy
  currentPage: number
  scale: number
  pages: LoadedDocumentPage[]
  stamps: StampInstance[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onUpdate: (id: string, patch: Partial<StampInstance>) => void
}

function isOnPage(stamp: StampInstance, pageCount: number, currentPage: number): boolean {
  if (stamp.hidden) return false
  try {
    return resolvePageScope(stamp.pageScope, pageCount, currentPage).includes(currentPage)
  } catch {
    return false
  }
}

export function DocumentStage({
  doc,
  currentPage,
  scale,
  pages,
  stamps,
  selectedId,
  onSelect,
  onUpdate,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [rendering, setRendering] = useState(true)

  const page = pages[currentPage - 1]
  const widthPx = page ? Math.floor(page.width * scale) : 0
  const heightPx = page ? Math.floor(page.height * scale) : 0

  useEffect(() => {
    let cancelled = false
    setRendering(true)
    renderPageToCanvas(doc, currentPage - 1, scale, canvasRef.current ?? undefined)
      .then(() => {
        if (!cancelled) setRendering(false)
      })
      .catch(() => {
        if (!cancelled) setRendering(false)
      })
    return () => {
      cancelled = true
    }
  }, [doc, currentPage, scale])

  const visible = useMemo(
    () => stamps.filter((s) => isOnPage(s, pages.length, currentPage)),
    [stamps, pages.length, currentPage],
  )

  const dragState = useRef<{ id: string; mode: 'move' | 'resize' } | null>(null)

  function beginDrag(e: PointerEvent, id: string, mode: 'move' | 'resize') {
    const stamp = stamps.find((s) => s.id === id)
    if (!stamp || stamp.locked) return
    e.stopPropagation()
    onSelect(id)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragState.current = { id, mode }
  }

  function onPointerMove(e: PointerEvent) {
    const state = dragState.current
    if (!state || !wrapRef.current || !page) return
    const rect = wrapRef.current.getBoundingClientRect()
    const stamp = stamps.find((s) => s.id === state.id)
    if (!stamp) return

    if (state.mode === 'move') {
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100
      let pos = snapPosition({ xPercent, yPercent }, 1.5)
      pos = clampPositionToPage(pos, { width: page.width, height: page.height }, {
        widthPt: stamp.placement.widthPt,
        heightPt: stamp.placement.heightPt,
      })
      onUpdate(state.id, { placement: { ...stamp.placement, position: pos } })
    } else {
      // Resize symmetrically around the stamp centre from the bottom-right handle.
      const centerXPt = (stamp.placement.position.xPercent / 100) * page.width
      const centerYPtTop = (stamp.placement.position.yPercent / 100) * page.height
      const ptpX = (e.clientX - rect.left) / scale
      const ptpYTop = (e.clientY - rect.top) / scale
      const widthPt = clamp(2 * (ptpX - centerXPt), 40, page.width)
      const heightPt = clamp(2 * (ptpYTop - centerYPtTop), 30, page.height)
      onUpdate(state.id, {
        placement: { ...stamp.placement, widthPt: Math.round(widthPt), heightPt: Math.round(heightPt) },
      })
    }
  }

  function endDrag(e: PointerEvent) {
    if (dragState.current) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      dragState.current = null
    }
  }

  return (
    <div className="relative mx-auto" style={{ width: widthPx }}>
      <div
        ref={wrapRef}
        className="stamp-surface paper relative shadow-lg ring-1 ring-slate-300 dark:ring-slate-700"
        style={{ width: widthPx, height: heightPx }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerDown={() => onSelect(null)}
      >
        <canvas ref={canvasRef} className="block" style={{ width: widthPx, height: heightPx }} />
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm text-slate-500">
            Rendering…
          </div>
        )}

        {visible.map((stamp) => (
          <StampBox
            key={stamp.id}
            stamp={stamp}
            scale={scale}
            selected={stamp.id === selectedId}
            onPointerDownMove={(e) => beginDrag(e, stamp.id, 'move')}
            onPointerDownResize={(e) => beginDrag(e, stamp.id, 'resize')}
          />
        ))}
      </div>
    </div>
  )
}

/** One draggable stamp box with a live text preview. */
function StampBox({
  stamp,
  scale,
  selected,
  onPointerDownMove,
  onPointerDownResize,
}: {
  stamp: StampInstance
  scale: number
  selected: boolean
  onPointerDownMove: (e: PointerEvent) => void
  onPointerDownResize: (e: PointerEvent) => void
}) {
  const w = stamp.placement.widthPt * scale
  const h = stamp.placement.heightPt * scale
  const lines = buildStampLines(stamp.content, stamp.style.fontSize)
  const lineHeight = (lines[0]?.size ?? stamp.style.fontSize) * 1.25
  const radius =
    stamp.style.shape === 'circle' || stamp.style.shape === 'oval'
      ? '50%'
      : stamp.style.shape === 'rounded'
        ? Math.min(w, h) * 0.12
        : 6

  const border =
    stamp.style.borderStyle === 'none'
      ? 'none'
      : `${Math.max(1, stamp.style.borderWidth * scale)}px ${
          stamp.style.borderStyle === 'double' ? 'double' : 'solid'
        } ${stamp.style.color}`

  return (
    <div
      role="button"
      aria-label={`${stamp.name} stamp`}
      tabIndex={0}
      onPointerDown={onPointerDownMove}
      className={cn(
        'absolute flex cursor-move select-none items-center justify-center overflow-hidden',
        selected && 'outline outline-2 outline-offset-2 outline-brand-500',
      )}
      style={{
        left: `${stamp.placement.position.xPercent}%`,
        top: `${stamp.placement.position.yPercent}%`,
        width: w,
        height: h,
        transform: `translate(-50%, -50%) rotate(${stamp.placement.rotationDeg}deg)`,
        borderRadius: radius,
        border,
        color: stamp.style.color,
        opacity: stamp.style.opacity,
        fontFamily:
          stamp.style.fontFamily === 'times'
            ? 'Times New Roman, serif'
            : stamp.style.fontFamily === 'courier'
              ? 'Courier New, monospace'
              : 'Helvetica, Arial, sans-serif',
      }}
    >
      <div className="flex flex-col items-center justify-center px-1 text-center leading-none">
        {lines.map((line, i) => (
          <span
            key={i}
            style={{
              fontSize: line.size * scale,
              fontWeight: line.bold ? 700 : 400,
              lineHeight: `${lineHeight * scale}px`,
            }}
          >
            {line.text}
          </span>
        ))}
      </div>
      {selected && !stamp.locked && (
        <span
          className="stamp-handle bottom-0 right-0 cursor-nwse-resize"
          onPointerDown={onPointerDownResize}
          aria-label="Resize stamp"
        />
      )}
    </div>
  )
}
