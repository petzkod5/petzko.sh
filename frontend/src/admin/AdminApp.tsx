import { useEffect, useState } from 'react'
import { ADMIN_LOGOUT_URL, ADMIN_LOGIN_URL } from '@/api/admin'
import { useAdminContent } from './useAdminContent'
import { AboutEditor } from './editors/AboutEditor'
import { ContactEditor } from './editors/ContactEditor'
import { PortfolioEditor } from './editors/PortfolioEditor'
import { GuestLogModerator } from './editors/GuestLogModerator'
import s from './admin.module.css'

type SectionId = 'about' | 'contact' | 'portfolio' | 'guestlog' | 'blog'

// The Worker flags content by storage key ('contacts'/'portfolio'); map those
// to the sidebar section id and a human label for error surfacing.
const FIELD_TO_SECTION: Record<string, { id: SectionId; label: string }> = {
  about: { id: 'about', label: 'About' },
  contacts: { id: 'contact', label: 'Contact' },
  portfolio: { id: 'portfolio', label: 'Portfolio' },
}

export function AdminApp({ email, onClose }: { email: string; onClose: () => void }) {
  const store = useAdminContent()
  const [section, setSection] = useState<SectionId>('about')
  const [guestCount, setGuestCount] = useState<number | null>(null)

  const attemptClose = () => {
    if (store.dirty && !window.confirm('Discard unsaved changes?')) return
    onClose()
  }

  const attemptReset = () => {
    if (
      window.confirm(
        'Replace all editor content with the bundled seed defaults? Your current edits will be lost.',
      )
    ) {
      store.resetToSeed()
    }
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

  // Map the Worker's rejected-field keys onto sidebar sections + display labels.
  const invalid = store.invalidFields
    .map((f) => FIELD_TO_SECTION[f])
    .filter((x): x is { id: SectionId; label: string } => Boolean(x))
  const invalidIds = new Set(invalid.map((x) => x.id))
  const invalidLabels = invalid.map((x) => x.label)

  const statusLabel = store.saving
    ? 'saving…'
    : store.authExpired
      ? 'session expired — your draft is saved'
      : store.invalidFields.length
        ? `rejected — fix ${invalidLabels.join(', ') || 'content'}`
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
              className={`${s.navItem} ${section === item.id ? s.navItemActive : ''} ${
                invalidIds.has(item.id) ? s.navItemInvalid : ''
              }`}
              onClick={() => setSection(item.id)}
            >
              <span className={s.navChevron}>›</span>
              <span className={s.navLabel}>{item.label}</span>
              {invalidIds.has(item.id) && (
                <span className={s.navInvalidMark} title="rejected on last save">
                  !
                </span>
              )}
              {item.soon ? (
                <span className={s.navSoon}>soon</span>
              ) : (
                <span className={s.navCount}>{item.count}</span>
              )}
            </button>
          ))}

          <div className={s.sidebarFoot}>
            {store.loading ? 'loading content from D1…' : 'changes saved to D1 on save.'}
            <button type="button" className={s.resetBtn} onClick={attemptReset}>
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
        <span
          className={`${s.status} ${
            store.dirty || store.saveError || store.authExpired || store.invalidFields.length
              ? s.statusDirty
              : ''
          }`}
        >
          <span className={s.statusDot} />
          {statusLabel}
        </span>
        <div className={s.bottomActions}>
          {store.authExpired && (
            <a className={s.saveBtn} href={ADMIN_LOGIN_URL}>
              re-authenticate →
            </a>
          )}
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
