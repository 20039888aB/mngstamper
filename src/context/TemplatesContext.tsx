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
import { BUILTIN_TEMPLATES, uid } from '../lib/stamp/defaults'
import type { StampTemplate } from '../types/stamp'

interface TemplatesCtx {
  /** Built-in presets (read-only) + user-saved templates. */
  all: StampTemplate[]
  custom: StampTemplate[]
  builtin: StampTemplate[]
  byId: (id: string) => StampTemplate | undefined
  add: (t: Omit<StampTemplate, 'id' | 'createdAt' | 'updatedAt'>) => StampTemplate
  update: (id: string, patch: Partial<StampTemplate>) => void
  remove: (id: string) => void
  duplicate: (id: string) => StampTemplate | undefined
  setDefault: (id: string) => void
}

const Ctx = createContext<TemplatesCtx | null>(null)

export function TemplatesProvider({ children }: { children: ReactNode }) {
  const [custom, setCustom] = useState<StampTemplate[]>(() =>
    readStore<StampTemplate[]>(StorageKeys.templates, []),
  )

  useEffect(() => {
    writeStore(StorageKeys.templates, custom)
  }, [custom])

  const all = useMemo(() => [...BUILTIN_TEMPLATES, ...custom], [custom])

  const byId = useCallback((id: string) => all.find((t) => t.id === id), [all])

  const add = useCallback<TemplatesCtx['add']>((data) => {
    const now = new Date().toISOString()
    const created: StampTemplate = { ...data, id: uid(), createdAt: now, updatedAt: now }
    setCustom((prev) => [...prev, created])
    return created
  }, [])

  const update = useCallback<TemplatesCtx['update']>((id, patch) => {
    setCustom((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
      ),
    )
  }, [])

  const remove = useCallback<TemplatesCtx['remove']>((id) => {
    setCustom((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const duplicate = useCallback<TemplatesCtx['duplicate']>(
    (id) => {
      const source = all.find((t) => t.id === id)
      if (!source) return undefined
      const now = new Date().toISOString()
      const copy: StampTemplate = {
        ...source,
        id: uid(),
        name: `${source.name} (copy)`,
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      }
      setCustom((prev) => [...prev, copy])
      return copy
    },
    [all],
  )

  const setDefault = useCallback<TemplatesCtx['setDefault']>((id) => {
    setCustom((prev) => prev.map((t) => ({ ...t, isDefault: t.id === id })))
  }, [])

  const value = useMemo<TemplatesCtx>(
    () => ({
      all,
      custom,
      builtin: BUILTIN_TEMPLATES,
      byId,
      add,
      update,
      remove,
      duplicate,
      setDefault,
    }),
    [all, custom, byId, add, update, remove, duplicate, setDefault],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTemplates(): TemplatesCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useTemplates must be used within TemplatesProvider')
  return c
}
