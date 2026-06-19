/**
 * Minimal frontmatter parser for our controlled content files. Supports a
 * leading `---` block of simple `key: value` pairs — enough for avatar/title
 * without pulling in a YAML dependency.
 */
export interface Parsed {
  data: Record<string, string>
  content: string
}

export function parseFrontmatter(raw: string): Parsed {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, content: raw }

  const data: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^["']|["']$/g, '')
    if (key) data[key] = value
  }

  return { data, content: raw.slice(match[0].length) }
}
