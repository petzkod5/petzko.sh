import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import styles from './Resume.module.css'

// pdf.js worker (bundled by Vite). Runs only when this lazy section loads.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const PDF_URL = '/resume/resume-dark.pdf'

/**
 * Resume section — renders the dark-format resume PDF (built by the resume repo)
 * to canvas via pdf.js, tinted phosphor-green to match the theme. The global CRT
 * overlays (scanlines / glow / vignette) layer over it automatically.
 */
export function Resume() {
  const [numPages, setNumPages] = useState(0)
  const [width, setWidth] = useState(800)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Fit page width to the container (capped for readability).
  useEffect(() => {
    const measure = () => {
      if (wrapRef.current) {
        setWidth(Math.min(wrapRef.current.clientWidth - 8, 900))
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div className={styles.resume} ref={wrapRef}>
      <a className={styles.download} href={PDF_URL} download>
        ↓ download PDF
      </a>
      <Document
        file={PDF_URL}
        className={styles.doc}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        loading={<p className={styles.note}>loading resume…</p>}
        error={<p className={styles.note}>failed to load resume.</p>}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={i}
            pageNumber={i + 1}
            width={width}
            className={styles.page}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        ))}
      </Document>
    </div>
  )
}

export default Resume
