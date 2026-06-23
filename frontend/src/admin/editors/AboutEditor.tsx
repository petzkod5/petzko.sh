import type { AboutDoc } from '../model'
import { Field } from '../ui'
import s from '../admin.module.css'

export function AboutEditor({
  value,
  onChange,
}: {
  value: AboutDoc
  onChange: (next: AboutDoc) => void
}) {
  const words = value.body.trim() ? value.body.trim().split(/\s+/).length : 0
  const set = <K extends keyof AboutDoc>(key: K, v: AboutDoc[K]) =>
    onChange({ ...value, [key]: v })

  return (
    <div className={s.editor}>
      <header className={s.editorHead}>
        <h2 className={s.editorTitle}>About</h2>
        <p className={s.subtle}>The markdown shown on the about screen.</p>
      </header>

      <div className={s.fieldRow}>
        <Field label="Heading">
          <input
            className={s.input}
            value={value.heading}
            onChange={(e) => set('heading', e.target.value)}
          />
        </Field>
        <Field label="Avatar Path">
          <input
            className={s.input}
            value={value.avatar}
            onChange={(e) => set('avatar', e.target.value)}
            spellCheck={false}
          />
        </Field>
      </div>

      <Field label="Avatar Alt Text">
        <input
          className={s.input}
          value={value.avatarAlt}
          onChange={(e) => set('avatarAlt', e.target.value)}
        />
      </Field>

      <Field label="Body" meta={`markdown · ${words} words`}>
        <textarea
          className={s.textarea}
          value={value.body}
          onChange={(e) => set('body', e.target.value)}
          spellCheck={false}
        />
      </Field>
    </div>
  )
}
