import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import {
  signGuestbook,
  NAME_MAX,
  MESSAGE_MAX,
  type GuestEntry,
} from '@/api/guestbook'
import styles from './SignModal.module.css'

interface SignModalProps {
  onClose: () => void
  onSigned: (entry: GuestEntry) => void
}

type Step = 'name' | 'message' | 'confirm' | 'submitting' | 'done' | 'error'

const ERRORS: Record<string, string> = {
  rate_limited: 'slow down — try again shortly',
  invalid_name: `name required (max ${NAME_MAX})`,
  invalid_message: `message required (max ${MESSAGE_MAX})`,
  rejected: "let's keep it friendly",
  offline: 'guest log is offline right now',
}

/**
 * The hidden `:sign` guest-log entry flow. A terminal-styled modal that runs a
 * guided mini-REPL: name → message → confirm → submit. Fully keyboard-driven
 * (Enter advances, Esc cancels) with tappable affordances for touch.
 */
export function SignModal({ onClose, onSigned }: SignModalProps) {
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [hint, setHint] = useState('')
  const [error, setError] = useState('')
  const [entryId, setEntryId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep the active input focused as steps change.
  useEffect(() => {
    if (step === 'name' || step === 'message') inputRef.current?.focus()
  }, [step])

  // Esc closes from anywhere in the modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const next = () => {
    setHint('')
    if (step === 'name') {
      if (!name.trim()) return setHint('enter a name')
      setStep('message')
    } else if (step === 'message') {
      if (!message.trim()) return setHint('enter a message')
      setStep('confirm')
    }
  }

  const submit = async () => {
    setStep('submitting')
    const result = await signGuestbook(name.trim(), message.trim())
    if (result.ok) {
      setEntryId(result.entry.id)
      setStep('done')
      onSigned(result.entry)
      window.setTimeout(onClose, 1600)
    } else {
      setError(ERRORS[result.error] ?? 'something went wrong — try again')
      setStep('error')
    }
  }

  const onInputKey = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      next()
    }
    // Esc bubbles to the document handler above.
  }

  return (
    <div className={styles.backdrop} onMouseDown={onClose}>
      <div
        className={styles.box}
        role="dialog"
        aria-modal="true"
        aria-label="Sign the guest log"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.title}>guest log</div>

        <div className={styles.body}>
          <div className={styles.intro}>
            <span className={styles.prompt}>$</span> sign — leave your mark.
          </div>

          {/* committed lines */}
          {step !== 'name' && (
            <div className={styles.committed}>
              <span className={styles.field}>name&gt;</span> {name}
            </div>
          )}
          {(step === 'confirm' ||
            step === 'submitting' ||
            step === 'done' ||
            step === 'error') && (
            <div className={styles.committed}>
              <span className={styles.field}>message&gt;</span> {message}
            </div>
          )}

          {/* active step */}
          {step === 'name' && (
            <label className={styles.active}>
              <span className={styles.field}>name&gt;</span>
              <input
                ref={inputRef}
                className={styles.input}
                value={name}
                maxLength={NAME_MAX}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={onInputKey}
                spellCheck={false}
                autoComplete="off"
                aria-label="Your name"
              />
            </label>
          )}
          {step === 'message' && (
            <label className={styles.active}>
              <span className={styles.field}>message&gt;</span>
              <input
                ref={inputRef}
                className={styles.input}
                value={message}
                maxLength={MESSAGE_MAX}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={onInputKey}
                spellCheck={false}
                autoComplete="off"
                aria-label="Your message"
              />
            </label>
          )}
          {step === 'confirm' && (
            <div className={styles.confirm}>sign the log?</div>
          )}
          {step === 'submitting' && (
            <div className={styles.status}>appending…</div>
          )}
          {step === 'done' && (
            <div className={styles.ok}>✓ signed — entry #{entryId} appended</div>
          )}
          {step === 'error' && <div className={styles.err}>✗ {error}</div>}
        </div>

        {/* footer: hint + tappable affordances */}
        <div className={styles.footer}>
          {step === 'message' && (
            <span className={styles.counter}>
              {message.length}/{MESSAGE_MAX}
            </span>
          )}
          {hint && <span className={styles.inlineHint}>{hint}</span>}

          {(step === 'name' || step === 'message') && (
            <button type="button" className={styles.btn} onClick={next}>
              [enter] next
            </button>
          )}
          {step === 'confirm' && (
            <button
              type="button"
              className={styles.btn}
              onClick={() => void submit()}
              autoFocus
            >
              [enter] sign
            </button>
          )}
          {step === 'error' && (
            <button
              type="button"
              className={styles.btn}
              onClick={() => {
                setError('')
                setStep('message')
              }}
            >
              [enter] retry
            </button>
          )}
          {step !== 'submitting' && step !== 'done' && (
            <button type="button" className={styles.btnDim} onClick={onClose}>
              [esc] cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SignModal
