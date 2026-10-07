import { describe, expect, it } from 'vitest'
import { isNativeStampable, sniffFormat, validateFile } from './validation'

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 1, 2, 3]) // "%PDF-"
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const makeFile = (bytes: Uint8Array<ArrayBuffer>, name: string, type = ''): File =>
  new File([bytes], name, { type })

const LIMIT = 10 * 1024 * 1024

describe('sniffFormat', () => {
  it('detects the real container from magic bytes', async () => {
    expect(await sniffFormat(makeFile(PDF_BYTES, 'x.pdf'))).toBe('pdf')
    expect(await sniffFormat(makeFile(PNG_BYTES, 'x.png'))).toBe('png')
  })
})

describe('validateFile', () => {
  it('accepts a genuine PDF', async () => {
    const res = await validateFile(makeFile(PDF_BYTES, 'doc.pdf', 'application/pdf'), { maxBytes: LIMIT })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.format).toBe('pdf')
  })

  it('rejects an unsupported extension', async () => {
    const res = await validateFile(makeFile(PDF_BYTES, 'notes.txt'), { maxBytes: LIMIT })
    expect(res.ok).toBe(false)
  })

  it('rejects an empty file', async () => {
    const res = await validateFile(makeFile(new Uint8Array([]), 'doc.pdf'), { maxBytes: LIMIT })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toMatch(/empty/i)
  })

  it('rejects a filename whose contents disagree (png name, pdf bytes)', async () => {
    const res = await validateFile(makeFile(PDF_BYTES, 'photo.png'), { maxBytes: LIMIT })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.reason).toMatch(/doesn't actually contain/i)
  })

  it('only PDFs are natively stampable in this build', () => {
    expect(isNativeStampable('pdf')).toBe(true)
    expect(isNativeStampable('docx')).toBe(false)
  })
})
