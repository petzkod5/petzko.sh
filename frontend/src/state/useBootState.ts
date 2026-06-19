import { useEffect, useRef, useState } from 'react'

export type BootPhase = 'BOOTING' | 'BUILDING_TUI' | 'READY'

const MIN_BOOT_MS = 5000 // minimum splash duration (DESIGN.md §5: ~5–6s floor)
const BUILD_TUI_MS = 1800 // how long the "TUI builds itself in" phase runs
const SKIP_ARMED_MS = 1500 // skip affordance arms after this delay

/**
 * Drives the three-phase intro state machine (DESIGN.md §4):
 *
 *   BOOTING ──(content ready && minTime ≥ ~5.5s)──▶ BUILDING_TUI ──▶ READY
 *      │                                                              ▲
 *      └────── skip key / click / prefers-reduced-motion ─────────────┘
 *
 * - BOOTING → BUILDING_TUI fires only when BOTH the minimum display time has
 *   elapsed AND the page has finished loading.
 * - BUILDING_TUI → READY fires after a fixed assemble animation window.
 * - A keydown/click (once armed) or prefers-reduced-motion short-circuits
 *   straight to READY.
 */
export function useBootState(): {
  phase: BootPhase
  skip: () => void
} {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [phase, setPhase] = useState<BootPhase>(
    prefersReduced ? 'READY' : 'BOOTING',
  )

  const minElapsed = useRef(false)
  const pageLoaded = useRef(false)

  // Skip jumps straight to the interactive TUI, regardless of current phase.
  const skip = () => setPhase('READY')

  // BOOTING → BUILDING_TUI gate (both conditions must hold).
  const tryAdvance = () => {
    if (minElapsed.current && pageLoaded.current) {
      setPhase((p) => (p === 'BOOTING' ? 'BUILDING_TUI' : p))
    }
  }

  useEffect(() => {
    if (prefersReduced) return

    // 1. Minimum splash timer.
    const minTimer = window.setTimeout(() => {
      minElapsed.current = true
      tryAdvance()
    }, MIN_BOOT_MS)

    // 2. Page-load gate.
    const onLoad = () => {
      pageLoaded.current = true
      tryAdvance()
    }
    if (document.readyState === 'complete') {
      pageLoaded.current = true
      tryAdvance()
    } else {
      window.addEventListener('load', onLoad, { once: true })
    }

    // 3. Skip on any key/click, armed after a short delay so a stray keypress
    //    during the first moment doesn't blow past the splash instantly.
    let skipArmed = false
    const armTimer = window.setTimeout(() => {
      skipArmed = true
    }, SKIP_ARMED_MS)
    const onSkipEvent = () => {
      if (skipArmed) skip()
    }
    window.addEventListener('keydown', onSkipEvent)
    window.addEventListener('click', onSkipEvent)

    return () => {
      clearTimeout(minTimer)
      clearTimeout(armTimer)
      window.removeEventListener('load', onLoad)
      window.removeEventListener('keydown', onSkipEvent)
      window.removeEventListener('click', onSkipEvent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // BUILDING_TUI → READY after the assemble window.
  useEffect(() => {
    if (phase !== 'BUILDING_TUI') return
    const t = window.setTimeout(() => setPhase('READY'), BUILD_TUI_MS)
    return () => clearTimeout(t)
  }, [phase])

  return { phase, skip }
}
