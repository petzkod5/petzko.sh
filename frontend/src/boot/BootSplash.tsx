import { useEffect, useRef, useState } from 'react'
import styles from './BootSplash.module.css'

interface BootSplashProps {
  /** Called when the skip affordance is clicked */
  onSkip: () => void
}

interface BootLine {
  text: string
  /** Delay (ms) after the previous line before this one appears. */
  after: number
  /** Animate a memory-test counter at the end of this line. */
  mem?: boolean
}

const POWER_ON_MS = 420 // CRT turn-on flash before any text
const POST_TAIL_MS = 320 // beat after the POST log before the welcome card
const MEM_TARGET = 640 // 640K ought to be enough for anybody
const MEM_ANIM_MS = 400

type Stage = 'post' | 'welcome'

/**
 * Fake power-on self-test, revealed line by line. Playful, petzko-specific.
 * When it finishes, the boot hands off to the classic "Welcome" loading card.
 */
const LINES: BootLine[] = [
  { text: 'PETZKO BIOS v1.0.337            (c) 1984 petzko systems', after: 0 },
  { text: '', after: 90 },
  { text: 'Main Processor  : 6502 @ 1.023 MHz', after: 160 },
  { text: 'Memory Test     : ', after: 150, mem: true },
  { text: '', after: 360 },
  { text: 'Detecting devices ...', after: 200 },
  { text: '  [ OK ]   hda      rivendell-talos', after: 150 },
  { text: '  [ OK ]   eth0     tailscale0', after: 150 },
  { text: '  [ OK ]   display  phosphor 80x25', after: 150 },
  { text: '', after: 90 },
  { text: 'Loading petzko.sh ................ done', after: 220 },
  { text: '', after: 90 },
  { text: 'petzko.sh login: guest', after: 200 },
  { text: 'Last login: Wed Jun 18 2026 on tty1', after: 160 },
]

const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function lineContent(line: BootLine, memText: string) {
  if (line.mem) {
    return (
      <>
        {line.text}
        <span className={styles.mem}>{memText}</span>
      </>
    )
  }
  if (line.text.includes('[ OK ]')) {
    const [before, after] = line.text.split('[ OK ]')
    return (
      <>
        {before}
        <span className={styles.ok}>[ OK ]</span>
        {after}
      </>
    )
  }
  // Non-breaking space keeps blank lines from collapsing.
  return line.text || ' '
}

export function BootSplash({ onSkip }: BootSplashProps) {
  const [stage, setStage] = useState<Stage>(prefersReduced ? 'welcome' : 'post')
  const [revealed, setRevealed] = useState(prefersReduced ? LINES.length : 0)
  const [mem, setMem] = useState(prefersReduced ? MEM_TARGET : 0)
  const [memDone, setMemDone] = useState(prefersReduced)
  const [showSkip, setShowSkip] = useState(false)
  const rafRef = useRef<number | undefined>(undefined)

  // Reveal each POST line on its cumulative schedule; animate the memory
  // counter when its line appears; then hand off to the welcome card.
  useEffect(() => {
    if (prefersReduced) return

    const animateMem = () => {
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / MEM_ANIM_MS, 1)
        setMem(Math.round(p * MEM_TARGET))
        if (p < 1) rafRef.current = requestAnimationFrame(tick)
        else setMemDone(true)
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    const timers: number[] = []
    let t = POWER_ON_MS
    LINES.forEach((line, i) => {
      t += line.after
      timers.push(
        window.setTimeout(() => {
          setRevealed(i + 1)
          if (line.mem) animateMem()
        }, t),
      )
    })
    // After the last line, flip to the classic welcome loading card.
    timers.push(window.setTimeout(() => setStage('welcome'), t + POST_TAIL_MS))

    return () => {
      timers.forEach(clearTimeout)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Show skip hint after 1.5 s
  useEffect(() => {
    const t = window.setTimeout(() => setShowSkip(true), 1500)
    return () => clearTimeout(t)
  }, [])

  const memText = `${String(mem).padStart(5, '0')}K${memDone ? '  OK' : ''}`

  return (
    <div className={styles.splash} aria-busy="true" aria-label="Loading">
      {stage === 'post' ? (
        <>
          <div className={styles.powerOn} aria-hidden="true" />
          <pre className={styles.log}>
            {LINES.slice(0, revealed).map((line, i) => (
              <div key={i} className={styles.line}>
                {lineContent(line, memText)}
                {i === revealed - 1 && (
                  <span className={styles.cursor} aria-hidden="true">
                    {' '}
                  </span>
                )}
              </div>
            ))}
          </pre>
        </>
      ) : (
        <div className={styles.welcome}>
          <div className={styles.box}>
            <div className={styles.iconCol}>
              <span className={styles.disk}>C:</span>
            </div>
            <div className={styles.right}>
              <p className={styles.welcomeText}>Welcome to petzko.sh</p>
              <div className={styles.bar}>
                <div className={styles.fill} />
              </div>
            </div>
          </div>
        </div>
      )}

      {showSkip && (
        <button
          className={styles.skip}
          onClick={onSkip}
          aria-label="Skip boot sequence"
        >
          press any key to skip ▸
        </button>
      )}
    </div>
  )
}
