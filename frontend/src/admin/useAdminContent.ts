import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { seedContent, type AdminContent, type AboutDoc, type ContactItem, type ProjectItem } from './model'
import { fetchSiteContent, mergeContent } from '@/content/load'
import { putAdminContent, AdminAuthError, AdminValidationError } from '@/api/admin'

// Keep an unsaved-draft recovery cache in localStorage so edits survive a page
// reload before the user saves. Cleared on successful save.
const DRAFT_KEY = 'petzko:admin:draft:v2'

function loadDraft(): AdminContent | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) return JSON.parse(raw) as AdminContent
  } catch {
    // corrupt / unavailable
  }
  return null
}

function saveDraft(c: AdminContent) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(c))
  } catch {
    // best-effort
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // best-effort
  }
}

export interface AdminContentStore {
  draft: AdminContent
  saved: AdminContent
  dirty: boolean
  loading: boolean
  saving: boolean
  saveError: string | null
  /** True when the last save failed because the Access session expired. The
   *  draft is preserved; the UI should prompt re-authentication. */
  authExpired: boolean
  /** Section keys the Worker rejected as invalid on the last save (e.g.
   *  'about', 'contacts', 'portfolio'); empty when the last save was valid. */
  invalidFields: string[]
  save: () => Promise<void>
  discard: () => void
  resetToSeed: () => void
  setAbout: (about: AboutDoc) => void
  setContacts: (contacts: ContactItem[]) => void
  setPortfolio: (portfolio: ProjectItem[]) => void
}

export function useAdminContent(): AdminContentStore {
  const seed = useMemo(() => seedContent(), [])
  const [saved, setSaved] = useState<AdminContent>(seed)
  const [draft, setDraft] = useState<AdminContent>(() => loadDraft() ?? seed)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [authExpired, setAuthExpired] = useState(false)
  const [invalidFields, setInvalidFields] = useState<string[]>([])

  // Hydrate from D1 on mount. If there's a local draft (unsaved changes), keep
  // it on top of the freshly fetched saved state. Live content is merged per-key
  // over the seed so a missing/malformed section falls back rather than breaking
  // the editor.
  const hasDraft = useRef(loadDraft() !== null)
  useEffect(() => {
    const ctrl = new AbortController()
    fetchSiteContent(ctrl.signal).then((live) => {
      if (live) {
        const merged = mergeContent(seed, live)
        setSaved(merged)
        if (!hasDraft.current) setDraft(merged)
      }
      setLoading(false)
    })
    return () => ctrl.abort()
    // seed is referentially stable (useMemo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved],
  )

  // Mirror the draft to localStorage for crash/reload recovery. When the draft
  // matches the saved snapshot (e.g. edits manually reverted), clear the cache
  // so a reload doesn't resurrect phantom "unsaved changes".
  useEffect(() => {
    if (dirty) {
      saveDraft(draft)
      hasDraft.current = true
    } else {
      clearDraft()
      hasDraft.current = false
    }
  }, [draft, dirty])

  const save = useCallback(async () => {
    setSaving(true)
    setSaveError(null)
    setAuthExpired(false)
    setInvalidFields([])
    try {
      await putAdminContent(draft)
      setSaved(draft)
      clearDraft()
      hasDraft.current = false
    } catch (err) {
      if (err instanceof AdminAuthError) setAuthExpired(true)
      else if (err instanceof AdminValidationError) setInvalidFields(err.fields)
      else setSaveError(err instanceof Error ? err.message : 'save failed')
    } finally {
      setSaving(false)
    }
  }, [draft])

  const discard = useCallback(() => {
    setDraft(saved)
    clearDraft()
    hasDraft.current = false
  }, [saved])

  const resetToSeed = useCallback(() => {
    setDraft(seed)
    saveDraft(seed)
    hasDraft.current = true
  }, [seed])

  const setAbout = useCallback((about: AboutDoc) => setDraft((d) => ({ ...d, about })), [])
  const setContacts = useCallback((contacts: ContactItem[]) => setDraft((d) => ({ ...d, contacts })), [])
  const setPortfolio = useCallback((portfolio: ProjectItem[]) => setDraft((d) => ({ ...d, portfolio })), [])

  return { draft, saved, dirty, loading, saving, saveError, authExpired, invalidFields, save, discard, resetToSeed, setAbout, setContacts, setPortfolio }
}
