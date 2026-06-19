import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * 2D keyboard navigation for a CSS-grid of tiles (used by Contact & Portfolio).
 * Down/up move a full row (column count read from the live grid so it adapts to
 * the responsive layout); left/right move within the row. Enter activates the
 * selection. Returns the selected index plus a ref to attach to the selected
 * tile so it scrolls into view.
 */
export function useGridNav(
  count: number,
  gridRef: RefObject<HTMLElement>,
  onActivate: (index: number) => void,
) {
  const [sel, setSel] = useState(0)
  const selRef = useRef<HTMLDivElement>(null)
  const activate = useRef(onActivate)
  activate.current = onActivate

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!count) return
      // Ignore while the user is typing in a field (e.g. command mode).
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
      const el = gridRef.current
      const cols = el
        ? getComputedStyle(el)
            .gridTemplateColumns.split(' ')
            .filter(Boolean).length
        : 1
      const col = sel % cols
      switch (e.key) {
        case 'ArrowRight':
        case 'l':
          e.preventDefault()
          if (col < cols - 1 && sel + 1 < count) setSel(sel + 1)
          break
        case 'ArrowLeft':
        case 'h':
          e.preventDefault()
          if (col > 0) setSel(sel - 1)
          break
        case 'ArrowDown':
        case 'j': {
          e.preventDefault()
          // Move directly below if that item exists; otherwise (the last row is
          // partial) drop to the nearest item in the next row, so down never
          // dead-ends while rows remain.
          const rowStart = Math.floor(sel / cols) * cols
          if (rowStart + cols < count) setSel(Math.min(sel + cols, count - 1))
          break
        }
        case 'ArrowUp':
        case 'k':
          e.preventDefault()
          if (sel - cols >= 0) setSel(sel - cols)
          break
        case 'g':
        case 'Home':
          e.preventDefault()
          setSel(0)
          break
        case 'G':
        case 'End':
          e.preventDefault()
          setSel(count - 1)
          break
        case 'Enter':
          e.preventDefault()
          activate.current(sel)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sel, count, gridRef])

  // Keep the selected tile visible in the scroll container.
  useEffect(() => {
    selRef.current?.scrollIntoView({ block: 'nearest' })
  }, [sel])

  return { sel, setSel, selRef }
}
