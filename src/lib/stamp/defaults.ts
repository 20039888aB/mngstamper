import type {
  StampContent,
  StampInstance,
  StampStyle,
  StampTemplate,
} from '../../types/stamp'
import { PRESET_POSITIONS } from './position'

/** Generate a reasonably unique id (uses crypto when available). */
export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const DEFAULT_STYLE: StampStyle = {
  shape: 'rectangle',
  color: '#1d4ed8',
  opacity: 0.85,
  borderWidth: 2,
  borderStyle: 'double',
  fontFamily: 'helvetica',
  fontWeight: 'bold',
  fontSize: 20,
}

export const DEFAULT_CONTENT: StampContent = {
  organizationName: '',
  department: '',
  mainText: 'RECEIVED',
  secondaryText: '',
  dateMode: 'current',
  customDate: null,
  dateFormat: 'DD/MM/YYYY',
  showTime: false,
}

/** Create a fresh stamp instance with sensible defaults. */
export function createStampInstance(partial?: Partial<StampInstance>): StampInstance {
  return {
    id: uid(),
    name: partial?.name ?? 'Stamp',
    content: { ...DEFAULT_CONTENT, ...partial?.content },
    style: { ...DEFAULT_STYLE, ...partial?.style },
    placement: partial?.placement ?? {
      position: { ...PRESET_POSITIONS['top-right'] },
      widthPt: 170,
      heightPt: 90,
      rotationDeg: 0,
    },
    pageScope: partial?.pageScope ?? { kind: 'current' },
    locked: false,
    hidden: false,
  }
}

function templateFrom(
  name: string,
  content: Partial<StampContent>,
  style: Partial<StampStyle> = {},
): StampTemplate {
  const now = new Date().toISOString()
  return {
    id: uid(),
    name,
    content: { ...DEFAULT_CONTENT, ...content },
    style: { ...DEFAULT_STYLE, ...style },
    defaultPlacement: {
      position: { ...PRESET_POSITIONS['top-right'] },
      widthPt: 170,
      heightPt: 90,
      rotationDeg: 0,
    },
    defaultPageScope: { kind: 'current' },
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  }
}

/** Built-in stamp templates (spec section 8 / 26). These are real, usable presets. */
export const BUILTIN_TEMPLATES: StampTemplate[] = [
  templateFrom('Received', { mainText: 'RECEIVED', dateMode: 'current' }),
  templateFrom('Approved', { mainText: 'APPROVED', dateMode: 'current' }),
  templateFrom('Paid', { mainText: 'PAID', dateMode: 'current' }, { color: '#15803d' }),
  templateFrom('Processed', { mainText: 'PROCESSED' }),
  templateFrom('Verified', { mainText: 'VERIFIED' }),
  templateFrom('Confidential', { mainText: 'CONFIDENTIAL' }, { color: '#b91c1c', shape: 'rounded' }),
  templateFrom('Copy', { mainText: 'COPY' }, { borderStyle: 'solid' }),
  templateFrom('Original', { mainText: 'ORIGINAL' }, { borderStyle: 'solid' }),
  templateFrom('Official', { mainText: 'OFFICIAL' }, { shape: 'circle' }),
]
