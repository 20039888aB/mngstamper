import { useMemo } from 'react'
import type { PageScope, PresetPosition, StampInstance } from '../types/stamp'
import {
  COMMON_DATE_FORMATS,
  type StampShape,
  type BorderStyle,
  type StampFontFamily,
} from '../types/stamp'
import {
  PRESET_ORDER,
  PRESET_POSITIONS,
  resolvePageScope,
} from '../lib/stamp/position'
import { STAMP_COLOR_SWATCHES, STAMP_FONT_OPTIONS } from '../lib/stamp/style'
import { cn } from '../lib/utils'

interface Props {
  stamp: StampInstance
  pageCount: number
  currentPage: number
  onChange: (patch: Partial<StampInstance>) => void
}

const SHAPES: { value: StampShape; label: string }[] = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
  { value: 'oval', label: 'Oval' },
]
const BORDERS: { value: BorderStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'double', label: 'Double' },
  { value: 'none', label: 'None' },
]

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-200 py-3 last:border-0 dark:border-slate-800">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h4>
      {children}
    </section>
  )
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1" role="group">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            'rounded-md border px-2.5 py-1 text-xs font-medium',
            value === o.value
              ? 'border-brand-600 bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
              : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function StampInspector({ stamp, pageCount, currentPage, onChange }: Props) {
  const setPlacement = (patch: Partial<StampInstance['placement']>) =>
    onChange({ placement: { ...stamp.placement, ...patch } })

  const setPageScope = (scope: PageScope) => onChange({ pageScope: scope })

  const stampedCount = useMemo(() => {
    try {
      return resolvePageScope(stamp.pageScope, pageCount, currentPage).length
    } catch {
      return 0
    }
  }, [stamp.pageScope, pageCount, currentPage])

  return (
    <div className="text-sm">
      <Group title="Text">
        <label className="field-label" htmlFor="mainText">Headline</label>
        <input
          id="mainText"
          className="input mb-2 uppercase"
          value={stamp.content.mainText}
          onChange={(e) =>
            onChange({ content: { ...stamp.content, mainText: e.target.value } })
          }
          placeholder="APPROVED"
        />
        <label className="field-label" htmlFor="secText">Secondary</label>
        <input
          id="secText"
          className="input mb-2"
          value={stamp.content.secondaryText}
          onChange={(e) =>
            onChange({ content: { ...stamp.content, secondaryText: e.target.value } })
          }
          placeholder="Optional line"
        />
        <label className="field-label" htmlFor="orgName">Organization</label>
        <input
          id="orgName"
          className="input mb-2"
          value={stamp.content.organizationName}
          onChange={(e) =>
            onChange({ content: { ...stamp.content, organizationName: e.target.value } })
          }
          placeholder="Optimal Family Hospital"
        />
        <label className="field-label" htmlFor="dept">Department</label>
        <input
          id="dept"
          className="input"
          value={stamp.content.department}
          onChange={(e) =>
            onChange({ content: { ...stamp.content, department: e.target.value } })
          }
          placeholder="Administration"
        />
      </Group>

      <Group title="Date">
        <div className="mb-2">
          <Segmented
            value={stamp.content.dateMode}
            onChange={(v) => onChange({ content: { ...stamp.content, dateMode: v } })}
            options={[
              { value: 'current', label: 'Today' },
              { value: 'custom', label: 'Custom' },
              { value: 'none', label: 'No date' },
            ]}
          />
        </div>
        {stamp.content.dateMode === 'custom' && (
          <input
            type="date"
            className="input mb-2"
            value={stamp.content.customDate ?? ''}
            onChange={(e) =>
              onChange({ content: { ...stamp.content, customDate: e.target.value } })
            }
          />
        )}
        <label className="field-label" htmlFor="dateFormat">Format</label>
        <select
          id="dateFormat"
          className="input"
          value={stamp.content.dateFormat}
          onChange={(e) =>
            onChange({ content: { ...stamp.content, dateFormat: e.target.value } })
          }
        >
          {COMMON_DATE_FORMATS.map((f) => (
            <option key={f.pattern} value={f.pattern}>
              {f.label}
            </option>
          ))}
        </select>
        <label className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={stamp.content.showTime}
            onChange={(e) =>
              onChange({ content: { ...stamp.content, showTime: e.target.checked } })
            }
          />
          <span>Include time</span>
        </label>
      </Group>

      <Group title="Appearance">
        <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Stamp color">
          {STAMP_COLOR_SWATCHES.map((s) => (
            <button
              key={s.hex}
              type="button"
              title={s.name}
              onClick={() => onChange({ style: { ...stamp.style, color: s.hex } })}
              aria-pressed={stamp.style.color === s.hex}
              className={cn(
                'h-7 w-7 rounded-full border-2',
                stamp.style.color === s.hex
                  ? 'border-slate-900 dark:border-white'
                  : 'border-transparent',
              )}
              style={{ backgroundColor: s.hex }}
            />
          ))}
          <input
            type="color"
            value={stamp.style.color}
            onChange={(e) => onChange({ style: { ...stamp.style, color: e.target.value } })}
            className="h-7 w-9 cursor-pointer rounded border border-slate-300 bg-transparent"
            aria-label="Custom color"
          />
        </div>

        <label className="field-label">Shape</label>
        <div className="mb-2">
          <Segmented
            value={stamp.style.shape}
            onChange={(v) => onChange({ style: { ...stamp.style, shape: v } })}
            options={SHAPES}
          />
        </div>
        <label className="field-label">Border</label>
        <div className="mb-2">
          <Segmented
            value={stamp.style.borderStyle}
            onChange={(v) => onChange({ style: { ...stamp.style, borderStyle: v } })}
            options={BORDERS}
          />
        </div>
        <label className="field-label">Font</label>
        <div className="mb-2">
          <Segmented
            value={stamp.style.fontFamily}
            onChange={(v: StampFontFamily) => onChange({ style: { ...stamp.style, fontFamily: v } })}
            options={STAMP_FONT_OPTIONS}
          />
        </div>

        <RangeRow
          label={`Opacity ${Math.round(stamp.style.opacity * 100)}%`}
          min={20}
          max={100}
          value={Math.round(stamp.style.opacity * 100)}
          onChange={(v) => onChange({ style: { ...stamp.style, opacity: v / 100 } })}
        />
        <RangeRow
          label={`Text size ${stamp.style.fontSize}pt`}
          min={10}
          max={48}
          value={stamp.style.fontSize}
          onChange={(v) => onChange({ style: { ...stamp.style, fontSize: v } })}
        />
        <label className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            checked={stamp.style.fontWeight === 'bold'}
            onChange={(e) =>
              onChange({ style: { ...stamp.style, fontWeight: e.target.checked ? 'bold' : 'normal' } })
            }
          />
          <span>Bold</span>
        </label>
      </Group>

      <Group title="Position & size">
        <div className="mb-3 grid grid-cols-3 gap-1" role="group" aria-label="Preset positions">
          {PRESET_ORDER.map((p: PresetPosition) => (
            <button
              key={p}
              type="button"
              title={p}
              onClick={() => setPlacement({ position: { ...PRESET_POSITIONS[p] } })}
              className="flex h-8 items-center justify-center rounded border border-slate-300 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              aria-label={p}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
            </button>
          ))}
        </div>
        <RangeRow
          label={`Rotation ${stamp.placement.rotationDeg}°`}
          min={-45}
          max={45}
          value={stamp.placement.rotationDeg}
          onChange={(v) => setPlacement({ rotationDeg: v })}
        />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <NumberField
            label="Width (pt)"
            value={stamp.placement.widthPt}
            onChange={(v) => setPlacement({ widthPt: v })}
          />
          <NumberField
            label="Height (pt)"
            value={stamp.placement.heightPt}
            onChange={(v) => setPlacement({ heightPt: v })}
          />
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          X {stamp.placement.position.xPercent.toFixed(0)}% · Y{' '}
          {stamp.placement.position.yPercent.toFixed(0)}% — drag on the page to move.
        </p>
      </Group>

      <Group title="Apply to pages">
        <div className="mb-2">
          <Segmented
            value={stamp.pageScope.kind}
            onChange={(k) =>
              setPageScope(
                k === 'selected'
                  ? { kind: 'selected', pages: [currentPage] }
                  : k === 'range'
                    ? { kind: 'range', range: `${currentPage}` }
                    : ({ kind: k } as PageScope),
              )
            }
            options={[
              { value: 'current', label: 'This' },
              { value: 'all', label: 'All' },
              { value: 'odd', label: 'Odd' },
              { value: 'even', label: 'Even' },
              { value: 'range', label: 'Range' },
            ]}
          />
        </div>
        {stamp.pageScope.kind === 'range' && (
          <input
            className="input"
            value={stamp.pageScope.range}
            onChange={(e) => setPageScope({ kind: 'range', range: e.target.value })}
            placeholder="e.g. 1-3,5"
            aria-label="Page range"
          />
        )}
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Will be applied to <strong>{stampedCount}</strong> of {pageCount} page(s).
        </p>
      </Group>
    </div>
  )
}

function RangeRow({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="mt-2">
      <label className="field-label">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand-600"
      />
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        type="number"
        className="input"
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
