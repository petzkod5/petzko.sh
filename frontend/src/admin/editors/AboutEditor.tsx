import { useState } from 'react'
import type { AboutDoc } from '../model'
import { Field } from '../ui'
import { MarkdownBody } from '@/components/MarkdownBody'
import s from '../admin.module.css'

type View = 'write' | 'split' | 'preview'
const VIEWS: View[] = ['write', 'split', 'preview']

export function AboutEditor({
  value,
  onChange,
}: {
  value: AboutDoc
  onChange: (next: AboutDoc) => void
}) {
  const [view, setView] = useState<View>('split')
  const words = value.body.trim() ? value.body.trim().split(/\s+/).length : 0
  const set = <K extends keyof AboutDoc>(key: K, v: AboutDoc[K]) =>
    onChange({ ...value, [key]: v })

  const editor = (
    <textarea
      className={s.textarea}
      value={value.body}
      onChange={(e) => set('body', e.target.value)}
      spellCheck={false}
    />
  )
  const preview = (
    <div className={s.previewPane}>
      {value.body.trim() ? (
        <MarkdownBody imgClassName={s.previewImg}>{value.body}</MarkdownBody>
      ) : (
        <p className={s.previewEmpty}>nothing to preview yet.</p>
      )}
    </div>
  )

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

      <Field
        label="Body"
        meta={
          <span className={s.bodyMeta}>
            <span>markdown · {words} words</span>
            <span className={s.segmented} role="group" aria-label="Body view">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`${s.segBtn} ${view === v ? s.segBtnOn : ''}`}
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                >
                  {v}
                </button>
              ))}
            </span>
          </span>
        }
      >
        {view === 'write' && editor}
        {view === 'preview' && preview}
        {view === 'split' && (
          <div className={s.bodySplit}>
            {editor}
            {preview}
          </div>
        )}
      </Field>
    </div>
  )
}
