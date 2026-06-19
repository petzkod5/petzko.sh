import type { ReactNode } from 'react'
import styles from './CrtMonitor.module.css'

interface CrtMonitorProps {
  children: ReactNode
}

/**
 * A faux CRT monitor: a CSS-drawn plastic bezel wrapping a phosphor screen.
 * The screen layers scanlines, a vignette/curvature, a slow scan sweep, and a
 * subtle flicker over its content — the cool-retro-term look, done in CSS
 * (DESIGN.md §6). Everything below the bezel renders on the screen.
 */
export function CrtMonitor({ children }: CrtMonitorProps) {
  return (
    <div className={styles.bezel}>
      <div className={styles.screen}>
        <div className={styles.content}>{children}</div>
        <div className={styles.sweep} aria-hidden="true" />
        <div className={styles.scanlines} aria-hidden="true" />
        <div className={styles.flicker} aria-hidden="true" />
        <div className={styles.vignette} aria-hidden="true" />
      </div>
      <span className={styles.led} aria-hidden="true" />
      <span className={styles.brand} aria-hidden="true">
        petzko.sh
      </span>
    </div>
  )
}
