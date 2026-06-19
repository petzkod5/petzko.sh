import { useEffect, useState } from 'react'
import { DpMark } from '@/theme/DpMark'
import styles from './BootSplash.module.css'

interface BootSplashProps {
  /** Called when the skip affordance is clicked */
  onSkip: () => void
}

/**
 * Phase 1 boot splash — an Apple IIgs-style "Welcome" screen (dithered
 * background, bordered box, icon, progress bar) rendered on the CRT.
 */
export function BootSplash({ onSkip }: BootSplashProps) {
  const [showSkip, setShowSkip] = useState(false)

  // Show skip hint after 1.5 s
  useEffect(() => {
    const t = window.setTimeout(() => setShowSkip(true), 1500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={styles.splash} aria-busy="true" aria-label="Loading">
      <div className={styles.box}>
        <div className={styles.iconCol}>
          <DpMark height={42} className={styles.icon} />
          <span className={styles.disk}>C:</span>
        </div>
        <div className={styles.right}>
          <p className={styles.welcome}>Welcome to petzko.sh</p>
          <div className={styles.bar}>
            <div className={styles.fill} />
          </div>
        </div>
      </div>

      {showSkip && (
        <button
          className={styles.skip}
          onClick={onSkip}
          aria-label="Skip boot sequence"
        >
          press any key to skip ▸
        </button>
      )}
    </div>
  )
}
