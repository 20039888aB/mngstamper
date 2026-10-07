/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { readStore, writeStore, StorageKeys } from '../lib/storage'
import { uid } from '../lib/stamp/defaults'
import type { DocumentFormat } from '../types/document'

export type HistoryStatus = 'success' | 'failed'

/**
 * Audit record for a processed document. Deliberately stores NO document
 * contents — only metadata (spec sections 18 & 19).
 */
export interface HistoryEntry {
  id: string
  documentName: string
  format: DocumentFormat
  processedAt: string
  organizationName: string | null
  stampNames: string[]
  pagesStamped: number
  outputFormat: DocumentFormat
  status: HistoryStatus
}

interface HistoryCtx {
  entries: HistoryEntry[]
  add: (e: Omit<HistoryEntry, 'id' | 'processedAt'>) => HistoryEntry
  remove: (id: string) => void
  clear: () => void
}

const Ctx = createContext<HistoryCtx | null>(null)

const MAX_ENTRIES = 200

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<HistoryEntry[]>(() =>
    readStore<HistoryEntry[]>(StorageKeys.history, []),
  )

  useEffect(() => {
    writeStore(StorageKeys.history, entries)
  }, [entries])

  const add = useCallback<HistoryCtx['add']>((data) => {
    const entry: HistoryEntry = {
      ...data,
      id: uid(),
      processedAt: new Date().toISOString(),
    }
    setEntries((prev) => [entry, ...prev].slice(0, MAX_ENTRIES))
    return entry
  }, [])

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const clear = useCallback(() => setEntries([]), [])

  const value = useMemo(() => ({ entries, add, remove, clear }), [entries, add, remove, clear])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useHistory(): HistoryCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useHistory must be used within HistoryProvider')
  return c
}
