import { useEffect, useRef, useState } from 'react'
import type { IconType } from 'react-icons'
import {
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiGmail,
  SiInstagram,
  SiX,
} from 'react-icons/si'
import { FaLinkedin, FaPen } from 'react-icons/fa6'
import { useSiteContent } from '@/state/ContentProvider'
import { useGridNav } from './useGridNav'
import styles from './Contact.module.css'

const ICONS: Record<string, IconType> = {
  instagram: SiInstagram,
  linkedin: FaLinkedin,
  x: SiX,
  'x.com': SiX,
  twitter: SiX,
  facebook: SiFacebook,
  discord: SiDiscord,
  gmail: SiGmail,
  github: SiGithub,
}

const iconFor = (type: string): IconType => ICONS[type.toLowerCase()] ?? FaPen

function hrefFor(url: string): string {
  const u = url.trim()
  if (/^(https?:|mailto:)/i.test(u)) return u
  if (u.includes('@') && !u.includes('/')) return `mailto:${u}`
  return `https://${u}`
}

export function Contact() {
  const { contacts: ITEMS } = useSiteContent()
  const [copied, setCopied] = useState<number | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const copyTimer = useRef<number | undefined>(undefined)

  const activate = (index: number) => {
    const item = ITEMS[index]
    if (!item) return
    if (item.copy) {
      navigator.clipboard
        ?.writeText(item.url)
        .then(() => {
          setCopied(index)
          window.clearTimeout(copyTimer.current)
          copyTimer.current = window.setTimeout(() => setCopied(null), 1500)
        })
        .catch(() => {})
      return
    }
    if (!item.click) return
    const href = hrefFor(item.url)
    if (item.newTab) window.open(href, '_blank', 'noopener,noreferrer')
    else window.location.href = href
  }

  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  const { sel, setSel, selRef } = useGridNav(ITEMS.length, gridRef, activate)

  return (
    <div className={styles.grid} role="list" ref={gridRef}>
      {ITEMS.map((item, i) => {
        const Icon = iconFor(item.type)
        const isSel = i === sel
        return (
          <div
            key={`${item.type}-${i}`}
            ref={isSel ? selRef : undefined}
            role="listitem"
            aria-selected={isSel}
            className={`${styles.tile} ${isSel ? styles.tileSel : ''} ${
              item.click || item.copy ? styles.clickable : ''
            }`}
            onMouseEnter={() => setSel(i)}
            onClick={() => activate(i)}
          >
            <span className={styles.icon}>
              <Icon />
            </span>
            <div className={styles.body}>
              <div className={styles.type}>{item.type}</div>
              <div className={styles.url}>{item.url}</div>
              {item.description && (
                <p className={styles.desc}>{item.description.trim()}</p>
              )}
              {isSel && (item.copy || item.click) && (
                <div className={styles.hint}>
                  {item.copy
                    ? copied === i
                      ? 'copied!'
                      : '↵ copy'
                    : `↵ open${item.newTab ? ' ↗' : ''}`}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
