import { useEffect, useState } from 'react'
import { fetchAdminMe, ADMIN_LOGIN_URL } from '@/api/admin'
import { AdminApp } from './AdminApp'
import s from './admin.module.css'

type Gate = 'checking' | 'authed' | 'unauth' | 'error'

/**
 * Full-screen admin overlay. Gates on Cloudflare Access (via /api/admin/me);
 * once authenticated it hands off to the editor. Opened by the `:admin` command
 * and auto-opened after the Access login bounce (?admin=1).
 */
export function AdminOverlay({ onClose }: { onClose: () => void }) {
  const [gate, setGate] = useState<Gate>('checking')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const ctrl = new AbortController()
    fetchAdminMe(ctrl.signal)
      .then((id) => {
        if (id) {
          setEmail(id.email)
          setGate('authed')
        } else {
          setGate('unauth')
        }
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name !== 'AbortError') setGate('error')
      })
    return () => ctrl.abort()
  }, [])

  // Esc closes the pre-auth gate states (the editor handles its own Esc).
  useEffect(() => {
    if (gate === 'authed') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [gate, onClose])

  if (gate === 'authed') return <AdminApp email={email} onClose={onClose} />

  return (
    <div className={s.overlay}>
      <div className={s.gate}>
        {gate === 'checking' && <p className={s.gateText}>verifying clearance…</p>}

        {gate === 'unauth' && (
          <>
            <p className={s.gateTitle}>ACCESS RESTRICTED</p>
            <p className={s.gateText}>
              This area is gated by Cloudflare Access. Authenticate to continue.
            </p>
            <a className={s.gateBtn} href={ADMIN_LOGIN_URL}>
              authenticate →
            </a>
            <button type="button" className={s.gateGhost} onClick={onClose}>
              &lt;esc&gt; cancel
            </button>
          </>
        )}

        {gate === 'error' && (
          <>
            <p className={s.gateTitle}>AUTH CHECK FAILED</p>
            <p className={s.gateText}>
              The edge auth endpoint is unreachable (expected on staging / local
              without the Worker in front).
            </p>
            <button
              type="button"
              className={s.gateBtn}
              onClick={() => window.location.reload()}
            >
              retry
            </button>
            <button type="button" className={s.gateGhost} onClick={onClose}>
              &lt;esc&gt; cancel
            </button>
          </>
        )}
      </div>
    </div>
  )
}
