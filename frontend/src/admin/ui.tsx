import type { ReactNode } from 'react'
import s from './admin.module.css'

/** Labelled field wrapper with an optional right-aligned meta note. */
export function Field({
  label,
  meta,
  children,
}: {
  label: string
  meta?: ReactNode
  children: ReactNode
}) {
  return (
    <label className={s.field}>
      <span className={s.fieldHead}>
        <span className={s.fieldLabel}>{label}</span>
        {meta != null && <span className={s.fieldMeta}>{meta}</span>}
      </span>
      {children}
    </label>
  )
}

/** A small toggle styled as a checkbox chip. */
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      className={`${s.toggle} ${checked ? s.toggleOn : ''}`}
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <span className={s.toggleBox}>{checked ? '✓' : ''}</span>
      {label}
    </button>
  )
}

/** Up / down / delete controls for a list row. */
export function RowControls({
  index,
  count,
  onMove,
  onDelete,
}: {
  index: number
  count: number
  onMove: (from: number, to: number) => void
  onDelete: (index: number) => void
}) {
  return (
    <div className={s.rowControls}>
      <button
        type="button"
        className={s.iconBtn}
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
        aria-label="Move up"
        title="Move up"
      >
        ↑
      </button>
      <button
        type="button"
        className={s.iconBtn}
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
        aria-label="Move down"
        title="Move down"
      >
        ↓
      </button>
      <button
        type="button"
        className={`${s.iconBtn} ${s.iconBtnDanger}`}
        onClick={() => onDelete(index)}
        aria-label="Delete"
        title="Delete"
      >
        ✕
      </button>
    </div>
  )
}

/** Immutably move an array element from one index to another. */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr
  const next = arr.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
