import { useEffect, useState } from 'react'
import { ADMIN_LOGOUT_URL } from '@/api/admin'
import { useAdminContent } from './useAdminContent'
import { AboutEditor } from './editors/AboutEditor'
import { ContactEditor } from './editors/ContactEditor'
import { PortfolioEditor } from './editors/PortfolioEditor'
import { GuestLogModerator } from './editors/GuestLogModerator'
import s from './admin.module.css'

type SectionId = 'about' | 'contact' | 'portfolio' | 'guestlog' | 'blog'

/**
 * The authenticated admin editor. Full-screen, deliberately off-theme, with a
 * draft/save model backed by the browser store (Phase 1). `email` is the
 * verified Access identity; `onClose` returns to the site.
 */
export function AdminApp({ email, onClose }: { email: string; onClose: () => void }) {
  const store = useAdminContent()
  const [section, setSection] = useState<SectionId>('about')
  const [guestCount, setGuestCount] = useState<number | null>(null)

  // Esc closes (confirming if there are unsaved edits).
  const attemptClose = () => {
    if (store.dirty && !window.confirm('Discard unsaved changes?')) return
    onClose()
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        attemptClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // attemptClose closes over current dirty; re-bind when it changes
  }, [store.dirty]) // eslint-disable-line react-hooks/exhaustive-deps

  const nav: { id: SectionId; label: string; count?: number | string; soon?: boolean }[] = [
    { id: 'about', label: 'about', count: 1 },
    { id: 'contact', label: 'contact', count: store.draft.contacts.length },
    { id: 'portfolio', label: 'portfolio', count: store.draft.portfolio.length },
    { id: 'guestlog', label: 'guest log', count: guestCount ?? '·' },
    { id: 'blog', label: 'blog', soon: true },
  ]

  return (
    <div className={s.overlay}>
      {/* ── Top bar ── */}
      <div className={s.topbar}>
        <div className={s.brand}>
          <span className={s.brandDot} />
          <span>petzko.sh</span>
          <span className={s.brandSep}>/</span>
          <span className={s.brandSub}>admin</span>
        </div>
        <div className={s.topRight}>
          <span className={s.badge}>● cloudflare access</span>
          <span className={s.who}>{email}</span>
          <button type="button" className={s.closeBtn} onClick={attemptClose}>
            <span className={s.kbd}>&lt;esc&gt;</span> close ✕
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className={s.body}>
        <nav className={s.sidebar}>
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${s.navItem} ${section === item.id ? s.navItemActive : ''}`}
              onClick={() => setSection(item.id)}
            >
              <span className={s.navChevron}>›</span>
              <span className={s.navLabel}>{item.label}</span>
              {item.soon ? (
                <span className={s.navSoon}>soon</span>
              ) : (
                <span className={s.navCount}>{item.count}</span>
              )}
            </button>
          ))}

          <div className={s.sidebarFoot}>
            changes save to this browser. Wire <b>save</b> to your backend (D1)
            for production.
            <button type="button" className={s.resetBtn} onClick={store.resetToSeed}>
              reset to seed content
            </button>
          </div>
        </nav>

        <main className={s.main}>
          {section === 'about' && (
            <AboutEditor value={store.draft.about} onChange={store.setAbout} />
          )}
          {section === 'contact' && (
            <ContactEditor value={store.draft.contacts} onChange={store.setContacts} />
          )}
          {section === 'portfolio' && (
            <PortfolioEditor
              value={store.draft.portfolio}
              onChange={store.setPortfolio}
            />
          )}
          {section === 'guestlog' && <GuestLogModerator onCount={setGuestCount} />}
          {section === 'blog' && (
            <div className={s.editor}>
              <header className={s.editorHead}>
                <h2 className={s.editorTitle}>Blog</h2>
                <p className={s.subtle}>Coming soon.</p>
              </header>
            </div>
          )}
        </main>
      </div>

      {/* ── Bottom bar ── */}
      <div className={s.bottombar}>
        <span className={`${s.status} ${store.dirty ? s.statusDirty : ''}`}>
          <span className={s.statusDot} />
          {store.dirty ? 'unsaved changes' : 'all changes saved'}
        </span>
        <div className={s.bottomActions}>
          <a className={s.discardBtn} href={ADMIN_LOGOUT_URL}>
            sign out
          </a>
          <button
            type="button"
            className={s.discardBtn}
            onClick={store.discard}
            disabled={!store.dirty}
          >
            discard
          </button>
          <button
            type="button"
            className={s.saveBtn}
            onClick={store.save}
            disabled={!store.dirty}
          >
            save changes
          </button>
        </div>
      </div>
    </div>
  )
}
