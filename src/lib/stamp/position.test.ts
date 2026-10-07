import { describe, expect, it } from 'vitest'
import {
  clampPositionToPage,
  parsePageRange,
  resolvePageScope,
  snapPosition,
  toPdfCenterPoint,
} from './position'

describe('parsePageRange', () => {
  it('expands ranges and single pages, de-duplicated and sorted', () => {
    expect(parsePageRange('1-3,5,2', 10)).toEqual([1, 2, 3, 5])
  })

  it('rejects pages beyond the document length', () => {
    expect(() => parsePageRange('1-12', 10)).toThrow(/invalid/i)
  })

  it('rejects malformed segments', () => {
    expect(() => parsePageRange('a-b', 10)).toThrow(/not a valid/i)
  })

  it('rejects empty input', () => {
    expect(() => parsePageRange('  ', 10)).toThrow(/at least one/i)
  })
})

describe('resolvePageScope', () => {
  it('returns the current page only for "current"', () => {
    expect(resolvePageScope({ kind: 'current' }, 5, 3)).toEqual([3])
  })

  it('returns odd pages for "odd"', () => {
    expect(resolvePageScope({ kind: 'odd' }, 5, 1)).toEqual([1, 3, 5])
  })

  it('returns every page for "all"', () => {
    expect(resolvePageScope({ kind: 'all' }, 3, 1)).toEqual([1, 2, 3])
  })
})

describe('snapPosition', () => {
  it('snaps to the nearest margin/centre within tolerance', () => {
    expect(snapPosition({ xPercent: 49, yPercent: 3.5 }, 2)).toEqual({ xPercent: 50, yPercent: 5 })
  })

  it('leaves positions that are far from any target', () => {
    expect(snapPosition({ xPercent: 30, yPercent: 70 }, 1.5)).toEqual({ xPercent: 30, yPercent: 70 })
  })
})

describe('clampPositionToPage', () => {
  it('keeps the whole stamp box inside the page', () => {
    const clamped = clampPositionToPage(
      { xPercent: 0, yPercent: 0 },
      { width: 100, height: 100 },
      { widthPt: 20, heightPt: 20 },
    )
    expect(clamped).toEqual({ xPercent: 10, yPercent: 10 })
  })
})

describe('toPdfCenterPoint', () => {
  it('converts top-origin percentages to a bottom-left PDF point', () => {
    // 50% across, 25% down from the top of a 100x100 page -> PDF y measured from bottom.
    expect(toPdfCenterPoint({ xPercent: 50, yPercent: 25 }, { width: 100, height: 100 })).toEqual({
      x: 50,
      y: 75,
    })
  })
})
