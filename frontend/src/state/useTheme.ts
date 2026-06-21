import { useCallback, useState } from 'react'

/**
 * The canonical list of CRT colour themes — the single source of truth for
 * theme ids. Each is a base-phosphor palette (green / amber / IBM blue / white)
 * defined in theme.css; the shared k9s accent set rides on top. Add a theme
 * here (and a matching [data-theme] block in theme.css) and everything else —
 * cycling, the `:theme` command, validation — follows automatically. (The
 * pre-paint script in index.html can't import this, so it just applies the
 * stored value and lets the app normalise anything unknown.)
 */
export const THEMES = ['green', 'amber', 'ibm', 'white'] as const
export type Theme = (typeof THEMES)[number]

/** Palette used when nothing valid is stored. */
export const DEFAULT_THEME: Theme = 'green'

const STORAGE_KEY = 'petzko:theme'

function isTheme(v: unknown): v is Theme {
  return typeof v === 'string' && (THEMES as readonly string[]).includes(v)
}

/** The live theme — the `data-theme` attribute is the source of truth (it's set
 * before first paint by the inline script in index.html). */
function current(): Theme {
  const t = document.documentElement.dataset.theme
  return isTheme(t) ? t : DEFAULT_THEME
}

/**
 * Theme state for the TUI. Applies the choice to <html data-theme> (which drives
 * the CSS variables) and persists it to localStorage. `cycle` advances to the
 * next theme — bound to the `t` key.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(current)

  const setTheme = useCallback((next: Theme) => {
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode / disabled storage — the in-page choice still applies */
    }
    setThemeState(next)
  }, [])

  // Read the live attribute (not the closed-over state) so the callback can stay
  // stable without going stale.
  const cycle = useCallback(() => {
    const next = THEMES[(THEMES.indexOf(current()) + 1) % THEMES.length]
    setTheme(next)
  }, [setTheme])

  return { theme, themes: THEMES, setTheme, cycle }
}
