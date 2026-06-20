import { useEffect, useState } from 'react'
import { fetchStats, type SiteStats } from '@/api/stats'
import styles from './Stats.module.css'

// Modules still to come — shown as a teaser beneath the live numbers.
const QUEUED = ['guest log viewer', 'assorted fun signals']

type LoadState = 'loading' | 'ok' | 'error'

/**
 * Stats section. Phase 1: a live visitor readout from the edge stats API, plus a
 * teaser of the modules still queued (guest log viewer, etc.). Degrades to an
 * "offline" readout if the API is unreachable (e.g. no `wrangler dev` locally).
 */
export function Stats() {
  const [stats, setStats] = useState<SiteStats | null>(null)
  const [load, setLoad] = useState<LoadState>('loading')

  useEffect(() => {
    const ctrl = new AbortController()
    fetchStats(ctrl.signal)
      .then((data) => {
        setStats(data)
        setLoad('ok')
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name !== 'AbortError') setLoad('error')
      })
    return () => ctrl.abort()
  }, [])

  // Render a stat value according to load state.
  const value = (n: number | undefined) => {
    if (load === 'loading') return <span className={styles.muted}>·····</span>
    if (load === 'error') return <span className={styles.muted}>offline</span>
    return (n ?? 0).toLocaleString()
  }

  return (
    <div className={styles.stats}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.title}>STATS</span>
        </div>

        <dl className={styles.readout}>
          <div className={styles.stat}>
            <dt className={styles.statLabel}>page views</dt>
            <dd className={styles.statValue}>{value(stats?.visits)}</dd>
          </div>
          <div className={styles.stat}>
            <dt className={styles.statLabel}>unique visitors</dt>
            <dd className={styles.statValue}>{value(stats?.uniques)}</dd>
          </div>
        </dl>

        <ul className={styles.queue}>
          {QUEUED.map((item) => (
            <li key={item} className={styles.item}>
              <span className={styles.marker} aria-hidden="true">
                &gt;
              </span>
              <span className={styles.label}>{item}</span>
              <span className={styles.pending}>[ queued ]</span>
            </li>
          ))}
        </ul>

        <div className={styles.footer}>
          <span className={styles.blink}>more soon</span>
          <span className={styles.cursor} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

export default Stats
