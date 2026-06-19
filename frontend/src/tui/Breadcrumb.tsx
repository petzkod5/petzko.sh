import type { Layer } from '@/state/useNavStack'
import styles from './Breadcrumb.module.css'

interface BreadcrumbProps {
  stack: Layer[]
}

/**
 * k9s-style breadcrumb showing the navigation layer stack: parent layers are
 * cyan, the current (top-most) layer is orange.
 */
export function Breadcrumb({ stack }: BreadcrumbProps) {
  return (
    <nav className={styles.crumbs} aria-label="Navigation stack">
      {stack.map((l, i) => (
        <span
          key={l.id}
          className={`${styles.crumb} ${
            i === stack.length - 1 ? styles.active : ''
          }`}
        >
          &lt;{l.label}&gt;
        </span>
      ))}
    </nav>
  )
}
