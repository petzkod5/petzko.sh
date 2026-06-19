import { useEffect, useState } from 'react'
import styles from './ResumeLoader.module.css'

// Boot-style status lines that cycle while the PDF loads — pure (dark) flavor.
const STAGES = [
  'inflating job titles',
  'redacting employment gaps',
  'converting trauma to bullet points',
  'begging the ATS for mercy',
  'quantifying imaginary impact',
  'suppressing imposter syndrome',
]

/**
 * Retro 80s-terminal loading splash shown in the resume viewport while the PDF
 * loads. A continuously looping bar (spinner-in-bar form) plus cycling
 * boot-style status lines — no progress tracking.
 */
export function ResumeLoader() {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStage((s) => (s + 1) % STAGES.length), 850)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.wrap} role="status" aria-live="polite" aria-label="Loading resume">
      <div className={styles.panel}>
        <div className={styles.header}>
          <span className={styles.led} aria-hidden="true" />
          <span className={styles.title}>RESUME.PDF</span>
        </div>

        <div className={styles.barTrack}>
          <div className={styles.barSweep} aria-hidden="true" />
        </div>

        <div className={styles.status}>
          <span className={styles.prompt}>&gt;</span>
          <span className={styles.stage}>{STAGES[stage]}</span>
          <span className={styles.cursor} aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

export default ResumeLoader
