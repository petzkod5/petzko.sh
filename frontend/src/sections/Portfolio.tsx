import { useRef, type ReactNode } from 'react'
import { SiGithub } from 'react-icons/si'
import { FaCircleInfo } from 'react-icons/fa6'
import { useSiteContent } from '@/state/ContentProvider'
import { useGridNav } from './useGridNav'
import styles from './Portfolio.module.css'

import type { ProjectItem } from '@/content/types'

function LockheedMark() {
  return <span className={styles.lockheed} aria-hidden="true" />
}

const isGithub = (item: ProjectItem) => item.type.toLowerCase() === 'github'

function iconFor(item: ProjectItem): ReactNode {
  if (isGithub(item)) return <SiGithub />
  if (item.company && /lockheed/i.test(item.company)) return <LockheedMark />
  return <FaCircleInfo />
}

function hrefFor(url: string): string {
  const u = url.trim()
  return /^https?:/i.test(u) ? u : `https://${u}`
}

export function Portfolio() {
  const { portfolio: ITEMS } = useSiteContent()
  const gridRef = useRef<HTMLDivElement>(null)

  const activate = (index: number) => {
    const item = ITEMS[index]
    if (item && isGithub(item) && item.url) {
      window.open(hrefFor(item.url), '_blank', 'noopener,noreferrer')
    }
  }

  const { sel, setSel, selRef } = useGridNav(ITEMS.length, gridRef, activate)

  return (
    <div className={styles.grid} role="list" ref={gridRef}>
      {ITEMS.map((item, i) => {
        const isSel = i === sel
        const linkable = isGithub(item) && !!item.url
        const meta = isGithub(item) ? item.url : item.company
        return (
          <div
            key={`${item.name}-${i}`}
            ref={isSel ? selRef : undefined}
            role="listitem"
            aria-selected={isSel}
            className={`${styles.tile} ${isSel ? styles.tileSel : ''} ${
              linkable ? styles.clickable : ''
            }`}
            onMouseEnter={() => setSel(i)}
            onClick={() => activate(i)}
          >
            <span className={styles.icon}>{iconFor(item)}</span>
            <div className={styles.name}>{item.name}</div>
            {meta && <div className={styles.meta}>{meta}</div>}
            {item.description && (
              <p className={styles.desc}>{item.description.trim()}</p>
            )}
            {isSel && linkable && <div className={styles.hint}>↵ open ↗</div>}
          </div>
        )
      })}
    </div>
  )
}
