import type { PDFDocument } from 'pdf-lib'
import type { StampInstance } from '../../types/stamp'
import { resolvePageScope } from './position'
import { StampRenderer } from './renderer'

export interface ApplyOptions {
  pageCount: number
  currentPage: number
  onProgress?: (done: number, total: number) => void
}

export interface ApplyResult {
  pagesStamped: number[]
  stampsApplied: number
}

/**
 * StampEngine — UI-independent orchestrator.
 * Applies a set of StampInstances to a loaded PDFDocument, honouring each
 * stamp's page scope. This is the single source of truth used by both the
 * browser app and (later) any server/native port.
 */
export class StampEngine {
  async applyToDocument(
    doc: PDFDocument,
    instances: StampInstance[],
    options: ApplyOptions,
  ): Promise<ApplyResult> {
    const { pageCount, currentPage, onProgress } = options
    const pages = doc.getPages()

    // Build a map of 1-based page number -> set of instances targeting it.
    const targets = new Map<number, StampInstance[]>()
    let totalOps = 0
    for (const instance of instances) {
      if (instance.hidden) continue
      const pageNums = resolvePageScope(instance.pageScope, pageCount, currentPage)
      for (const p of pageNums) {
        if (!targets.has(p)) targets.set(p, [])
        targets.get(p)!.push(instance)
        totalOps += 1
      }
    }

    const renderer = new StampRenderer(doc)
    const pagesStamped: number[] = []
    let done = 0

    // Deterministic order so page-level stacking is predictable.
    const orderedPages = [...targets.keys()].sort((a, b) => a - b)
    for (const pageNum of orderedPages) {
      const page = pages[pageNum - 1]
      if (!page) continue
      const list = targets.get(pageNum)!
      for (const instance of list) {
        await renderer.render(page, instance)
        done += 1
        onProgress?.(done, totalOps)
      }
      pagesStamped.push(pageNum)
    }

    return { pagesStamped, stampsApplied: done }
  }
}

export const stampEngine = new StampEngine()
