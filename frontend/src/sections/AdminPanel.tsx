import { useEffect, useState } from 'react'
import {
  fetchAdminMe,
  ADMIN_LOGIN_URL,
  ADMIN_LOGOUT_URL,
  type AdminIdentity,
} from '@/api/admin'
import styles from './AdminPanel.module.css'

type Gate = 'checking' | 'authed' | 'unauth' | 'error'

/**
 * Admin section — gated behind Cloudflare Access. On open it asks the Worker
 * "who am I" (GET /api/admin/me); the Worker only answers for a valid, signed
 * Access JWT. Unauthenticated visitors get a locked panel with an Authenticate
 * action that starts the Access login (a full-page nav, since Access hosts the
 * login UI). The content is a coming-soon placeholder for now — the point of
 * this phase is the gate itself.
 */
export function AdminPanel() {
  const [gate, setGate] = useState<Gate>('checking')
  const [me, setMe] = useState<AdminIdentity | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    fetchAdminMe(ctrl.signal)
      .then((id) => {
        setMe(id)
        setGate(id ? 'authed' : 'unauth')
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name !== 'AbortError') setGate('error')
      })
    return () => ctrl.abort()
  }, [])

  return (
    <div className={styles.admin}>
      <div className={styles.header}>
        <span className={styles.lock} aria-hidden="true">
          {gate === 'authed' ? '◆' : '▮'}
        </span>
        <span className={styles.title}>ADMIN</span>
        <span className={styles.tag}>
          {gate === 'authed' ? 'authenticated' : 'restricted'}
        </span>
      </div>

      {gate === 'checking' && (
        <p className={styles.line}>
          verifying clearance<span className={styles.blink}>…</span>
        </p>
      )}

      {gate === 'unauth' && (
        <div className={styles.gateBox}>
          <p className={styles.line}>
            access restricted — Cloudflare Access authentication required.
          </p>
          <a className={styles.btn} href={ADMIN_LOGIN_URL}>
            authenticate →
          </a>
        </div>
      )}

      {gate === 'error' && (
        <div className={styles.gateBox}>
          <p className={styles.line}>auth check failed — the edge is unreachable.</p>
          <button
            type="button"
            className={styles.btn}
            onClick={() => window.location.reload()}
          >
            retry
          </button>
        </div>
      )}

      {gate === 'authed' && (
        <div className={styles.body}>
          <p className={styles.line}>
            signed in as <span className={styles.email}>{me?.email}</span>
          </p>
          <p className={styles.soon}>
            control panel — <span className={styles.blink}>coming soon</span>
          </p>
          <a className={styles.signout} href={ADMIN_LOGOUT_URL}>
            sign out
          </a>
        </div>
      )}
    </div>
  )
}

export default AdminPanel
