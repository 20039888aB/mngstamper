import type {
  PageScope,
  PresetPosition,
  StampPosition,
} from '../../types/stamp'

/** Map of named presets to a stamp-centre position in page percentages. */
export const PRESET_POSITIONS: Record<PresetPosition, StampPosition> = {
  'top-left': { xPercent: 15, yPercent: 12 },
  'top-center': { xPercent: 50, yPercent: 12 },
  'top-right': { xPercent: 85, yPercent: 12 },
  'center-left': { xPercent: 15, yPercent: 50 },
  center: { xPercent: 50, yPercent: 50 },
  'center-right': { xPercent: 85, yPercent: 50 },
  'bottom-left': { xPercent: 15, yPercent: 88 },
  'bottom-center': { xPercent: 50, yPercent: 88 },
  'bottom-right': { xPercent: 85, yPercent: 88 },
}

export const PRESET_ORDER: PresetPosition[] = [
  'top-left', 'top-center', 'top-right',
  'center-left', 'center', 'center-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]

const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v))

/** Clamp a position so its stamp box stays fully inside the page. */
export function clampPositionToPage(
  position: StampPosition,
  page: { width: number; height: number },
  box: { widthPt: number; heightPt: number },
): StampPosition {
  const halfWPercent = ((box.widthPt / 2) / page.width) * 100
  const halfHPercent = ((box.heightPt / 2) / page.height) * 100
  return {
    xPercent: clamp(position.xPercent, halfWPercent, 100 - halfWPercent),
    yPercent: clamp(position.yPercent, halfHPercent, 100 - halfHPercent),
  }
}

/** Snap a centre position to the nearest margin/corner when within tolerance. */
export function snapPosition(
  position: StampPosition,
  tolerancePercent = 3,
): StampPosition {
  const targets = [5, 50, 95]
  const snapAxis = (v: number): number => {
    for (const t of targets) {
      if (Math.abs(v - t) <= tolerancePercent) return t
    }
    return v
  }
  return { xPercent: snapAxis(position.xPercent), yPercent: snapAxis(position.yPercent) }
}

export interface Point {
  x: number
  y: number
}

/**
 * Convert a UI position (percent, y-from-top) + box into the PDF centre point
 * (points, origin bottom-left) used by the renderer.
 */
export function toPdfCenterPoint(
  position: StampPosition,
  page: { width: number; height: number },
): Point {
  const x = (position.xPercent / 100) * page.width
  const yFromTop = (position.yPercent / 100) * page.height
  return { x, y: page.height - yFromTop }
}

/** Inverse of {@link toPdfCenterPoint} — used by pointer drag handlers. */
export function fromPdfCenterPoint(
  point: Point,
  page: { width: number; height: number },
): StampPosition {
  return {
    xPercent: (point.x / page.width) * 100,
    yPercent: ((page.height - point.y) / page.height) * 100,
  }
}

/**
 * Resolve a PageScope into a concrete list of 1-based page numbers.
 * Throws a human-readable Error for invalid ranges so the UI can surface it.
 */
export function resolvePageScope(
  scope: PageScope,
  pageCount: number,
  currentPage: number,
): number[] {
  const all = Array.from({ length: pageCount }, (_, i) => i + 1)
  switch (scope.kind) {
    case 'all':
      return all
    case 'current':
      return [clamp(currentPage, 1, pageCount)]
    case 'odd':
      return all.filter((p) => p % 2 === 1)
    case 'even':
      return all.filter((p) => p % 2 === 0)
    case 'selected':
      return [...new Set(scope.pages)].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b)
    case 'range':
      return parsePageRange(scope.range, pageCount)
  }
}

/**
 * Parse a page-range string like "1-5,8,10-12" into validated page numbers.
 * Validates against pageCount and rejects malformed segments.
 */
export function parsePageRange(input: string, pageCount: number): number[] {
  const result = new Set<number>()
  const segments = input.split(',').map((s) => s.trim()).filter(Boolean)
  if (segments.length === 0) {
    throw new Error('Enter at least one page or range, e.g. "1-3,5".')
  }
  for (const seg of segments) {
    const rangeMatch = seg.match(/^(\d+)\s*-\s*(\d+)$/)
    const singleMatch = seg.match(/^(\d+)$/)
    if (rangeMatch) {
      const start = Number(rangeMatch[1])
      const end = Number(rangeMatch[2])
      if (start < 1 || end > pageCount || start > end) {
        throw new Error(
          `Range "${seg}" is invalid. Pages must be between 1 and ${pageCount}.`,
        )
      }
      for (let p = start; p <= end; p += 1) result.add(p)
    } else if (singleMatch) {
      const p = Number(singleMatch[1])
      if (p < 1 || p > pageCount) {
        throw new Error(`Page ${p} is out of range (1-${pageCount}).`)
      }
      result.add(p)
    } else {
      throw new Error(`"${seg}" is not a valid page or range.`)
    }
  }
  return [...result].sort((a, b) => a - b)
}
