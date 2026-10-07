import type { DocumentFormat } from '../../types/document'

export interface ValidatedFile {
  format: DocumentFormat
  ok: true
}

export interface ValidationFailure {
  ok: false
  /** Human-readable, user-facing message. Never a stack trace. */
  reason: string
}

export type ValidationResult = ValidatedFile | ValidationFailure

interface ExtMap {
  [ext: string]: DocumentFormat
}

const EXT_TO_FORMAT: ExtMap = {
  pdf: 'pdf',
  docx: 'docx',
  xlsx: 'xlsx',
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpeg',
}

const MIME_TO_FORMAT: Record<string, DocumentFormat> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'image/png': 'png',
  'image/jpeg': 'jpg',
}

const fail = (reason: string): ValidationFailure => ({ ok: false, reason })

function extOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i === -1 ? '' : name.slice(i + 1).toLowerCase()
}

/**
 * Read the first few bytes and detect the real container, independent of the
 * (untrusted) filename and MIME type. Returns null if the signature is unknown.
 */
export async function sniffFormat(file: File): Promise<DocumentFormat | null> {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const hex = [...header].map((b) => b.toString(16).padStart(2, '0')).join('')
  if (hex.startsWith('25504446')) return 'pdf' // %PDF
  if (hex.startsWith('89504e47')) return 'png' // .PNG
  if (hex.startsWith('ffd8ff')) return 'jpg' // JPEG
  if (hex.startsWith('504b0304') || hex.startsWith('504b0506')) {
    // ZIP container — DOCX/XLSX are both OOXML zip packages. Disambiguate by
    // filename; a bare zip without a known office extension is unsupported.
    const e = extOf(file.name)
    if (e === 'docx') return 'docx'
    if (e === 'xlsx') return 'xlsx'
    return null
  }
  return null
}

export interface ValidationOptions {
  maxBytes: number
}

/**
 * Validate an uploaded file: extension allowlist + size limit + magic-byte
 * sniffing that must agree with the declared extension. Never trusts the
 * client-supplied MIME type on its own.
 */
export async function validateFile(
  file: File,
  options: ValidationOptions,
): Promise<ValidationResult> {
  const ext = extOf(file.name)
  const declaredFormat = EXT_TO_FORMAT[ext]

  if (!declaredFormat) {
    return fail(
      `"${ext || file.name}" is not a supported format. Please choose a PDF, Word (DOCX), Excel (XLSX) or image (PNG/JPG) file.`,
    )
  }

  if (file.size === 0) {
    return fail('That file appears to be empty. Please choose a different file.')
  }

  if (file.size > options.maxBytes) {
    const mb = (options.maxBytes / (1024 * 1024)).toFixed(0)
    return fail(
      `This file is larger than the ${mb} MB limit for on-device processing. Try reducing its size, or enable secure server processing in Settings.`,
    )
  }

  const sniffed = await sniffFormat(file)
  if (sniffed === null) {
    return fail(
      `We couldn't recognise "${file.name}" as a valid ${declaredFormat.toUpperCase()} file. It may be damaged or use an unsupported encoding.`,
    )
  }

  if (sniffed !== declaredFormat) {
    return fail(
      `"${file.name}" doesn't actually contain a ${declaredFormat.toUpperCase()} file (its real content looks like ${(sniffed as DocumentFormat).toUpperCase()}). For your safety this was rejected.`,
    )
  }

  // MIME, when present, should not contradict the sniffed type.
  if (file.type && MIME_TO_FORMAT[file.type] && MIME_TO_FORMAT[file.type] !== sniffed) {
    return fail(
      `The declared type of "${file.name}" doesn't match its contents. The file was rejected.`,
    )
  }

  return { format: sniffed, ok: true }
}

/** Whether a format can currently be stamped natively on-device in this build. */
export function isNativeStampable(format: DocumentFormat): boolean {
  return format === 'pdf'
}
