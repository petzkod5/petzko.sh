import { useEffect, useState } from 'react'
import { fetchTelemetry, type TelemetryResponse } from '@/api/telemetry'

const POLL_MS = 20_000
const MAX_WS_FAILS = 4 // give up on the socket and poll after this many failures

export interface TelemetryState {
  data: TelemetryResponse | null
  loading: boolean
  error: boolean
  lastUpdated: number | null
}

/**
 * Live telemetry, WebSocket-first. Paints instantly from one poll, then streams
 * updates from /api/telemetry/stream (pushed by the edge the moment a snapshot
 * is ingested). Reconnects with backoff; after repeated failures (e.g. staging /
 * local with no Worker) it falls back to the 20s poll loop. Pauses while the tab
 * is hidden. The return shape is identical to the old poll-only hook, so the UI
 * is unchanged — it just updates in real time.
 */
export function useTelemetry(): TelemetryState {
  const [data, setData] = useState<TelemetryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  useEffect(() => {
    let stopped = false
    let ws: WebSocket | null = null
    let wsFails = 0
    let reconnectTimer: number | undefined
    let pollTimer: number | undefined
    const ctrl = new AbortController()

    const apply = (d: TelemetryResponse) => {
      if (stopped) return
      setData(d)
      setError(false)
      setLastUpdated(Date.now())
      setLoading(false)
    }

    // Instant paint (also covers the case where the hub has no cached fleet yet).
    fetchTelemetry(ctrl.signal).then((d) => {
      if (d) apply(d)
      else if (!stopped) setLoading(false)
    })

    const startPolling = () => {
      if (pollTimer != null) return
      const tick = async () => {
        if (document.hidden) return
        const d = await fetchTelemetry(ctrl.signal)
        if (stopped) return
        if (d) apply(d)
        else setError(true)
        setLoading(false)
      }
      void tick()
      pollTimer = window.setInterval(() => void tick(), POLL_MS)
    }

    const scheduleReconnect = () => {
      if (stopped || pollTimer != null) return
      wsFails++
      if (wsFails >= MAX_WS_FAILS) {
        startPolling() // socket isn't available here — degrade to polling
        return
      }
      const delay = Math.min(30_000, 1000 * 2 ** (wsFails - 1))
      reconnectTimer = window.setTimeout(connect, delay)
    }

    const connect = () => {
      if (stopped || document.hidden || pollTimer != null) return
      const proto = location.protocol === 'https:' ? 'wss' : 'ws'
      try {
        ws = new WebSocket(`${proto}://${location.host}/api/telemetry/stream`)
      } catch {
        scheduleReconnect()
        return
      }
      ws.onmessage = (e) => {
        wsFails = 0
        try {
          apply(JSON.parse(e.data as string) as TelemetryResponse)
        } catch {
          /* ignore a malformed frame */
        }
      }
      ws.onclose = () => {
        ws = null
        scheduleReconnect()
      }
      ws.onerror = () => {
        try {
          ws?.close()
        } catch {
          /* already closing */
        }
      }
    }

    const onVisible = () => {
      if (document.hidden) return
      if (ws == null && pollTimer == null) {
        wsFails = 0
        connect()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    connect()

    return () => {
      stopped = true
      ctrl.abort()
      document.removeEventListener('visibilitychange', onVisible)
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      if (pollTimer) window.clearInterval(pollTimer)
      try {
        ws?.close()
      } catch {
        /* ignore */
      }
    }
  }, [])

  return { data, loading, error, lastUpdated }
}
