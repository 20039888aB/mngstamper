/** Document-processing domain types shared by processors and the UI. */

export type DocumentFormat = 'pdf' | 'docx' | 'xlsx' | 'png' | 'jpg' | 'jpeg'

export const SUPPORTED_FORMATS: DocumentFormat[] = [
  'pdf',
  'docx',
  'xlsx',
  'png',
  'jpg',
  'jpeg',
]

/** Formats that (in this build) are stamped natively on-device. */
export const NATIVE_STAMPABLE_FORMATS: DocumentFormat[] = ['pdf']

export interface LoadedDocumentPage {
  /** 1-based page index. */
  index: number
  width: number // in PDF points (or image px treated as points for stamping)
  height: number
  rotation: number // page rotation in degrees
}

export interface DocumentMeta {
  name: string
  format: DocumentFormat
  sizeBytes: number
  pageCount: number
}

/** Result of exporting a stamped document. */
export interface ExportResult {
  blob: Blob
  mimeType: string
  suggestedName: string
  /** True when the original file format was preserved. */
  formatPreserved: boolean
}
