import { PDFDocument, PDFFont, PDFPage, rgb } from 'pdf-lib'
import {
  pushGraphicsState,
  popGraphicsState,
  rotateDegrees,
  translate,
} from 'pdf-lib'
import type { StampContent, StampInstance, StampStyle } from '../../types/stamp'
import { StampDate } from './date'
import { toPdfCenterPoint } from './position'
import { hexToRgb01, toStandardFont, type Rgb } from './style'

/** Laid-out line of text inside the stamp box. */
interface Line {
  text: string
  size: number
  bold: boolean
}

/**
 * Blend an ink colour toward white by the given opacity (0..1).
 * pdf-lib exposes no ExtGState opacity operators, so we emulate translucency
 * by lightening the ink — which is visually correct on white paper and keeps
 * the output fully vector (no rasterization).
 */
export function blendTowardWhite(color: Rgb, opacity: number): Rgb {
  const o = Math.min(1, Math.max(0, opacity))
  const blend = (c: number): number => c * o + 1 * (1 - o)
  return { r: blend(color.r), g: blend(color.g), b: blend(color.b) }
}

/** Build the ordered list of text lines from stamp content. */
export function buildStampLines(
  content: StampContent,
  baseFontSize: number,
): Line[] {
  const lines: Line[] = []
  if (content.mainText.trim()) {
    lines.push({ text: content.mainText.trim().toUpperCase(), size: baseFontSize, bold: true })
  }
  if (content.secondaryText.trim()) {
    lines.push({ text: content.secondaryText.trim(), size: baseFontSize * 0.5, bold: false })
  }
  if (content.organizationName.trim()) {
    lines.push({ text: content.organizationName.trim(), size: baseFontSize * 0.42, bold: false })
  }
  if (content.department.trim()) {
    lines.push({ text: content.department.trim(), size: baseFontSize * 0.36, bold: false })
  }
  const dateStr = StampDate.render(
    content.dateMode,
    content.customDate,
    content.dateFormat,
    content.showTime,
  )
  if (dateStr) {
    lines.push({ text: dateStr, size: baseFontSize * 0.42, bold: false })
  }
  return lines
}

/**
 * StampRenderer — draws a StampInstance onto a PDF page using vector operators.
 * The page is never rasterized: text/shape content is added on top of the
 * original page, preserving the source document quality.
 */
export class StampRenderer {
  private fontCache = new Map<string, PDFFont>()

  constructor(private doc: PDFDocument) {}

  private async getFont(
    family: StampStyle['fontFamily'],
    weight: StampStyle['fontWeight'],
  ): Promise<PDFFont> {
    const key = `${family}-${weight}`
    let font = this.fontCache.get(key)
    if (!font) {
      font = await this.doc.embedStandardFont(toStandardFont(family, weight))
      this.fontCache.set(key, font)
    }
    return font
  }

  async render(page: PDFPage, instance: StampInstance): Promise<void> {
    if (instance.hidden) return
    const { style, content, placement } = instance
    const boxW = placement.widthPt
    const boxH = placement.heightPt
    const center = toPdfCenterPoint(placement.position, {
      width: page.getWidth(),
      height: page.getHeight(),
    })

    const regularFont = await this.getFont(style.fontFamily, style.fontWeight)
    const boldFont = await this.getFont(style.fontFamily, 'bold')
    let lines = buildStampLines(content, style.fontSize)
    lines = this.fitLines(lines, { regularFont, boldFont }, boxW * 0.82)

    const { r, g, b } = blendTowardWhite(hexToRgb01(style.color), style.opacity)
    const fill = rgb(r, g, b)

    const lineHeight = (lines[0]?.size ?? style.fontSize) * 1.25
    const totalTextH = lines.length * lineHeight
    let cursorY = center.y + totalTextH / 2 - lineHeight * 0.72

    // Rotate the whole stamp around its centre; draw in unrotated space.
    page.pushOperators(
      pushGraphicsState(),
      translate(center.x, center.y),
      rotateDegrees(placement.rotationDeg),
      translate(-center.x, -center.y),
    )

    this.drawBorder(page, center, boxW, boxH, style, fill)

    for (const line of lines) {
      const font = line.bold ? boldFont : regularFont
      const textWidth = font.widthOfTextAtSize(line.text, line.size)
      page.drawText(line.text, {
        x: center.x - textWidth / 2,
        y: cursorY,
        size: line.size,
        font,
        color: fill,
      })
      cursorY -= lineHeight
    }

    page.pushOperators(popGraphicsState())
  }

  private drawBorder(
    page: PDFPage,
    center: { x: number; y: number },
    boxW: number,
    boxH: number,
    style: StampStyle,
    fill: ReturnType<typeof rgb>,
  ): void {
    if (style.borderStyle === 'none') return

    if (style.shape === 'circle' || style.shape === 'oval') {
      page.drawEllipse({
        x: center.x,
        y: center.y,
        xScale: boxW / 2,
        yScale: boxH / 2,
        borderColor: fill,
        borderWidth: style.borderWidth,
      })
      if (style.borderStyle === 'double') {
        page.drawEllipse({
          x: center.x,
          y: center.y,
          xScale: boxW / 2 - style.borderWidth * 2,
          yScale: boxH / 2 - style.borderWidth * 2,
          borderColor: fill,
          borderWidth: Math.max(0.5, style.borderWidth * 0.6),
        })
      }
      return
    }

    const x = center.x - boxW / 2
    const y = center.y - boxH / 2
    const radius = style.shape === 'rounded' ? Math.min(boxW, boxH) * 0.12 : 0
    page.drawRectangle({
      x,
      y,
      width: boxW,
      height: boxH,
      borderColor: fill,
      borderWidth: style.borderWidth,
      ...(radius ? { borderWidth: style.borderWidth } : {}),
    })
    if (style.borderStyle === 'double') {
      page.drawRectangle({
        x: x + style.borderWidth * 2,
        y: y + style.borderWidth * 2,
        width: boxW - style.borderWidth * 4,
        height: boxH - style.borderWidth * 4,
        borderColor: fill,
        borderWidth: Math.max(0.5, style.borderWidth * 0.6),
      })
    }
  }

  /** Shrink font sizes until every line fits within maxWidthPt. */
  private fitLines(
    lines: Line[],
    fonts: { regularFont: PDFFont; boldFont: PDFFont },
    maxWidthPt: number,
  ): Line[] {
    const widthOf = (l: Line): number =>
      (l.bold ? fonts.boldFont : fonts.regularFont).widthOfTextAtSize(l.text, l.size)
    let oversize = lines.some((l) => widthOf(l) > maxWidthPt)
    let guard = 0
    while (oversize && guard < 24) {
      lines = lines.map((l) => ({ ...l, size: l.size * 0.92 }))
      oversize = lines.some((l) => widthOf(l) > maxWidthPt)
      guard += 1
    }
    return lines
  }
}
