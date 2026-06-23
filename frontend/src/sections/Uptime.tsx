import { useEffect, useState } from 'react'
import { useTelemetry } from '@/state/useTelemetry'
import styles from './Uptime.module.css'

function fmtUp(sec: number): string {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const hm = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  return d > 0 ? `${d} day${d === 1 ? '' : 's'}, ${hm}` : hm
}

function clock(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour12: false })
}

/**
 * `:uptime` — the classic one-liner: current time, how long the cluster has been
 * up, and the (cluster-aggregate) load average when available. Sourced from the
 * live telemetry feed; the clock ticks each second.
 */
export function Uptime() {
  const { data, loading } = useTelemetry()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const clusters = data?.clusters ?? []
  const c = clusters.find((x) => x.role === 'primary') ?? clusters[0] ?? null

  const load =
    c && typeof c.cluster.load_1 === 'number'
      ? `, load average: ${c.cluster.load_1.toFixed(2)}, ${(c.cluster.load_5 ?? 0).toFixed(2)}, ${(c.cluster.load_15 ?? 0).toFixed(2)}`
      : ''

  return (
    <div className={styles.wrap}>
      {loading && !c ? (
        <p className={styles.muted}>querying fleet…</p>
      ) : c ? (
        <>
          <p className={styles.line}>
            <span className={styles.time}>{clock(now)}</span> up{' '}
            <span className={styles.up}>{fmtUp(c.cluster.uptime_seconds)}</span>
            {load}
          </p>
          <p className={styles.sub}>
            {c.cluster_id} · {c.cluster.nodes_ready}/{c.cluster.nodes_total} nodes ready
          </p>
        </>
      ) : (
        <p className={styles.muted}>
          telemetry unavailable — the fleet collector isn’t reporting (expected on
          staging / local without the Worker).
        </p>
      )}
    </div>
  )
}

export default Uptime
