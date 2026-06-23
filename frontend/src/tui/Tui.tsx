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
import { useNavStack, type Layer } from '@/state/useNavStack'
import { useTheme, type Theme } from '@/state/useTheme'
import { About } from '@/sections/About'
import { Contact } from '@/sections/Contact'
import { Portfolio } from '@/sections/Portfolio'
import { Stats } from '@/sections/Stats'
import { System } from '@/sections/System'
import { Breadcrumb } from './Breadcrumb'
import { Help } from './Help'
import { SignModal } from './SignModal'
import { SIGNED_EVENT } from '@/api/guestbook'
import styles from './Tui.module.css'

// pdf.js is heavy — load the resume section only when it's opened.
const Resume = lazy(() => import('@/sections/Resume'))

// The admin panel (editors, store, ~640 lines of off-theme CSS) is a single-user
// feature behind Cloudflare Access — code-split it out of the main bundle so
// public visitors never download it; fetched only when `:admin` is invoked.
const AdminOverlay = lazy(() =>
  import('@/admin/AdminOverlay').then((m) => ({ default: m.AdminOverlay })),
)

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
  { name: 'stats', key: 's', type: 'metrics', status: 'soon' },
  { name: 'system', key: 'y', type: 'telemetry', status: 'ready' },
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
  const [showSign, setShowSign] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [cmdMode, setCmdMode] = useState(false)
  const [cmdValue, setCmdValue] = useState('')
  const { stack, current, atRoot, push, pop, goTo } = useNavStack()
  const { cycle: cycleTheme, setTheme, themes } = useTheme()
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollIdle = useRef<number | undefined>(undefined)
  const [canScrollDown, setCanScrollDown] = useState(false)

  // Mirror the latest overlay/nav state so the once-registered popstate
  // listener can read current values without re-subscribing.
  const navRef = useRef({ showHelp, cmdMode, atRoot })
  navRef.current = { showHelp, cmdMode, atRoot }

  const closeCmd = useCallback(() => {
    setCmdMode(false)
    setCmdValue('')
  }, [])

  const toggleCmd = useCallback(() => {
    if (navRef.current.cmdMode) {
      closeCmd()
    } else {
      setShowHelp(false)
      setCmdMode(true)
    }
  }, [closeCmd])

  // Drill into a section, pushing a browser history entry so the device Back
  // gesture/button (and desktop browser Back) pops back out.
  const enterSection = useCallback(
    (i: number) => {
      setSelected(i)
      push({ id: SECTIONS[i].name, label: SECTIONS[i].name })
      window.history.pushState({ petzkoNav: true }, '')
    },
    [push],
  )

  // Jump straight to a section (command / breadcrumb). Keep history exactly one
  // section-level deep regardless of where the jump came from.
  const jumpTo = useCallback(
    (layer: Layer) => {
      const wasRoot = navRef.current.atRoot
      goTo(layer)
      if (wasRoot) window.history.pushState({ petzkoNav: true }, '')
      else window.history.replaceState({ petzkoNav: true }, '')
    },
    [goTo],
  )

  // Unified back/close: dismiss an open overlay first (overlays aren't tracked
  // in history), otherwise step back through history so the device Back gesture
  // and in-app Back stay in sync.
  const goBack = useCallback(() => {
    if (navRef.current.cmdMode) {
      closeCmd()
      return
    }
    if (navRef.current.showHelp) {
      setShowHelp(false)
      return
    }
    if (!navRef.current.atRoot) window.history.back()
  }, [closeCmd])

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

  // Device/browser Back → pop the top-most thing. Overlays (which don't push a
  // history entry) are closed first, re-pushing a state so we stay on the
  // current section; otherwise pop a navigation layer.
  useEffect(() => {
    const onPop = () => {
      const s = navRef.current
      if (s.cmdMode) {
        closeCmd()
        window.history.pushState({ petzkoNav: true }, '')
        return
      }
      if (s.showHelp) {
        setShowHelp(false)
        window.history.pushState({ petzkoNav: true }, '')
        return
      }
      pop()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [pop, closeCmd])

  // Returning from the Cloudflare Access login, the Worker bounces to `?admin=1`
  // — open the admin overlay and strip the param so a refresh won't reopen it.
  // Runs once the TUI is live (not during the build animation).
  useEffect(() => {
    if (building) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('admin') !== '1') return
    setShowAdmin(true)
    params.delete('admin')
    const qs = params.toString()
    window.history.replaceState(
      { petzkoNav: true },
      '',
      window.location.pathname + (qs ? `?${qs}` : ''),
    )
  }, [building])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore global keys while typing in a field (the command input).
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return

      // The sign modal / admin overlay own all keys while open.
      if (showSign || showAdmin) return

      // `:` opens command mode from anywhere.
      if (e.key === ':') {
        e.preventDefault()
        toggleCmd()
        return
      }
      if (e.key === '?') {
        e.preventDefault()
        setShowHelp((h) => !h)
        return
      }
      // `t` cycles the CRT colour theme from anywhere (green → amber → ibm →
      // white → …). Safe globally: it's not a section shortcut, and typing in a
      // field is already excluded above.
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        cycleTheme()
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
        goBack() // close overlay or pop a layer (no-op at <home>)
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
          enterSection(selected)
          break
        default: {
          const idx = SECTIONS.findIndex((s) => s.key === e.key)
          if (idx !== -1) {
            e.preventDefault()
            enterSection(idx)
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showHelp, showSign, showAdmin, atRoot, selected, current, enterSection, goBack, toggleCmd, cycleTheme])

  // Run a `:command` — jump to a section, or to the admin (coming soon) page.
  const runCommand = (raw: string) => {
    const v = raw.trim().toLowerCase()
    closeCmd()
    if (!v) return
    if (v === 'sign') return setShowSign(true) // hidden guest-log easter egg
    // `:theme <name>` switches the CRT palette; bare `:theme` cycles; an
    // unknown name is a no-op (consistent with other unknown commands).
    const [cmd, arg] = v.split(/\s+/)
    if (cmd === 'theme') {
      if (!arg) cycleTheme()
      else if ((themes as readonly string[]).includes(arg)) setTheme(arg as Theme)
      return
    }
    const section = SECTIONS.find((s) => s.name === v)
    if (section) jumpTo({ id: section.name, label: section.name })
    else if (v === 'top') jumpTo({ id: 'system', label: 'system' }) // `:top` → system
    else if (v === 'admin') setShowAdmin(true)
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
          <button
            type="button"
            className={styles.keyBtn}
            onClick={() => setShowHelp((h) => !h)}
            aria-label="Toggle help"
          >
            <span className={styles.hk}>&lt;?&gt;</span> Help
          </button>
          <button
            type="button"
            className={styles.keyBtn}
            // Don't steal focus from the command input, so clicking this while
            // it's open toggles it closed instead of blur-closing + reopening.
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleCmd}
            aria-label="Toggle commands"
          >
            <span className={styles.hk}>&lt;:&gt;</span> Commands
          </button>
          <button
            type="button"
            className={styles.keyBtn}
            // Tappable theme cycling for touch users (the `t` key does the same).
            onMouseDown={(e) => e.preventDefault()}
            onClick={cycleTheme}
            aria-label="Cycle theme"
          >
            <span className={styles.hk}>&lt;t&gt;</span> Theme
          </button>
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
            placeholder="about · portfolio · blog · resume · contact · stats · theme"
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
                    onClick={() => enterSection(i)}
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
          ) : current.id === 'stats' ? (
            <Stats />
          ) : current.id === 'system' ? (
            <System />
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

      {/* ── Status bar: navigation layer stack + tappable actions ── */}
      <footer className={styles.status}>
        <Breadcrumb
          stack={stack}
          onNavigate={(i) => {
            const steps = stack.length - 1 - i
            if (steps > 0) window.history.go(-steps)
          }}
        />
        {building ? (
          <span className={styles.statusHint}>constructing…</span>
        ) : showHelp || !atRoot ? (
          // Clickable so touch users can go back without a keyboard.
          <button
            type="button"
            className={styles.statusHint}
            onClick={goBack}
            aria-label="Back"
          >
            &lt;esc&gt; back
          </button>
        ) : (
          <button
            type="button"
            className={styles.statusHint}
            onClick={() => setShowHelp((h) => !h)}
            aria-label="Toggle help"
          >
            &lt;?&gt; help
          </button>
        )}
      </footer>

      {/* Hidden guest-log entry flow (opened via the `:sign` command). */}
      {showSign && (
        <SignModal
          onClose={() => setShowSign(false)}
          onSigned={() => window.dispatchEvent(new Event(SIGNED_EVENT))}
        />
      )}

      {/* Full-screen admin overlay (opened via `:admin`, Access-gated).
          Lazy-loaded — its chunk is fetched only when first opened. */}
      {showAdmin && (
        <Suspense fallback={null}>
          <AdminOverlay onClose={() => setShowAdmin(false)} />
        </Suspense>
      )}
    </div>
  )
}
