// Admin content model — types come from content/types.ts (shared with the live
// site); this module owns editor helpers, empty-item factories, and the seed
// function used to pre-populate a fresh admin session.

import aboutRaw from '@/content/about.md?raw'
import contactsRaw from '@/content/contacts.yaml?raw'
import portfolioRaw from '@/content/portfolio.yaml?raw'
import { parseFrontmatter } from '@/content/frontmatter'
import { parse } from 'yaml'
import type { ContactItem, ProjectItem, SiteContent } from '@/content/types'

export type { AboutDoc, ContactItem, ProjectItem, SiteContent } from '@/content/types'

// AdminContent is an alias for SiteContent — keeps existing imports working.
export type AdminContent = SiteContent

/** Known contact `type` values (for the editor's suggestions). */
export const CONTACT_TYPES = [
  'github',
  'linkedin',
  'gmail',
  'instagram',
  'x',
  'facebook',
  'discord',
] as const

/** Common portfolio `type` values (free text otherwise). */
export const PROJECT_TYPES = ['github', 'Work Project'] as const

export function emptyContact(): ContactItem {
  return { type: '', url: '', description: '', click: true, newTab: true, copy: false }
}

export function emptyProject(): ProjectItem {
  return { type: 'github', name: '', url: '', company: '', description: '' }
}

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

/** Build the initial content by parsing the static content files. */
export function seedContent(): AdminContent {
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
