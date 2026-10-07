import { PDFDocument } from 'pdf-lib'
import type { ExportResult, LoadedDocumentPage } from '../../types/document'
import type { StampInstance } from '../../types/stamp'
import { stampEngine } from '../stamp/engine'
import type { DocumentProcessor, ProcessorEvent } from './DocumentProcessor'

/**
 * PDFProcessor — stamps directly into the PDF as vector content via pdf-lib.
 * The page is NEVER rasterized; original text/images/quality are preserved and
 * the source bytes stay immutable (every export re-derives from them).
 */
export class PDFProcessor implements DocumentProcessor {
  readonly format = 'pdf' as const
  private workingDoc: PDFDocument | null = null
  private pages: LoadedDocumentPage[] = []
  private readonly originalBytes: Uint8Array

  /**
   * @param originalBytes the uploaded file's bytes. A private snapshot is
   *   taken here: callers typically hand the SAME buffer to pdf.js for the
   *   on-screen preview, and pdf.js transfers (detaches) that ArrayBuffer to
   *   its worker thread. Reusing a detached buffer would make every later
   *   re-load in export() fail, so we copy once to keep the immutable source.
   * @param fileName      source name, used to build the output name
   */
  constructor(
    originalBytes: Uint8Array,
    private readonly fileName: string,
  ) {
    this.originalBytes = originalBytes.slice()
  }

  get pageCount(): number {
    return this.pages.length
  }

  async load(): Promise<void> {
    if (this.workingDoc) return
    try {
      this.workingDoc = await PDFDocument.load(this.originalBytes, {
        ignoreEncryption: true,
        updateMetadata: false,
      })
    } catch {
      throw new Error(
        'We couldn’t open this PDF. It may be password-protected, damaged, or use a feature that isn’t supported yet. Try saving a new copy from your PDF app and uploading again.',
      )
    }
    this.pages = this.workingDoc.getPages().map((p, i) => {
      const { width, height } = p.getSize()
      return { index: i + 1, width, height, rotation: p.getRotation().angle }
    })
  }

  getPages(): LoadedDocumentPage[] {
    return this.pages
  }

  async export(
    stamps: StampInstance[],
    currentPage: number,
    onProgress?: ProcessorEvent,
  ): Promise<ExportResult> {
    // Always derive from the immutable original so stamps never accumulate and
    // the source stays untouched.
    let doc: PDFDocument
    try {
      doc = await PDFDocument.load(this.originalBytes, {
        ignoreEncryption: true,
        updateMetadata: false,
      })
    } catch {
      throw new Error(
        'We couldn’t process this PDF. Please try a different file or re-upload it.',
      )
    }

    const pageCount = doc.getPageCount()
    await stampEngine.applyToDocument(doc, stamps, {
      pageCount,
      currentPage,
      onProgress,
    })

    const out = await doc.save({ useObjectStreams: true })
    const blob = new Blob([out as unknown as BlobPart], { type: 'application/pdf' })
    return {
      blob,
      mimeType: 'application/pdf',
      suggestedName: this.suggestedName(),
      formatPreserved: true,
    }
  }

  private suggestedName(): string {
    const base = this.fileName.replace(/\.pdf$/i, '') || 'document'
    return `${base}-stamped.pdf`
  }

  cleanup(): void {
    this.workingDoc = null
    this.pages = []
  }
}
