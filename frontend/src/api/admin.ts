// Client for the Cloudflare Access–gated admin endpoints (petzko-edge Worker,
// /api/admin/*). Access enforces auth at the edge; these helpers just drive the
// gate UI. Same-origin in prod; in `vite dev`, /api is proxied to `wrangler dev`
// (which honors the .dev.vars ADMIN_DEV_BYPASS so the flow works locally).

export interface AdminIdentity {
  email: string
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
