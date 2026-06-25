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
    icon: String(p.icon ?? '').trim(),
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
 *  caller can fall back to the bundled content. The Worker omits any key whose
 *  D1 row is missing or fails to parse, so the result is intentionally partial —
 *  merge it over the bundled content with `mergeContent` before use. */
export async function fetchSiteContent(
  signal?: AbortSignal,
): Promise<Partial<SiteContent> | null> {
  try {
    const res = await fetch('/api/content', { signal })
    if (!res.ok) return null
    const data = (await res.json()) as unknown
    if (!data || typeof data !== 'object') return null
    return data as Partial<SiteContent>
  } catch {
    return null
  }
}

/** Merge partial live content over a complete base, per key. A missing or
 *  malformed section falls back to the base rather than crashing consumers. */
export function mergeContent(
  base: SiteContent,
  live: Partial<SiteContent> | null,
): SiteContent {
  if (!live) return base
  return {
    about: isAbout(live.about) ? live.about : base.about,
    contacts: Array.isArray(live.contacts) ? live.contacts : base.contacts,
    portfolio: Array.isArray(live.portfolio) ? live.portfolio : base.portfolio,
  }
}

function isAbout(x: unknown): x is SiteContent['about'] {
  return (
    !!x &&
    typeof x === 'object' &&
    typeof (x as Record<string, unknown>).body === 'string'
  )
}
