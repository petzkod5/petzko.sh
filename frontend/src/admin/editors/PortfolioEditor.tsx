import { PROJECT_TYPES, emptyProject, type ProjectItem } from '../model'
import { Field, RowControls, moveItem } from '../ui'
import s from '../admin.module.css'

const isGithub = (t: string) => t.toLowerCase() === 'github'

export function PortfolioEditor({
  value,
  onChange,
}: {
  value: ProjectItem[]
  onChange: (next: ProjectItem[]) => void
}) {
  const update = (i: number, patch: Partial<ProjectItem>) =>
    onChange(value.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const move = (from: number, to: number) => onChange(moveItem(value, from, to))
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i))
  const add = () => onChange([...value, emptyProject()])

  return (
    <div className={s.editor}>
      <header className={s.editorHead}>
        <h2 className={s.editorTitle}>Portfolio</h2>
        <p className={s.subtle}>
          Projects rendered as tiles. GitHub entries link to the repo; work
          projects show the company instead.
        </p>
      </header>

      <div className={s.list}>
        {value.map((item, i) => (
          <div className={s.card} key={i}>
            <div className={s.cardHead}>
              <span className={s.cardIndex}>#{i + 1}</span>
              <span className={s.cardTitle}>{item.name || 'untitled'}</span>
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
                  list="project-types"
                  value={item.type}
                  onChange={(e) => update(i, { type: e.target.value })}
                  spellCheck={false}
                />
              </Field>
              <Field label="Name">
                <input
                  className={s.input}
                  value={item.name}
                  onChange={(e) => update(i, { name: e.target.value })}
                />
              </Field>
            </div>

            {isGithub(item.type) ? (
              <Field label="Repository URL">
                <input
                  className={s.input}
                  value={item.url}
                  onChange={(e) => update(i, { url: e.target.value })}
                  spellCheck={false}
                />
              </Field>
            ) : (
              <Field label="Company">
                <input
                  className={s.input}
                  value={item.company}
                  onChange={(e) => update(i, { company: e.target.value })}
                />
              </Field>
            )}

            <Field label="Description">
              <textarea
                className={`${s.textarea} ${s.textareaShort}`}
                value={item.description}
                onChange={(e) => update(i, { description: e.target.value })}
              />
            </Field>
          </div>
        ))}
      </div>

      <button type="button" className={s.addBtn} onClick={add}>
        + add project
      </button>

      <datalist id="project-types">
        {PROJECT_TYPES.map((t) => (
          <option value={t} key={t} />
        ))}
      </datalist>
    </div>
  )
}
