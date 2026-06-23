import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { loadBundledContent, fetchSiteContent } from '@/content/load'
import type { SiteContent } from '@/content/types'

const ContentCtx = createContext<SiteContent>(loadBundledContent())

/** Provides site content to the tree. Renders instantly with bundled content,
 *  then hydrates from D1 asynchronously; falls back silently on network error. */
export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(loadBundledContent)

  useEffect(() => {
    const ctrl = new AbortController()
    fetchSiteContent(ctrl.signal).then((live) => {
      if (live) setContent(live)
    })
    return () => ctrl.abort()
  }, [])

  return <ContentCtx.Provider value={content}>{children}</ContentCtx.Provider>
}

export function useSiteContent(): SiteContent {
  return useContext(ContentCtx)
}
