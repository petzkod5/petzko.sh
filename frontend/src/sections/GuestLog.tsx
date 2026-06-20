import { useEffect, useState } from 'react'
import { fetchGuestbook, SIGNED_EVENT, type GuestEntry } from '@/api/guestbook'
import styles from './GuestLog.module.css'

type State = 'loading' | 'ok' | 'error'

/**
 * Guest log viewer — recent signed entries, rendered as terminal log lines.
 * Refetches when a new entry is signed (SIGNED_EVENT). Drops the faint `:sign`
 * breadcrumb that points at the hidden entry command.
 */
export function GuestLog() {
  const [entries, setEntries] = useState<GuestEntry[]>([])
  const [state, setState] = useState<State>('loading')

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const e = await fetchGuestbook(12)
        if (alive) {
          setEntries(e)
          setState('ok')
        }
      } catch {
        if (alive) setState('error')
      }
    }
    void load()
    const onSigned = () => void load()
    window.addEventListener(SIGNED_EVENT, onSigned)
    return () => {
      alive = false
      window.removeEventListener(SIGNED_EVENT, onSigned)
    }
  }, [])

  return (
    <div className={styles.guestlog}>
      <div className={styles.head}>guest log</div>

      {state === 'loading' && <div className={styles.note}>loading…</div>}
      {state === 'error' && <div className={styles.note}>offline</div>}
      {state === 'ok' && entries.length === 0 && (
        <div className={styles.note}>no entries yet — be the first.</div>
      )}
      {state === 'ok' && entries.length > 0 && (
        <ul className={styles.list}>
          {entries.map((e) => (
            <li key={e.id} className={styles.entry}>
              <span className={styles.marker} aria-hidden="true">
                &gt;
              </span>
              <span className={styles.name}>{e.name}</span>
              {e.country && <span className={styles.flag}>{flag(e.country)}</span>}
              <span className={styles.msg}>{e.message}</span>
              <span className={styles.time}>{ago(e.created_at)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.hint}>
        leave your mark › type <span className={styles.cmd}>:sign</span>
      </div>
    </div>
  )
}

// "just now" / "5m" / "3h" / "2d"
function ago(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

// ISO country code → flag emoji (regional indicators).
function flag(cc: string): string {
  if (!/^[A-Za-z]{2}$/.test(cc)) return ''
  const base = 0x1f1e6
  const up = cc.toUpperCase()
  return String.fromCodePoint(
    base + up.charCodeAt(0) - 65,
    base + up.charCodeAt(1) - 65,
  )
}

export default GuestLog
