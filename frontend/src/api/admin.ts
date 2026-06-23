// Client for the Cloudflare Access–gated admin endpoints (petzko-edge Worker,
// /api/admin/*). Access enforces auth at the edge; these helpers just drive the
// gate UI. Same-origin in prod; in `vite dev`, /api is proxied to `wrangler dev`
// (which honors the .dev.vars ADMIN_DEV_BYPASS so the flow works locally).

import type { SiteContent } from '@/content/types'

export interface AdminIdentity {
  email: string
}

/** Thrown when an admin write fails because the Cloudflare Access session is no
 *  longer valid — either the Worker rejected the token (401/403) or Access
 *  bounced the request to its cross-origin login page (surfacing as a thrown
 *  fetch). Callers should prompt re-authentication; the local draft is unharmed. */
export class AdminAuthError extends Error {
  constructor() {
    super('admin session expired')
    this.name = 'AdminAuthError'
  }
}

/** Thrown when the Worker rejects a content write as invalid (422). `fields`
 *  lists the section keys it flagged (e.g. 'about', 'contacts', 'portfolio'). */
export class AdminValidationError extends Error {
  fields: string[]
  constructor(fields: string[]) {
    super(fields.length ? `invalid: ${fields.join(', ')}` : 'invalid content')
    this.name = 'AdminValidationError'
    this.fields = fields
  }
}

export interface AdminGuestEntry {
  id: number
  name: string
  message: string
  country: string | null
  created_at: number
  approved: 0 | 1
}

// A full-page navigation to this Access-gated path triggers the Cloudflare
// Access login; afterwards the Worker bounces back into the app with the admin
// section open (?admin=1).
export const ADMIN_LOGIN_URL = '/api/admin/login'

// Cloudflare Access session logout — clears the CF_Authorization cookie.
export const ADMIN_LOGOUT_URL = '/cdn-cgi/access/logout'

/**
 * Returns the signed-in admin identity, or null if not authenticated. Resolves
 * null on 401/403 and on the cross-origin redirect Access issues to its login
 * page (which surfaces to fetch as a network/CORS error) — both mean "log in".
 * Re-throws AbortError so callers can ignore unmount-cancelled requests.
 */
export async function fetchAdminMe(signal?: AbortSignal): Promise<AdminIdentity | null> {
  let res: Response
  try {
    res = await fetch('/api/admin/me', {
      signal,
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err
    return null // Access redirected the unauthenticated XHR cross-origin.
  }
  if (res.status === 401 || res.status === 403) return null
  if (!res.ok) throw new Error(`admin/me ${res.status}`)
  return (await res.json()) as AdminIdentity
}

/** Save all three content sections to D1. Throws AdminAuthError when the Access
 *  session has expired, or a generic Error on other server failures. */
export async function putAdminContent(content: SiteContent): Promise<void> {
  let res: Response
  try {
    res = await fetch('/api/admin/content', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(content),
    })
  } catch {
    // A thrown fetch on this same-origin PUT almost always means Access bounced
    // it to its cross-origin login page (expired session), surfacing as a
    // CORS/network error. Treat as an auth failure — the draft is safe locally.
    throw new AdminAuthError()
  }
  if (res.status === 401 || res.status === 403) throw new AdminAuthError()
  if (res.status === 422) {
    let fields: string[] = []
    try {
      const body = (await res.json()) as { fields?: unknown }
      if (Array.isArray(body.fields)) {
        fields = body.fields.filter((f): f is string => typeof f === 'string')
      }
    } catch {
      // non-JSON body — fall through with empty fields
    }
    throw new AdminValidationError(fields)
  }
  if (!res.ok) throw new Error(`PUT /api/admin/content ${res.status}`)
}

/** All guestbook entries (including unapproved) for moderation. */
export async function fetchAdminGuestbook(signal?: AbortSignal): Promise<AdminGuestEntry[]> {
  const res = await fetch('/api/admin/guestbook', {
    signal,
    credentials: 'same-origin',
  })
  if (!res.ok) throw new Error(`admin/guestbook ${res.status}`)
  const data = (await res.json()) as { entries: AdminGuestEntry[] }
  return data.entries
}

/** Flip the approved flag on a single guestbook entry. */
export async function setGuestApproved(id: number, approved: 0 | 1): Promise<void> {
  const res = await fetch(`/api/admin/guestbook/${id}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ approved }),
  })
  if (!res.ok) throw new Error(`PATCH /api/admin/guestbook/${id} ${res.status}`)
}

/** Delete a guestbook entry permanently. */
export async function deleteGuestEntry(id: number): Promise<void> {
  const res = await fetch(`/api/admin/guestbook/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  })
  if (!res.ok) throw new Error(`DELETE /api/admin/guestbook/${id} ${res.status}`)
}
