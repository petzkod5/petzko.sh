import { CONTACT_TYPES, emptyContact, type ContactItem } from '../model'
import { Field, RowControls, Toggle, moveItem } from '../ui'
import s from '../admin.module.css'

export function ContactEditor({
  value,
  onChange,
}: {
  value: ContactItem[]
  onChange: (next: ContactItem[]) => void
}) {
  const update = (i: number, patch: Partial<ContactItem>) =>
    onChange(value.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const move = (from: number, to: number) => onChange(moveItem(value, from, to))
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i))
  const add = () => onChange([...value, emptyContact()])

  return (
    <div className={s.editor}>
      <header className={s.editorHead}>
        <h2 className={s.editorTitle}>Contact</h2>
        <p className={s.subtle}>Links rendered as tiles on the contact screen.</p>
      </header>

      <div className={s.list}>
        {value.map((item, i) => (
          <div className={s.card} key={i}>
            <div className={s.cardHead}>
              <span className={s.cardIndex}>#{i + 1}</span>
              <span className={s.cardTitle}>{item.type || 'untitled'}</span>
              <RowControls
                index={i}
                count={value.length}
                onMove={move}
                onDelete={remove}
              />
            </div>

            <div className={s.fieldRow}>
              <Field label="Type">
                <input
                  className={s.input}
                  list="contact-types"
                  value={item.type}
                  onChange={(e) => update(i, { type: e.target.value })}
                  spellCheck={false}
                />
              </Field>
              <Field label="URL / handle">
                <input
                  className={s.input}
                  value={item.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                  spellCheck={false}
                />
              </Field>
            </div>

            <Field label="Description">
              <textarea
                className={`${s.textarea} ${s.textareaShort}`}
                value={item.description}
                onChange={(e) => update(i, { description: e.target.value })}
              />
            </Field>

            <div className={s.toggles}>
              <Toggle
                label="clickable"
                checked={item.click}
                onChange={(v) => update(i, { click: v })}
              />
              <Toggle
                label="new tab"
                checked={item.newTab}
                onChange={(v) => update(i, { newTab: v })}
              />
              <Toggle
                label="copy instead of open"
                checked={item.copy}
                onChange={(v) => update(i, { copy: v })}
              />
            </div>
          </div>
        ))}
      </div>

      <button type="button" className={s.addBtn} onClick={add}>
        + add contact
      </button>

      <datalist id="contact-types">
        {CONTACT_TYPES.map((t) => (
          <option value={t} key={t} />
        ))}
      </datalist>
    </div>
  )
}
