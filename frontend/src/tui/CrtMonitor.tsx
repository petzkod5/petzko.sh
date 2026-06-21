import { useEffect, useRef, type ReactNode } from 'react'
import styles from './CrtMonitor.module.css'

interface CrtMonitorProps {
  children: ReactNode
}

// Degauss: the brief brightness/colour surge and geometry shudder a CRT makes
// when it realigns the picture — played here on every theme change so swapping
// palettes feels like the tube re-magnetising. Driven by the Web Animations API
// rather than a CSS class so it composites over the screen's existing `power-on`
// mount animation without clobbering or re-triggering it. Whole-screen: it runs
// on `.screen`, so content *and* the scanline/sweep/vignette overlays wobble as
// one image.
const DEGAUSS: Keyframe[] = [
  { offset: 0, filter: 'brightness(1) saturate(1)', transform: 'scale(1)' },
  {
    offset: 0.07,
    filter: 'brightness(1.7) saturate(2) hue-rotate(12deg)',
    transform: 'scale(1.015) translate(3px, -2px)',
  },
  {
    offset: 0.16,
    filter: 'brightness(0.8) saturate(0.6)',
    transform: 'scale(1.004) translate(-4px, 2px)',
  },
  {
    offset: 0.27,
    filter: 'brightness(1.45) saturate(1.7) hue-rotate(-8deg)',
    transform: 'scale(1.012) translate(3px, 1px)',
  },
  {
    offset: 0.4,
    filter: 'brightness(0.92) saturate(0.9)',
    transform: 'scale(1.003) translate(-2px, -1px)',
  },
  {
    offset: 0.55,
    filter: 'brightness(1.18) saturate(1.25)',
    transform: 'scale(1.006) translate(1px, 1px)',
  },
  {
    offset: 0.72,
    filter: 'brightness(0.99) saturate(1)',
    transform: 'scale(1.001) translate(-1px, 0)',
  },
  { offset: 1, filter: 'brightness(1) saturate(1)', transform: 'scale(1) translate(0, 0)' },
]

/**
 * A faux CRT monitor: a CSS-drawn plastic bezel wrapping a phosphor screen.
 * The screen layers scanlines, a vignette/curvature, a slow scan sweep, and a
 * subtle flicker over its content — the cool-retro-term look, done in CSS
 * (DESIGN.md §6). Everything below the bezel renders on the screen.
 */
export function CrtMonitor({ children }: CrtMonitorProps) {
  const screenRef = useRef<HTMLDivElement>(null)

  // Replay a degauss whenever the active theme changes — from any source (the
  // `t` key, the header button, or the `:theme` command) — by observing the
  // <html data-theme> attribute, so this stays decoupled from the theme state.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let anim: Animation | null = null
    const obs = new MutationObserver(() => {
      const screen = screenRef.current
      if (!screen || reduce.matches) return
      anim?.cancel() // restart cleanly if themes are switched in quick succession
      anim = screen.animate(DEGAUSS, { duration: 700, easing: 'linear' })
    })
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => {
      obs.disconnect()
      anim?.cancel()
    }
  }, [])

  return (
    <div className={styles.bezel}>
      <div className={styles.screen} ref={screenRef}>
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
