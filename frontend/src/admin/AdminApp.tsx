import { useEffect, useState } from 'react'
import { ADMIN_LOGOUT_URL } from '@/api/admin'
import { useAdminContent } from './useAdminContent'
import { AboutEditor } from './editors/AboutEditor'
import { ContactEditor } from './editors/ContactEditor'
import { PortfolioEditor } from './editors/PortfolioEditor'
import { GuestLogModerator } from './editors/GuestLogModerator'
import s from './admin.module.css'

type SectionId = 'about' | 'contact' | 'portfolio' | 'guestlog' | 'blog'

export function AdminApp({ email, onClose }: { email: string; onClose: () => void }) {
  const store = useAdminContent()
  const [section, setSection] = useState<SectionId>('about')
  const [guestCount, setGuestCount] = useState<number | null>(null)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.dirty])

  const nav: { id: SectionId; label: string; count?: number | string; soon?: boolean }[] = [
    { id: 'about', label: 'about', count: 1 },
    { id: 'contact', label: 'contact', count: store.draft.contacts.length },
    { id: 'portfolio', label: 'portfolio', count: store.draft.portfolio.length },
    { id: 'guestlog', label: 'guest log', count: guestCount ?? '·' },
    { id: 'blog', label: 'blog', soon: true },
  ]

  const statusLabel = store.saving
    ? 'saving…'
    : store.saveError
      ? `error: ${store.saveError}`
      : store.loading
        ? 'loading…'
        : store.dirty
          ? 'unsaved changes'
          : 'all changes saved'

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
            {store.loading ? 'loading content from D1…' : 'changes saved to D1 on save.'}
            <button type="button" className={s.resetBtn} onClick={store.resetToSeed}>
              reset to seed content
            </button>
          </div>
        </nav>

        <main className={s.main}>
          {store.loading ? (
            <div className={s.editor}>
              <p className={s.empty}>loading content…</p>
            </div>
          ) : (
            <>
              {section === 'about' && (
                <AboutEditor value={store.draft.about} onChange={store.setAbout} />
              )}
              {section === 'contact' && (
                <ContactEditor value={store.draft.contacts} onChange={store.setContacts} />
              )}
              {section === 'portfolio' && (
                <PortfolioEditor value={store.draft.portfolio} onChange={store.setPortfolio} />
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
            </>
          )}
        </main>
      </div>

      {/* ── Bottom bar ── */}
      <div className={s.bottombar}>
        <span className={`${s.status} ${store.dirty ? s.statusDirty : ''} ${store.saveError ? s.statusDirty : ''}`}>
          <span className={s.statusDot} />
          {statusLabel}
        </span>
        <div className={s.bottomActions}>
          <a className={s.discardBtn} href={ADMIN_LOGOUT_URL}>
            sign out
          </a>
          <button
            type="button"
            className={s.discardBtn}
            onClick={store.discard}
            disabled={!store.dirty || store.saving}
          >
            discard
          </button>
          <button
            type="button"
            className={s.saveBtn}
            onClick={() => void store.save()}
            disabled={!store.dirty || store.saving || store.loading}
          >
            {store.saving ? 'saving…' : 'save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
