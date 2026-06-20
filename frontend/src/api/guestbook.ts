// Client for the guest log (guestbook) endpoints on the edge Worker.

export interface GuestEntry {
  id: number
  name: string
  message: string
  country: string | null
  created_at: number
}

export const NAME_MAX = 40
export const MESSAGE_MAX = 280

export async function fetchGuestbook(
  limit = 12,
  signal?: AbortSignal,
): Promise<GuestEntry[]> {
  const res = await fetch(`/api/guestbook?limit=${limit}`, {
    signal,
    headers: { accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`guestbook ${res.status}`)
  const data = (await res.json()) as { entries: GuestEntry[] }
  return data.entries ?? []
}

export type SignResult =
  | { ok: true; entry: GuestEntry }
  | { ok: false; error: string }

export async function signGuestbook(
  name: string,
  message: string,
): Promise<SignResult> {
  try {
    const res = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, message }),
    })
    if (res.ok) {
      const data = (await res.json()) as { entry: GuestEntry }
      return { ok: true, entry: data.entry }
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    return { ok: false, error: data.error ?? 'error' }
  } catch {
    return { ok: false, error: 'offline' }
  }
}

// Fired after a successful sign so an open guest log viewer can refresh.
export const SIGNED_EVENT = 'guestbook:signed'
