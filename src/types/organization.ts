/** Organization + user + preferences domain types (Phase 5 groundwork, stored locally for now). */

export type UserRole = 'OWNER' | 'ADMIN' | 'STAMP_OPERATOR' | 'VIEWER'

export interface Organization {
  id: string
  name: string
  department?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  /** data-url or object-url of the logo image */
  logoDataUrl?: string
  /** id of the StampTemplate used by default */
  defaultStampTemplateId?: string
  defaultDateFormat: string
  defaultStampColor: string
  defaultPosition: { xPercent: number; yPercent: number }
  defaultSizePt: { width: number; height: number }
}

export interface OrganizationMember {
  userId: string
  role: UserRole
}

/** Smart-defaults / last-used preferences (spec section 25). */
export interface UserPreferences {
  lastOrganizationId: string | null
  lastStampTemplateId: string | null
  rememberLastPosition: boolean
  lastPosition: { xPercent: number; yPercent: number } | null
  lastSizePt: { width: number; height: number } | null
  lastDateFormat: string | null
  lastPageScopeKind: string | null
  lastColor: string | null
  processLocally: boolean
  theme: 'light' | 'dark' | 'system'
  locale: string
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  lastOrganizationId: null,
  lastStampTemplateId: null,
  rememberLastPosition: true,
  lastPosition: null,
  lastSizePt: null,
  lastDateFormat: null,
  lastPageScopeKind: null,
  lastColor: null,
  processLocally: true,
  theme: 'system',
  locale: 'en',
}
