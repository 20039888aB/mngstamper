import { describe, expect, it } from 'vitest'
import { StampDate } from './date'

describe('StampDate.format', () => {
  const d = new Date(2026, 9, 7, 14, 5, 9) // 07 October 2026, 14:05:09 local

  it('formats long month and zero-padded day/year', () => {
    expect(StampDate.format(d, 'DD MMMM YYYY')).toBe('07 October 2026')
  })

  it('formats abbreviated month with comma', () => {
    expect(StampDate.format(d, 'MMM DD, YYYY')).toBe('Oct 07, 2026')
  })

  it('supports numeric and time tokens', () => {
    expect(StampDate.format(d, 'DD/MM/YYYY')).toBe('07/10/2026')
    expect(StampDate.format(d, 'HH:mm:ss')).toBe('14:05:09')
  })
})

describe('StampDate.resolve / render', () => {
  it('returns null when the date mode is "none"', () => {
    expect(StampDate.render('none', null, 'DD/MM/YYYY', false)).toBeNull()
  })

  it('renders a custom date', () => {
    expect(StampDate.render('custom', '2026-10-07T00:00:00', 'YYYY-MM-DD', false)).toBe('2026-10-07')
  })

  it('appends the time when requested', () => {
    expect(StampDate.render('custom', '2026-10-07T09:30:00', 'DD/MM/YYYY', true)).toBe(
      '07/10/2026 09:30',
    )
  })
})
