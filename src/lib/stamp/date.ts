import type { DateMode, DateFormatString } from '../../types/stamp'

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = MONTHS_LONG.map((m) => m.slice(0, 3))

const pad2 = (n: number): string => String(n).padStart(2, '0')

/**
 * StampDate — resolves and formats the stamp's date/time.
 * Never hard-codes a date; `current` always uses the user's local time zone.
 */
export class StampDate {
  /** Resolve the effective Date for a stamp's date configuration. */
  static resolve(mode: DateMode, customDate: string | null): Date | null {
    if (mode === 'none') return null
    if (mode === 'custom' && customDate) {
      const d = new Date(customDate)
      if (!Number.isNaN(d.getTime())) return d
    }
    // 'current' — or a malformed custom value — falls back to now, local tz.
    return new Date()
  }

  /**
   * Format a Date using token substitution.
   * Supported tokens: YYYY YY MMMM MMM MM M DD D HH mm ss
   * Order of replacement matters: longer tokens first to avoid partial clashes.
   */
  static format(date: Date, pattern: DateFormatString): string {
    const map: Record<string, string> = {
      YYYY: String(date.getFullYear()),
      YY: pad2(date.getFullYear() % 100),
      MMMM: MONTHS_LONG[date.getMonth()],
      MMM: MONTHS_SHORT[date.getMonth()],
      MM: pad2(date.getMonth() + 1),
      M: String(date.getMonth() + 1),
      DD: pad2(date.getDate()),
      D: String(date.getDate()),
      HH: pad2(date.getHours()),
      mm: pad2(date.getMinutes()),
      ss: pad2(date.getSeconds()),
    }
    // Token regex, longest alternatives first.
    const tokenRe = /YYYY|MMMM|MMM|YY|MM|DD|HH|mm|ss|(?<![A-Za-z])D(?![A-Za-z])(?!\w)|(?<![A-Za-z])M(?![A-Za-z])(?!\w)/g
    return pattern.replace(tokenRe, (m) => map[m] ?? m)
  }

  /** Convenience: resolve + format in one call. */
  static render(
    mode: DateMode,
    customDate: string | null,
    pattern: DateFormatString,
    showTime: boolean,
  ): string | null {
    const d = StampDate.resolve(mode, customDate)
    if (!d) return null
    const datePart = StampDate.format(d, pattern)
    if (!showTime) return datePart
    const timePart = StampDate.format(d, 'HH:mm')
    return `${datePart} ${timePart}`
  }
}
