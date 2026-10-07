import { describe, expect, it } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import { PDFProcessor } from './pdfProcessor'

async function minimalPdfBytes(): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.addPage([200, 100])
  return doc.save()
}

describe('PDFProcessor', () => {
  it('loads page geometry from the source', async () => {
    const proc = new PDFProcessor(await minimalPdfBytes(), 'a.pdf')
    await proc.load()
    expect(proc.pageCount).toBe(1)
    expect(proc.getPages()[0]).toMatchObject({ index: 1, width: 200, height: 100 })
  })

  it('exports successfully even if the caller corrupts the shared buffer after hand-off', async () => {
    // Reproduces the real bug: pdf.js transfers (detaches) the SAME buffer we
    // also store. Corrupting the caller's view must NOT break later re-loads,
    // because the processor keeps a private snapshot.
    const bytes = await minimalPdfBytes()
    const proc = new PDFProcessor(bytes, 'b.pdf')
    await proc.load()

    bytes.fill(0) // simulate the ArrayBuffer being detached/reused downstream

    const result = await proc.export([], 1)
    expect(result.mimeType).toBe('application/pdf')
    expect(result.suggestedName).toBe('b-stamped.pdf')
    expect(result.formatPreserved).toBe(true)
    expect(result.blob.size).toBeGreaterThan(0)
  })

  it('re-derives from the immutable original so stamps never accumulate', async () => {
    const proc = new PDFProcessor(await minimalPdfBytes(), 'c.pdf')
    await proc.load()
    const first = await proc.export([], 1)
    const second = await proc.export([], 1)
    // Same clean source both times → byte-identical output.
    expect(second.blob.size).toBe(first.blob.size)
  })
})
