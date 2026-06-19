import styles from './Stats.module.css'

// Modules planned for the stats section — shown as a teaser while it's WIP.
const QUEUED = [
  'live site statistics',
  'guest log viewer',
  'assorted fun signals',
]

/**
 * Stats section — placeholder "coming soon" panel. Will eventually house site
 * statistics, the guest log viewer, and other fun information.
 */
export function Stats() {
  return (
    <div className={styles.stats}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.title}>STATS</span>
          <span className={styles.tag}>under construction</span>
        </div>

        <p className={styles.lead}>
          This module is being wired up. Soon it&apos;ll surface live numbers and
          signals from the site.
        </p>

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
          <span className={styles.blink}>coming soon</span>
          <span className={styles.cursor} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

export default Stats
