// Admin content model + one-time seed from the static content files.
//
// Phase 1 keeps an editable copy of the site's content in the browser
// (localStorage) so the admin UI can be built and exercised before the D1
// backend exists. The src/content/* files are used ONLY to seed the store the
// first time; after that the store is the source of truth for the editor.
// (Wiring the live site to read this — via D1 — is Phase 2.)

import aboutRaw from '@/content/about.md?raw'
import contactsRaw from '@/content/contacts.yaml?raw'
import portfolioRaw from '@/content/portfolio.yaml?raw'
import { parseFrontmatter } from '@/content/frontmatter'
import { parse } from 'yaml'

export interface AboutDoc {
  heading: string
  avatar: string
  avatarAlt: string
  body: string
}

export interface ContactItem {
  type: string
  url: string
  description: string
  click: boolean
  newTab: boolean
  copy: boolean
}

export interface ProjectItem {
  type: string
  name: string
  url: string
  company: string
  description: string
}

export interface AdminContent {
  about: AboutDoc
  contacts: ContactItem[]
  portfolio: ProjectItem[]
}

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
  const about: AboutDoc = {
    heading: fm.data.title ?? 'About',
    avatar: fm.data.avatar ?? '',
    avatarAlt: fm.data.avatarAlt ?? '',
    body: fm.content.replace(/^\s+/, ''),
  }

  const contacts = ((parse(contactsRaw) as { contacts?: Record<string, unknown>[] })
    .contacts ?? []).map(normalizeContact)
  const portfolio = ((parse(portfolioRaw) as { portfolio?: Record<string, unknown>[] })
    .portfolio ?? []).map(normalizeProject)

  return { about, contacts, portfolio }
}
