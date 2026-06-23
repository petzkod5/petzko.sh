import { useEffect, useState } from 'react'
import { fetchGuestbook, type GuestEntry } from '@/api/guestbook'
import s from '../admin.module.css'

type Load = 'loading' | 'ok' | 'error'

function ago(ts: number): string {
  const secs = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (secs < 60) return `${secs}s`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function flag(country: string | null): string {
  if (!country || country.length !== 2) return ''
  const A = 0x1f1e6
  return String.fromCodePoint(
    A + (country.toUpperCase().charCodeAt(0) - 65),
    A + (country.toUpperCase().charCodeAt(1) - 65),
  )
}

/**
 * Guest-log moderation. Phase 1 lists the live (approved) entries read-only —
 * actual hide/delete actions need authed admin endpoints on the Worker, which
 * land with the Phase-2 backend wiring.
 */
export function GuestLogModerator({ onCount }: { onCount?: (n: number) => void }) {
  const [entries, setEntries] = useState<GuestEntry[]>([])
  const [load, setLoad] = useState<Load>('loading')

  useEffect(() => {
    const ctrl = new AbortController()
    fetchGuestbook(50, ctrl.signal)
      .then((rows) => {
        setEntries(rows)
        onCount?.(rows.length)
        setLoad('ok')
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name !== 'AbortError') setLoad('error')
      })
    return () => ctrl.abort()
    // onCount is stable enough; intentionally run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={s.editor}>
      <header className={s.editorHead}>
        <h2 className={s.editorTitle}>Guest Log</h2>
        <p className={s.subtle}>Entries left via the hidden `:sign` command.</p>
      </header>

      {load === 'loading' && <p className={s.empty}>loading entries…</p>}
      {load === 'error' && (
        <p className={s.empty}>
          couldn’t reach the guestbook API (expected on staging / local without
          the Worker).
        </p>
      )}
      {load === 'ok' && entries.length === 0 && (
        <p className={s.empty}>no entries yet.</p>
      )}

      {load === 'ok' && entries.length > 0 && (
        <div className={s.guestList}>
          {entries.map((e) => (
            <div className={s.guestRow} key={e.id}>
              <span className={s.guestName}>
                {flag(e.country)} {e.name}
              </span>
              <span className={s.guestMsg}>{e.message}</span>
              <span className={s.guestMeta}>{ago(e.created_at)} ago</span>
            </div>
          ))}
        </div>
      )}

      <div className={s.note}>
        Moderation (hide / delete) wires up with the Phase-2 backend — the Worker
        needs authed admin endpoints to flip <code>approved</code> or remove rows.
      </div>
    </div>
  )
}
