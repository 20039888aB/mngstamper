import type { DocumentFormat, ExportResult, LoadedDocumentPage } from '../../types/document'
import type { StampInstance } from '../../types/stamp'

export type ProcessorEvent = (done: number, total: number) => void

/**
 * Common contract every document processor must fulfil (spec section 35).
 * Implementations live in PDFProcessor (and, later, DOCX/XLSX/Image).
 * The original bytes are treated as immutable: exports always derive from them.
 */
export interface DocumentProcessor {
  readonly format: DocumentFormat
  readonly pageCount: number
  /** Load the source into a working copy. Safe to call more than once. */
  load(): Promise<void>
  /** Page geometry in PDF points. */
  getPages(): LoadedDocumentPage[]
  /** Apply stamps to a fresh copy derived from the immutable original and export. */
  export(stamps: StampInstance[], currentPage: number, onProgress?: ProcessorEvent): Promise<ExportResult>
  /** Release any held buffers. */
  cleanup(): void
}
