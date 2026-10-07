/**
 * Namespaced, safe localStorage helpers. All reads are guarded against parse
 * errors and unavailable storage (private mode / SSR), degrading gracefully.
 */

const PREFIX = 'urs:' // Universal Rubber Stamp

export const StorageKeys = {
  preferences: 'preferences',
  templates: 'stamp-templates',
  organizations: 'organizations',
  history: 'document-history',
} as const

function available(): boolean {
  try {
    return typeof window !== 'undefined' && !!window.localStorage
  } catch {
    return false
  }
}

export function readStore<T>(key: string, fallback: T): T {
  if (!available()) return fallback
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStore<T>(key: string, value: T): void {
  if (!available()) return
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* storage full / unavailable — ignore, app still works in-memory */
  }
}

export function removeStore(key: string): void {
  if (!available()) return
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

/** Wipe all app data (used by "Reset preferences" in Settings). */
export function clearAllStore(): void {
  if (!available()) return
  Object.values(StorageKeys).forEach(removeStore)
}
