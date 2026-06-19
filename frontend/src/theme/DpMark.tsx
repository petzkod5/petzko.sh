interface DpMarkProps {
  /** Rendered height in px — the mark is square, so width matches. */
  height?: number
  className?: string
}

/**
 * The "dp" brand mark — a circular monogram badge (DESIGN.md §5).
 * Served as a transparent PNG (cropped from the source artwork) out of /public.
 */
export function DpMark({ height = 80, className }: DpMarkProps) {
  return (
    <img
      src="/dp-logo.png"
      width={height}
      height={height}
      alt="dp"
      className={className}
      draggable={false}
    />
  )
}
