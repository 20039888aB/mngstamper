import { StandardFonts } from 'pdf-lib'
import type { StampFontFamily, FontWeight, StampStyle } from '../../types/stamp'

export interface Rgb {
  r: number
  g: number
  b: number
}

/** Parse a #rgb / #rrggbb hex color into 0-1 RGB channels for pdf-lib. */
export function hexToRgb01(hex: string): Rgb {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('')
  }
  const int = parseInt(h, 16)
  if (Number.isNaN(int) || h.length !== 6) {
    return { r: 0.11, g: 0.31, b: 0.86 } // safe brand-blue fallback
  }
  return {
    r: ((int >> 16) & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    b: (int & 255) / 255,
  }
}

/** Map a family + weight onto a PDF base-14 standard font (no embedding). */
export function toStandardFont(
  family: StampFontFamily,
  weight: FontWeight,
): StandardFonts {
  const bold = weight === 'bold'
  switch (family) {
    case 'times':
      return bold ? StandardFonts.TimesRomanBold : StandardFonts.TimesRoman
    case 'courier':
      return bold ? StandardFonts.CourierBold : StandardFonts.Courier
    case 'helvetica':
    default:
      return bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica
  }
}

/** Common corporate stamp colors offered in the designer. */
export const STAMP_COLOR_SWATCHES: { name: string; hex: string }[] = [
  { name: 'Ink Blue', hex: '#1d4ed8' },
  { name: 'Classic Red', hex: '#b91c1c' },
  { name: 'Forest Green', hex: '#15803d' },
  { name: 'Purple', hex: '#6d28d9' },
  { name: 'Graphite', hex: '#334155' },
  { name: 'Black', hex: '#0f172a' },
]

export const STAMP_FONT_OPTIONS: { label: string; value: StampFontFamily }[] = [
  { label: 'Helvetica (Sans)', value: 'helvetica' },
  { label: 'Times (Serif)', value: 'times' },
  { label: 'Courier (Mono)', value: 'courier' },
]

/** Type guard helper used by the renderer. */
export function isValidStyle(style: Partial<StampStyle>): style is StampStyle {
  return (
    typeof style.color === 'string' &&
    typeof style.opacity === 'number' &&
    typeof style.fontSize === 'number'
  )
}
