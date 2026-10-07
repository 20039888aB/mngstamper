import { readStore, writeStore, StorageKeys } from './storage'
import { uid } from './stamp/defaults'
import type { Organization, UserPreferences } from '../types/organization'

export function emptyOrganization(): Organization {
  return {
    id: uid(),
    name: '',
    defaultDateFormat: 'DD/MM/YYYY',
    defaultStampColor: '#1d4ed8',
    defaultPosition: { xPercent: 85, yPercent: 12 },
    defaultSizePt: { width: 170, height: 90 },
  }
}

export function readOrganizations(): Organization[] {
  return readStore<Organization[]>(StorageKeys.organizations, [])
}

/** The organization currently in use, resolved from preferences. */
export function getActiveOrganization(prefs: Pick<UserPreferences, 'lastOrganizationId'>): Organization {
  const orgs = readOrganizations()
  return orgs.find((o) => o.id === prefs.lastOrganizationId) ?? orgs[0] ?? emptyOrganization()
}

/** Insert or update one organization, keeping it as the active one. */
export function saveOrganization(org: Organization): void {
  const orgs = readOrganizations()
  const next = orgs.some((o) => o.id === org.id)
    ? orgs.map((o) => (o.id === org.id ? org : o))
    : [...orgs, org]
  writeStore(StorageKeys.organizations, next)
}
