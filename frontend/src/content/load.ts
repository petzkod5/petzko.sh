import aboutRaw from './about.md?raw'
import contactsRaw from './contacts.yaml?raw'
import portfolioRaw from './portfolio.yaml?raw'
import { parseFrontmatter } from './frontmatter'
import { parse } from 'yaml'
import type { SiteContent, ContactItem, ProjectItem } from './types'

function normalizeContact(c: Record<string, unknown>): ContactItem {
  return {
    type: String(c.type ?? ''),
    url: String(c.url ?? ''),
    description: String(c.description ?? '').trim(),
    click: Boolean(c.click),
    newTab: Boolean(c.newTab),
    copy: Boolean(c.copy),
  }
}

function normalizeProject(p: Record<string, unknown>): ProjectItem {
  return {
    type: String(p.type ?? ''),
    name: String(p.name ?? ''),
    url: String(p.url ?? ''),
    company: String(p.company ?? ''),
    description: String(p.description ?? '').trim(),
  }
}

/** Parse the static content files bundled at build time. Used as instant initial
 *  content and as fallback when D1 is unreachable. */
export function loadBundledContent(): SiteContent {
  const fm = parseFrontmatter(aboutRaw)
  const about = {
    heading: fm.data.title ?? 'About',
    avatar: fm.data.avatar ?? '',
    avatarAlt: fm.data.avatarAlt ?? '',
    body: fm.content.replace(/^\s+/, ''),
  }

  const contacts = (
    (parse(contactsRaw) as { contacts?: Record<string, unknown>[] }).contacts ?? []
  ).map(normalizeContact)

  const portfolio = (
    (parse(portfolioRaw) as { portfolio?: Record<string, unknown>[] }).portfolio ?? []
  ).map(normalizeProject)

  return { about, contacts, portfolio }
}

/** Fetch live content from D1 via the Worker. Returns null on any error so the
 *  caller can fall back to the bundled content. */
export async function fetchSiteContent(signal?: AbortSignal): Promise<SiteContent | null> {
  try {
    const res = await fetch('/api/content', { signal })
    if (!res.ok) return null
    return (await res.json()) as SiteContent
  } catch {
    return null
  }
}
