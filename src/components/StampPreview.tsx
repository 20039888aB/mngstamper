import type { StampInstance } from '../types/stamp'
import { buildStampLines } from '../lib/stamp/renderer'

interface Props {
  stamp: Pick<StampInstance, 'content' | 'style' | 'placement'>
  /** Rendered box width in CSS pixels. */
  widthPx?: number
}

const FONT_STACK: Record<StampInstance['style']['fontFamily'], string> = {
  helvetica: 'Helvetica, Arial, sans-serif',
  times: 'Times New Roman, serif',
  courier: 'Courier New, monospace',
}

/**
 * Static visual preview of a stamp's ink — no page, no dragging. Used in the
 * template gallery, the designer canvas, and dashboard cards.
 */
export function StampPreview({ stamp, widthPx = 160 }: Props) {
  const { content, style, placement } = stamp
  const aspect = placement.heightPt / placement.widthPt || 0.5
  const heightPx = widthPx * aspect
  const lines = buildStampLines(content, style.fontSize)
  const lineHeight = (lines[0]?.size ?? style.fontSize) * 1.2
  const radius =
    style.shape === 'circle' || style.shape === 'oval'
      ? '50%'
      : style.shape === 'rounded'
        ? Math.min(widthPx, heightPx) * 0.12
        : 6

  const border =
    style.borderStyle === 'none'
      ? 'none'
      : `${Math.max(1.5, style.borderWidth)}px ${style.borderStyle === 'double' ? 'double' : 'solid'} ${style.color}`

  return (
    <div
      className="flex items-center justify-center overflow-hidden text-center leading-none"
      style={{
        width: widthPx,
        height: heightPx,
        borderRadius: radius,
        border,
        color: style.color,
        opacity: style.opacity,
        fontFamily: FONT_STACK[style.fontFamily],
        transform: `rotate(${placement.rotationDeg}deg)`,
      }}
    >
      <div className="flex flex-col items-center justify-center px-1">
        {lines.map((line, i) => (
          <span
            key={i}
            style={{
              fontSize: Math.max(8, (line.size / placement.widthPt) * widthPx),
              fontWeight: line.bold ? 700 : 400,
              lineHeight: `${Math.max(9, (lineHeight / placement.widthPt) * widthPx)}px`,
            }}
          >
            {line.text}
          </span>
        ))}
      </div>
    </div>
  )
}
