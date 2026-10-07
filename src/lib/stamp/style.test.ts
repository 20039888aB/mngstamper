import { describe, expect, it } from 'vitest'
import { StandardFonts } from 'pdf-lib'
import { hexToRgb01, toStandardFont } from './style'

describe('hexToRgb01', () => {
  it('parses full hex into 0-1 channels', () => {
    expect(hexToRgb01('#000000')).toEqual({ r: 0, g: 0, b: 0 })
    expect(hexToRgb01('#ffffff')).toEqual({ r: 1, g: 1, b: 1 })
  })

  it('expands 3-digit shorthand', () => {
    expect(hexToRgb01('#fff')).toEqual({ r: 1, g: 1, b: 1 })
  })

  it('falls back safely on invalid input', () => {
    const c = hexToRgb01('nonsense')
    expect(c.r).toBeGreaterThanOrEqual(0)
    expect(c.r).toBeLessThanOrEqual(1)
  })
})

describe('toStandardFont', () => {
  it('maps family + weight onto base-14 fonts', () => {
    expect(toStandardFont('times', 'bold')).toBe(StandardFonts.TimesRomanBold)
    expect(toStandardFont('times', 'normal')).toBe(StandardFonts.TimesRoman)
    expect(toStandardFont('helvetica', 'normal')).toBe(StandardFonts.Helvetica)
    expect(toStandardFont('courier', 'bold')).toBe(StandardFonts.CourierBold)
  })
})
