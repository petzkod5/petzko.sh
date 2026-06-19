import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { appVersion, buildEnv } from '@/config'
import { useNavStack } from '@/state/useNavStack'
import { About } from '@/sections/About'
import { Contact } from '@/sections/Contact'
import { Portfolio } from '@/sections/Portfolio'
import { Breadcrumb } from './Breadcrumb'
import { Help } from './Help'
import styles from './Tui.module.css'

// pdf.js is heavy — load the resume section only when it's opened.
const Resume = lazy(() => import('@/sections/Resume'))

interface TuiProps {
  /** True during the BUILDING_TUI phase — applies the assemble-in animation. */
  building?: boolean
}

/** ASCII "DP" mark for the header (k9s renders its logo top-right). */
const DP_ASCII = `██████╗ ██████╗
██╔══██╗██╔══██╗
██║  ██║██████╔╝
██║  ██║██╔═══╝
██████╔╝██║
╚═════╝ ╚═╝`

/** The four navigable sections (DESIGN.md §7), as a k9s-style resource table. */
const SECTIONS = [
  { name: 'about', key: 'a', type: 'markdown', status: 'ready' },
  { name: 'portfolio', key: 'p', type: 'table', status: 'ready' },
  { name: 'blog', key: 'b', type: 'log', status: 'ready' },
  { name: 'resume', key: 'r', type: 'document', status: 'ready' },
  { name: 'contact', key: 'c', type: 'links', status: 'ready' },
] as const

const CONTEXT = [
  ['Context', 'petzko.sh'],
  ['Host', 'rivendell'],
  ['Build', `${buildEnv} · v${appVersion}`],
  ['Sections', String(SECTIONS.length)],
] as const

/**
 * Phase 2/3 shell (DESIGN.md §6–§7), styled after k9s: a context block, an
 * ASCII logo, a titled resource table, a help overlay, and a breadcrumb layer
 * stack. j/k (or arrows) move the selection; a section's letter, Enter, or a
 * click drills in (pushing a layer); esc pops back toward <home>.
 */
export function Tui({ building = false }: TuiProps) {
  const [selected, setSelected] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  const [cmdMode, setCmdMode] = useState(false)
  const [cmdValue, setCmdValue] = useState('')
  const { stack, current, atRoot, push, pop, goTo } = useNavStack()
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollIdle = useRef<number>()
  const [canScrollDown, setCanScrollDown] = useState(false)

  // True when the active pane has more *content* below the fold. The pane's
  // bottom padding (slack for the chevron) is excluded so reaching the last
  // row — by scrolling or by keyboard selection — clears the hint.
  const recomputeScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) {
      setCanScrollDown(false)
      return
    }
    const padBottom = parseFloat(getComputedStyle(el).paddingBottom) || 0
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
    setCanScrollDown(remaining > padBottom + 4)
  }, [])

  // Phosphor persistence: while the pane is moving, smear it (the `.scrolling`
  // class blurs + lifts brightness); when scrolling stops we drop the class and
  // the base transition eases it back to sharp — the image "decays" like a CRT.
  const onScrollPane = useCallback(() => {
    recomputeScroll()
    const el = scrollRef.current
    if (!el) return
    el.classList.add(styles.scrolling)
    window.clearTimeout(scrollIdle.current)
    scrollIdle.current = window.setTimeout(() => {
      el.classList.remove(styles.scrolling)
    }, 80)
  }, [recomputeScroll])

  // Recompute on view change, viewport resize, and async content (e.g. the PDF
  // canvas or images) appearing.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      setCanScrollDown(false)
      return
    }
    recomputeScroll()
    const ro = new ResizeObserver(recomputeScroll)
    ro.observe(el)
    const mo = new MutationObserver(recomputeScroll)
    mo.observe(el, { childList: true, subtree: true })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [recomputeScroll, current, showHelp, atRoot])

  useEffect(() => {
    const open = (i: number) => {
      setSelected(i)
      push({ id: SECTIONS[i].name, label: SECTIONS[i].name })
    }

    const onKey = (e: KeyboardEvent) => {
      // Ignore global keys while typing in a field (the command input).
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return

      // `:` opens command mode from anywhere.
      if (e.key === ':') {
        e.preventDefault()
        setShowHelp(false)
        setCmdMode(true)
        return
      }
      if (e.key === '?') {
        e.preventDefault()
        setShowHelp((h) => !h)
        return
      }
      if (showHelp) {
        if (e.key === 'Escape') {
          e.preventDefault()
          setShowHelp(false)
        }
        return // ignore navigation while help is open
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        pop() // pop the top-most layer (no-op at <home>)
        return
      }
      // Inside a section: j/k/arrows (and g/G, space/PageUp-Down) scroll the pane.
      if (!atRoot) {
        // Grid sections handle their own keys.
        if (current.id === 'contact' || current.id === 'portfolio') return
        const el = scrollRef.current
        if (!el) return
        switch (e.key) {
          case 'ArrowDown':
          case 'j':
            e.preventDefault()
            el.scrollBy({ top: 56 })
            break
          case 'ArrowUp':
          case 'k':
            e.preventDefault()
            el.scrollBy({ top: -56 })
            break
          case 'g':
          case 'Home':
            e.preventDefault()
            el.scrollTo({ top: 0 })
            break
          case 'G':
          case 'End':
            e.preventDefault()
            el.scrollTo({ top: el.scrollHeight })
            break
          case ' ':
          case 'PageDown':
            e.preventDefault()
            el.scrollBy({ top: el.clientHeight * 0.9 })
            break
          case 'PageUp':
            e.preventDefault()
            el.scrollBy({ top: -el.clientHeight * 0.9 })
            break
        }
        return
      }

      // Home list: j/k/arrows move the selection; letters/Enter drill in.
      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault()
          setSelected((i) => Math.min(i + 1, SECTIONS.length - 1))
          break
        case 'ArrowUp':
        case 'k':
          e.preventDefault()
          setSelected((i) => Math.max(i - 1, 0))
          break
        case 'g':
        case 'Home':
          e.preventDefault()
          setSelected(0)
          break
        case 'G':
        case 'End':
          e.preventDefault()
          setSelected(SECTIONS.length - 1)
          break
        case 'Enter':
          e.preventDefault()
          open(selected)
          break
        default: {
          const idx = SECTIONS.findIndex((s) => s.key === e.key)
          if (idx !== -1) {
            e.preventDefault()
            open(idx)
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showHelp, atRoot, selected, push, pop, current])

  const openSection = (i: number) => {
    setSelected(i)
    push({ id: SECTIONS[i].name, label: SECTIONS[i].name })
  }

  const closeCmd = () => {
    setCmdMode(false)
    setCmdValue('')
  }

  // Run a `:command` — jump to a section, or to the admin (coming soon) page.
  const runCommand = (raw: string) => {
    const v = raw.trim().toLowerCase()
    closeCmd()
    if (!v) return
    const section = SECTIONS.find((s) => s.name === v)
    if (section) goTo({ id: section.name, label: section.name })
    else if (v === 'admin') goTo({ id: 'admin', label: 'admin' })
    // unknown command: ignore
  }

  const onCmdKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      runCommand(cmdValue)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeCmd()
    }
  }

  const title = showHelp ? 'Help' : atRoot ? 'Sections' : current.label

  return (
    <div className={`${styles.tui} ${building ? styles.building : ''}`}>
      {/* ── Header ── */}
      <header className={styles.top}>
        <dl className={styles.context}>
          {CONTEXT.map(([k, v]) => (
            <div key={k} className={styles.ctxRow}>
              <dt className={styles.ctxKey}>{k}:</dt>
              <dd className={styles.ctxVal}>{v}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.keys}>
          <div className={styles.keyRow}>
            <span className={styles.hk}>&lt;?&gt;</span> Help
          </div>
        </div>

        <pre className={styles.logo} aria-label="dp">
          {DP_ASCII}
        </pre>
      </header>

      {/* ── Command line (k9s-style), above the viewport when active ── */}
      {cmdMode && (
        <div className={styles.cmdline}>
          <span className={styles.cmdPrompt}>:</span>
          <input
            className={styles.cmdInput}
            autoFocus
            value={cmdValue}
            onChange={(e) => setCmdValue(e.target.value)}
            onKeyDown={onCmdKey}
            onBlur={closeCmd}
            placeholder="about · portfolio · blog · resume · contact"
            spellCheck={false}
            autoComplete="off"
            aria-label="Command"
          />
        </div>
      )}

      {/* ── Main pane: resource table, section, or help overlay ── */}
      <main className={styles.panel}>
        <span className={styles.panelTitle}>
          {title}
          {!showHelp && atRoot && (
            <span className={styles.count}>[{SECTIONS.length}]</span>
          )}
        </span>

        <div className={styles.scroll} ref={scrollRef} onScroll={onScrollPane}>
          {showHelp ? (
            <Help sections={SECTIONS} />
          ) : atRoot ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>KEY</th>
                  <th>TYPE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {SECTIONS.map((s, i) => (
                  <tr
                    key={s.name}
                    className={`${styles.row} ${i === selected ? styles.rowSel : ''}`}
                    onMouseEnter={() => setSelected(i)}
                    onClick={() => openSection(i)}
                    aria-selected={i === selected}
                  >
                    <td>{s.name}</td>
                    <td>{s.key}</td>
                    <td>{s.type}</td>
                    <td>{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : current.id === 'about' ? (
            <About />
          ) : current.id === 'contact' ? (
            <Contact />
          ) : current.id === 'portfolio' ? (
            <Portfolio />
          ) : current.id === 'resume' ? (
            <Suspense fallback={<p className={styles.placeholder}>loading resume…</p>}>
              <Resume />
            </Suspense>
          ) : (
            <p className={styles.placeholder}>
              {current.label} — content coming soon. Press{' '}
              <span className={styles.hk}>&lt;esc&gt;</span> to go back.
            </p>
          )}
        </div>

        {/* "More below" affordance — fades in/out; pulses while scrollable. */}
        <div
          className={`${styles.scrollHint} ${
            canScrollDown ? styles.scrollHintVisible : ''
          }`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 12" width="22" height="11">
            <path
              d="M2 2 L12 10 L22 2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </main>

      {/* ── Status bar: navigation layer stack ── */}
      <footer className={styles.status}>
        <Breadcrumb stack={stack} />
        <span className={styles.statusHint}>
          {building
            ? 'constructing…'
            : showHelp || !atRoot
              ? '<esc> back'
              : '<?> help'}
        </span>
      </footer>
    </div>
  )
}
