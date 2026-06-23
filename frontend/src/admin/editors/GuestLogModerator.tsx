import { useEffect, useState } from 'react'
import {
  fetchAdminGuestbook,
  setGuestApproved,
  deleteGuestEntry,
  type AdminGuestEntry,
} from '@/api/admin'
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

export function GuestLogModerator({ onCount }: { onCount?: (n: number) => void }) {
  const [entries, setEntries] = useState<AdminGuestEntry[]>([])
  const [load, setLoad] = useState<Load>('loading')

  const reload = () => {
    setLoad('loading')
    const ctrl = new AbortController()
    fetchAdminGuestbook(ctrl.signal)
      .then((rows) => {
        setEntries(rows)
        onCount?.(rows.length)
        setLoad('ok')
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name !== 'AbortError') setLoad('error')
      })
    return () => ctrl.abort()
  }

  useEffect(reload, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (entry: AdminGuestEntry) => {
    const next: 0 | 1 = entry.approved ? 0 : 1
    await setGuestApproved(entry.id, next)
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, approved: next } : e)))
  }

  const remove = async (id: number) => {
    if (!window.confirm('Delete this entry permanently?')) return
    await deleteGuestEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
    onCount?.(entries.length - 1)
  }

  return (
    <div className={s.editor}>
      <header className={s.editorHead}>
        <h2 className={s.editorTitle}>Guest Log</h2>
        <p className={s.subtle}>Entries left via the hidden `:sign` command. Includes unapproved.</p>
      </header>

      {load === 'loading' && <p className={s.empty}>loading entries…</p>}
      {load === 'error' && (
        <p className={s.empty}>
          couldn't reach the admin guestbook API (expected on staging / local without the Worker).
        </p>
      )}
      {load === 'ok' && entries.length === 0 && <p className={s.empty}>no entries yet.</p>}

      {load === 'ok' && entries.length > 0 && (
        <div className={s.guestList}>
          {entries.map((e) => (
            <div className={`${s.guestRow} ${!e.approved ? s.guestRowHidden : ''}`} key={e.id}>
              <span className={s.guestName}>
                {flag(e.country)} {e.name}
              </span>
              <span className={s.guestMsg}>{e.message}</span>
              <span className={s.guestMeta}>{ago(e.created_at)} ago</span>
              <div className={s.guestActions}>
                <button
                  type="button"
                  className={s.guestActionBtn}
                  onClick={() => void toggle(e)}
                  title={e.approved ? 'hide from public' : 'approve'}
                >
                  {e.approved ? 'hide' : 'approve'}
                </button>
                <button
                  type="button"
                  className={`${s.guestActionBtn} ${s.guestActionDanger}`}
                  onClick={() => void remove(e.id)}
                  title="delete permanently"
                >
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
