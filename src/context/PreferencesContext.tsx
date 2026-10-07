/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { readStore, writeStore, StorageKeys } from '../lib/storage'
import { DEFAULT_PREFERENCES, type UserPreferences } from '../types/organization'

interface PreferencesCtx {
  prefs: UserPreferences
  update: (patch: Partial<UserPreferences>) => void
  reset: () => void
}

const Ctx = createContext<PreferencesCtx | null>(null)

/**
 * Owns the persisted UserPreferences object — the "smart defaults" store
 * (spec section 25). Theme is one field of these preferences.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<UserPreferences>(() => ({
    ...DEFAULT_PREFERENCES,
    ...readStore<Partial<UserPreferences>>(StorageKeys.preferences, {}),
  }))

  const update = useCallback((patch: Partial<UserPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch }
      writeStore(StorageKeys.preferences, next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setPrefs(DEFAULT_PREFERENCES)
    writeStore(StorageKeys.preferences, DEFAULT_PREFERENCES)
  }, [])

  const value = useMemo(() => ({ prefs, update, reset }), [prefs, update, reset])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePreferences(): PreferencesCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePreferences must be used within PreferencesProvider')
  return c
}
