import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadBundledContent, fetchSiteContent, mergeContent } from '@/content/load'
import type { SiteContent } from '@/content/types'

const ContentCtx = createContext<SiteContent | null>(null)

/** Provides site content to the tree. Renders instantly with bundled content,
 *  then hydrates from D1 asynchronously; falls back silently on network error.
 *  Live content is merged per-key over the bundled content, so a missing or
 *  malformed section falls back to the bundle rather than crashing the site. */
export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(loadBundledContent)

  useEffect(() => {
    const ctrl = new AbortController()
    fetchSiteContent(ctrl.signal).then((live) => {
      if (live) setContent((base) => mergeContent(base, live))
    })
    return () => ctrl.abort()
  }, [])

  return <ContentCtx.Provider value={content}>{children}</ContentCtx.Provider>
}

export function useSiteContent(): SiteContent {
  const ctx = useContext(ContentCtx)
  if (!ctx) throw new Error('useSiteContent must be used within a ContentProvider')
  return ctx
}
