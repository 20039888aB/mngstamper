import { describe, expect, it } from 'vitest'
import { buildStampLines, blendTowardWhite } from './renderer'
import { hexToRgb01 } from './style'
import { DEFAULT_CONTENT } from './defaults'

describe('buildStampLines', () => {
  it('uppercases and bolds the headline, omitting empty lines', () => {
    const lines = buildStampLines(
      { ...DEFAULT_CONTENT, mainText: 'approved', secondaryText: '', organizationName: '', department: '', dateMode: 'none' },
      20,
    )
    expect(lines).toHaveLength(1)
    expect(lines[0]).toEqual({ text: 'APPROVED', size: 20, bold: true })
  })

  it('scales secondary, org and department lines relative to the base size', () => {
    const lines = buildStampLines(
      {
        ...DEFAULT_CONTENT,
        mainText: 'PAID',
        secondaryText: 'Finance',
        organizationName: 'Optimal Hospital',
        department: 'Accounts',
        dateMode: 'none',
      },
      20,
    )
    expect(lines.map((l) => l.text)).toEqual(['PAID', 'Finance', 'Optimal Hospital', 'Accounts'])
    expect(lines[1].size).toBeLessThan(lines[0].size)
  })
})

describe('blendTowardWhite', () => {
  it('lightens ink toward white as opacity drops', () => {
    const ink = hexToRgb01('#000000')
    expect(blendTowardWhite(ink, 1)).toEqual({ r: 0, g: 0, b: 0 })
    const faded = blendTowardWhite(ink, 0.5)
    expect(faded.r).toBeCloseTo(0.5)
  })
})
