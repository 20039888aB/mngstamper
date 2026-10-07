/**
 * Core domain types for the Stamp Engine.
 * These are intentionally UI-agnostic so the same engine can be reused in the
 * web app, a future native wrapper (Capacitor), or a server API.
 */

/** Physical stamp shapes. */
export type StampShape = 'rectangle' | 'rounded' | 'circle' | 'oval'

/** Border rendering style. */
export type BorderStyle = 'solid' | 'double' | 'none'

/** Text weight mapped onto PDF standard fonts. */
export type FontWeight = 'normal' | 'bold'

/** Font families available without embedding (PDF base-14 standard fonts). */
export type StampFontFamily = 'helvetica' | 'times' | 'courier'

/** How the stamp finds its date value. */
export type DateMode = 'current' | 'custom' | 'none'

/**
 * Date format tokens are resolved by StampDate.format():
 *  DD, D, MM, M, MMM, MMMM, YYYY, YY, HH, mm, ss
 * Example: "DD MMMM YYYY" -> "07 October 2026"
 */
export type DateFormatString = string

export const COMMON_DATE_FORMATS: { label: string; pattern: string }[] = [
  { label: '07/10/2026', pattern: 'DD/MM/YYYY' },
  { label: '07-10-2026', pattern: 'DD-MM-YYYY' },
  { label: '07 October 2026', pattern: 'DD MMMM YYYY' },
  { label: 'OCT 07, 2026', pattern: 'MMM DD, YYYY' },
  { label: '2026-10-07', pattern: 'YYYY-MM-DD' },
]

/** Position of the stamp anchor on the page, in page-percentage terms (0-100). */
export interface StampPosition {
  /** X of the stamp centre as a percentage of page width (0 = left, 100 = right). */
  xPercent: number
  /** Y of the stamp centre as a percentage of page height, measured from the TOP. */
  yPercent: number
}

export type PresetPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

/** Page targeting for a stamp instance. */
export type PageScope =
  | { kind: 'current' }
  | { kind: 'all' }
  | { kind: 'odd' }
  | { kind: 'even' }
  | { kind: 'selected'; pages: number[] }
  | { kind: 'range'; range: string }

/** Visual styling of the stamp. */
export interface StampStyle {
  shape: StampShape
  color: string // hex, e.g. "#1d4ed8"
  opacity: number // 0..1
  borderWidth: number // in points
  borderStyle: BorderStyle
  fontFamily: StampFontFamily
  fontWeight: FontWeight
  /** Base font size in points; lines auto-scale relative to this. */
  fontSize: number
}

/** The textual / data content of the stamp. */
export interface StampContent {
  organizationName: string
  department: string
  /** Primary headline, e.g. "APPROVED" / "RECEIVED". */
  mainText: string
  /** Optional secondary line under the headline. */
  secondaryText: string
  dateMode: DateMode
  /** ISO date string, used when dateMode === 'custom'. */
  customDate: string | null
  dateFormat: DateFormatString
  showTime: boolean
}

/** Full configuration for one stamp instance on a document. */
export interface StampInstance {
  id: string
  name: string
  content: StampContent
  style: StampStyle
  placement: {
    position: StampPosition
    /** Stamp box width in PDF points. */
    widthPt: number
    /** Stamp box height in PDF points. */
    heightPt: number
    /** Rotation in degrees, clockwise. */
    rotationDeg: number
  }
  pageScope: PageScope
  locked: boolean
  hidden: boolean
}

/** A saved, reusable stamp configuration (without per-document placement). */
export interface StampTemplate {
  id: string
  name: string
  content: StampContent
  style: StampStyle
  defaultPlacement: StampInstance['placement']
  defaultPageScope: PageScope
  isDefault: boolean
  organizationId?: string
  createdAt: string
  updatedAt: string
}
