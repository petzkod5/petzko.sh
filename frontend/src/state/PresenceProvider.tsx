import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// Live count of visitors currently on the site, or null when unknown (still
// connecting, or no Worker — e.g. staging/local).
const PresenceCtx = createContext<number | null>(null)

/**
 * Opens one site-wide presence WebSocket for the whole session (App-level, so it
 * survives the boot-phase Tui remounts) and exposes the live connected-user
 * count. Reconnects with backoff; gives up quietly when there's no Worker. Does
 * NOT pause on tab-hide — a backgrounded tab is still "on the site".
 */
export function PresenceProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<number | null>(null)

  useEffect(() => {
    let stopped = false
    let ws: WebSocket | null = null
    let fails = 0
    let timer: number | undefined

    const schedule = () => {
      if (stopped) return
      fails++
      if (fails > 8) return // no Worker here (staging/local) — stay unknown
      timer = window.setTimeout(connect, Math.min(30_000, 1000 * 2 ** (fails - 1)))
    }

    const connect = () => {
      if (stopped) return
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      try {
        ws = new WebSocket(`${proto}://${location.host}/api/presence/stream`)
      } catch {
        schedule()
        return
      }
      ws.onmessage = (e) => {
        fails = 0
        try {
          const d = JSON.parse(e.data as string) as { users?: number }
          if (typeof d.users === 'number') setUsers(d.users)
        } catch {
          /* ignore a malformed frame */
        }
      }
      ws.onclose = () => {
        ws = null
        schedule() // keep the last known count on screen while we retry
      }
      ws.onerror = () => {
        try {
          ws?.close()
        } catch {
          /* already closing */
        }
      }
    }

    connect()
    return () => {
      stopped = true
      if (timer) window.clearTimeout(timer)
      try {
        ws?.close()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return <PresenceCtx.Provider value={users}>{children}</PresenceCtx.Provider>
}

export function usePresence(): number | null {
  return useContext(PresenceCtx)
}
