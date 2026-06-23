import { useEffect, useState } from 'react'
import { fetchTelemetry, type TelemetryResponse } from '@/api/telemetry'

const POLL_MS = 20_000

export interface TelemetryState {
  data: TelemetryResponse | null
  loading: boolean
  error: boolean
  lastUpdated: number | null
}

/**
 * Polls /api/telemetry on an interval and exposes the latest fleet snapshot.
 * Pauses while the tab is hidden (and refreshes immediately on re-focus) to
 * avoid background churn. Errors are surfaced as a flag, not thrown, so the
 * consumer degrades gracefully.
 */
export function useTelemetry(): TelemetryState {
  const [data, setData] = useState<TelemetryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()

    const tick = async () => {
      if (document.hidden) return
      const res = await fetchTelemetry(ctrl.signal)
      if (ctrl.signal.aborted) return
      if (res) {
        setData(res)
        setError(false)
        setLastUpdated(Date.now())
      } else {
        setError(true)
      }
      setLoading(false)
    }

    tick()
    const timer = window.setInterval(tick, POLL_MS)
    const onVisible = () => {
      if (!document.hidden) tick()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      ctrl.abort()
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return { data, loading, error, lastUpdated }
}
