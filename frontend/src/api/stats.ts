// Client for the edge stats API (petzko-edge Worker on /api/*).
// Same-origin in prod; in `vite dev`, /api is proxied to `wrangler dev`
// (localhost:8787) — see vite.config.ts.

export interface SiteStats {
  visits: number
  uniques: number
}

export async function fetchStats(signal?: AbortSignal): Promise<SiteStats> {
  const res = await fetch('/api/stats', {
    signal,
    headers: { accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`stats ${res.status}`)
  return (await res.json()) as SiteStats
}

// Fire-and-forget visit beacon. Guarded so it sends at most once per page load
// (StrictMode mounts effects twice in dev). Failures are ignored — a missed
// beacon shouldn't surface to the user.
let beaconed = false
export function beaconVisit(): void {
  if (beaconed) return
  beaconed = true
  void fetch('/api/visit', { method: 'POST', keepalive: true }).catch(() => {})
}
