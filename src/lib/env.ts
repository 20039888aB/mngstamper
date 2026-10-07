/**
 * Typed accessors for Vite client environment variables (.env.example documents
 * each key). All callers go through this module so defaults live in one place.
 */

function toPositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/** Maximum accepted upload size in bytes (client validation layer). */
export const MAX_FILE_BYTES: number =
  toPositiveInt(import.meta.env.VITE_MAX_FILE_SIZE_MB, 50) * 1024 * 1024

/** Base URL of the optional server-processing API; empty means 100% local. */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''

/** True when the server-processing layer is reachable (API base configured). */
export const SERVER_PROCESSING_AVAILABLE: boolean = API_BASE_URL.length > 0

/** Verbose client logging (keep off in production). */
export const DEBUG: boolean = import.meta.env.VITE_DEBUG === 'true'
