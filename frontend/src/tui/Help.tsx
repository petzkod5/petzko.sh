import styles from './Help.module.css'

interface Binding {
  keys: string
  desc: string
}

interface HelpProps {
  /** Section shortcuts, shown in the SECTIONS column. */
  sections: ReadonlyArray<{ key: string; name: string }>
}

const NAVIGATION: Binding[] = [
  { keys: 'j', desc: 'Down' },
  { keys: 'k', desc: 'Up' },
  { keys: 'g', desc: 'Goto Top' },
  { keys: 'G', desc: 'Goto Bottom' },
]

const GENERAL: Binding[] = [
  { keys: ':', desc: 'Command' },
  { keys: '?', desc: 'Help' },
  { keys: 'esc', desc: 'Back' },
]

function Column({ title, items }: { title: string; items: Binding[] }) {
  return (
    <div className={styles.col}>
      <div className={styles.colTitle}>{title}</div>
      {items.map((b) => (
        <div key={b.keys} className={styles.item}>
          <span className={styles.key}>&lt;{b.keys}&gt;</span>
          <span className={styles.desc}>{b.desc}</span>
        </div>
      ))}
    </div>
  )
}

/** k9s-style help overlay listing the keymap. Opened with `?`. */
export function Help({ sections }: HelpProps) {
  const sectionBindings = sections.map((s) => ({ keys: s.key, desc: s.name }))
  return (
    <div className={styles.cols}>
      <Column title="SECTIONS" items={sectionBindings} />
      <Column title="NAVIGATION" items={NAVIGATION} />
      <Column title="GENERAL" items={GENERAL} />
    </div>
  )
}
