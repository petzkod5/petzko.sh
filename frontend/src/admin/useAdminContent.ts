import { useCallback, useMemo, useState } from 'react'
import {
  seedContent,
  type AboutDoc,
  type AdminContent,
  type ContactItem,
  type ProjectItem,
} from './model'

// Phase-1 persistence: the editable content lives in localStorage, seeded once
// from the static content files. Bump the version suffix if the shape changes.
const STORAGE_KEY = 'petzko:admin:content:v1'

function load(): AdminContent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AdminContent
  } catch {
    // corrupt/blocked storage — fall back to a fresh seed
  }
  return seedContent()
}

export interface AdminContentStore {
  draft: AdminContent
  dirty: boolean
  /** Persist the draft to the browser store (Phase 2: POST to the backend). */
  save: () => void
  /** Revert the draft back to the last saved snapshot. */
  discard: () => void
  /** Re-seed from the static content files (drops local edits). */
  resetToSeed: () => void
  setAbout: (about: AboutDoc) => void
  setContacts: (contacts: ContactItem[]) => void
  setPortfolio: (portfolio: ProjectItem[]) => void
}

/**
 * Editable admin content with a draft/saved split. `dirty` drives the
 * save/discard affordances; `save` commits the draft to localStorage. Nothing
 * here touches the live site yet — that's the Phase-2 D1 wiring.
 */
export function useAdminContent(): AdminContentStore {
  const [saved, setSaved] = useState<AdminContent>(load)
  const [draft, setDraft] = useState<AdminContent>(saved)

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved],
  )

  const save = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    } catch {
      // best-effort; storage may be unavailable
    }
    setSaved(draft)
  }, [draft])

  const discard = useCallback(() => setDraft(saved), [saved])

  const resetToSeed = useCallback(() => setDraft(seedContent()), [])

  const setAbout = useCallback(
    (about: AboutDoc) => setDraft((d) => ({ ...d, about })),
    [],
  )
  const setContacts = useCallback(
    (contacts: ContactItem[]) => setDraft((d) => ({ ...d, contacts })),
    [],
  )
  const setPortfolio = useCallback(
    (portfolio: ProjectItem[]) => setDraft((d) => ({ ...d, portfolio })),
    [],
  )

  return {
    draft,
    dirty,
    save,
    discard,
    resetToSeed,
    setAbout,
    setContacts,
    setPortfolio,
  }
}
