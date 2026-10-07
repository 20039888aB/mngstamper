/// <reference types="vite/client" />
import type { PDFDocumentProxy } from 'pdfjs-dist'

// pdf.js is heavy, so it is imported lazily at runtime and cached here.
let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

async function loadPdfJs(): Promise<typeof import('pdfjs-dist')> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist')
      // Point the worker at Vite's bundled worker asset (works in dev + build).
      const workerUrl = (
        await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
      ).default
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
      return pdfjs
    })()
  }
  return pdfjsPromise
}

export interface RenderedPage {
  canvas: HTMLCanvasElement
  /** CSS-pixel width/height of the rendered page at scale 1. */
  baseWidth: number
  baseHeight: number
}

/**
 * Load a PDF for on-screen preview. Returns the pdf.js document proxy; the
 * caller owns its lifetime and must call .destroy() on cleanup.
 */
export async function loadPdfForPreview(
  data: Uint8Array,
): Promise<PDFDocumentProxy> {
  const pdfjs = await loadPdfJs()
  const task = pdfjs.getDocument({ data, isEvalSupported: false })
  return task.promise
}

/**
 * Render one page onto a canvas at the given scale (1 = 72dpi base).
 * The canvas is created (or reused) and returned for the stamp overlay to size
 * itself against.
 */
export async function renderPageToCanvas(
  doc: PDFDocumentProxy,
  pageIndex: number, // 0-based
  scale: number,
  target?: HTMLCanvasElement,
): Promise<RenderedPage> {
  const page = await doc.getPage(pageIndex + 1)
  const viewport = page.getViewport({ scale })
  const canvas = target ?? document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available in this browser.')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)

  await page.render({ canvasContext: ctx, viewport }).promise
  page.cleanup()

  return {
    canvas,
    baseWidth: Math.floor(page.getViewport({ scale: 1 }).width),
    baseHeight: Math.floor(page.getViewport({ scale: 1 }).height),
  }
}
