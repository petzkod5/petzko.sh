import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useShell } from './useShell'
import { complete } from './commands'
import styles from './Shell.module.css'

/**
 * psh — the fake shell, rendered in the content pane as a mode (not a section).
 * Opened by `:shell` / Shift+S; `Esc` or `exit` closes it. Allow-listed
 * interpreter; the "cluster" commands surface live read-only homelab data.
 */
export function Shell({ onClose, onGoto }: { onClose: () => void; onGoto: (section: string) => void }) {
  const { entries, prompt, history, run } = useShell({ onExit: onClose, onGoto })
  const [value, setValue] = useState('')
  const [histIdx, setHistIdx] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-focus on open; keep the scrollback pinned to the bottom as it grows.
  useEffect(() => {
    inputRef.current?.focus()
  }, [])
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [entries])

  // Document-level Esc closes the shell (works even if focus drifts).
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run(value)
      setValue('')
      setHistIdx(null)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!history.length) return
      const idx = histIdx == null ? history.length - 1 : Math.max(0, histIdx - 1)
      setHistIdx(idx)
      setValue(history[idx])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (histIdx == null) return
      const idx = histIdx + 1
      if (idx >= history.length) {
        setHistIdx(null)
        setValue('')
      } else {
        setHistIdx(idx)
        setValue(history[idx])
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const c = complete(value)
      if (c) setValue(c)
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      run('clear')
    }
  }

  return (
    <div className={styles.shell} onClick={() => inputRef.current?.focus()}>
      <div className={styles.scroll} ref={scrollRef}>
        {entries.map((en) => (
          <div key={en.id} className={styles.entry}>
            {en.echo != null && <div className={styles.echo}>{en.echo}</div>}
            {en.output.map((line, i) => (
              <div key={i} className={en.pending ? styles.pending : styles.line}>
                {line === '' ? ' ' : line}
              </div>
            ))}
          </div>
        ))}
        <div className={styles.promptRow}>
          <span className={styles.prompt}>{prompt}</span>
          <input
            ref={inputRef}
            className={styles.input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onInputKey}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            aria-label="shell input"
          />
        </div>
      </div>
    </div>
  )
}

export default Shell
