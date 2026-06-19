import type { Layer } from '@/state/useNavStack'
import styles from './Breadcrumb.module.css'

interface BreadcrumbProps {
  stack: Layer[]
  /** Navigate back to the layer at the given index (parent crumbs only). */
  onNavigate?: (index: number) => void
}

/**
 * k9s-style breadcrumb showing the navigation layer stack: parent layers are
 * cyan, the current (top-most) layer is orange. Parent crumbs are tappable so
 * touch users can navigate back without a keyboard.
 */
export function Breadcrumb({ stack, onNavigate }: BreadcrumbProps) {
  return (
    <nav className={styles.crumbs} aria-label="Navigation stack">
      {stack.map((l, i) => {
        const isCurrent = i === stack.length - 1
        const className = `${styles.crumb} ${isCurrent ? styles.active : ''}`
        // The current (top) layer isn't a navigation target.
        if (isCurrent) {
          return (
            <span key={l.id} className={className}>
              &lt;{l.label}&gt;
            </span>
          )
        }
        return (
          <button
            key={l.id}
            type="button"
            className={className}
            onClick={() => onNavigate?.(i)}
            aria-label={`Back to ${l.label}`}
          >
            &lt;{l.label}&gt;
          </button>
        )
      })}
    </nav>
  )
}
