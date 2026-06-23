// psh — the fake shell's command registry. An allow-listed interpreter: every
// command is a pure(ish) function returning output lines (or a control result).
// The "real" commands fetch read-only data the site already exposes; nothing
// here execs a process.

import type { SiteContent } from '@/content/types'
import { fetchTelemetry, type ClusterSnapshot } from '@/api/telemetry'
import { fetchStats } from '@/api/stats'
import { fetchGuestbook } from '@/api/guestbook'

export type Output = string | string[]
export interface Control {
  __control: 'clear' | 'exit' | 'goto' | 'vim'
  section?: string
}
export type RunResult = Output | Control
export function isControl(r: RunResult): r is Control {
  return typeof r === 'object' && !Array.isArray(r) && '__control' in r
}

export interface ShellCtx {
  host: string // serving cluster, for the prompt + neofetch
  appVersion: string
  buildEnv: string
  content: SiteContent
  presence: number | null
  history: string[]
}

export interface Command {
  run: (args: string[], ctx: ShellCtx) => RunResult | Promise<RunResult>
  help: string
  group: 'builtin' | 'cluster' | 'fun'
}

// "Filesystem" + sections (for ls / cat / cd / completion).
export const FILES = ['about.md', 'contacts.yaml', 'portfolio.yaml', 'resume/', 'blog/', '.secret']
export const SECTIONS = ['about', 'portfolio', 'blog', 'resume', 'contact', 'stats', 'system']

// ── formatting helpers ────────────────────────────────────────────────────────
const pct = (u: number, t: number) => (t > 0 ? Math.round((u / t) * 100) : 0)
const bar = (p: number, w = 14) => {
  const f = Math.round((Math.max(0, Math.min(100, p)) / 100) * w)
  return '[' + '#'.repeat(f) + '.'.repeat(w - f) + ']'
}
function uptimeStr(sec: number): string {
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`
}
function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length)
}

async function primaryCluster(): Promise<ClusterSnapshot | null> {
  const data = await fetchTelemetry()
  const c = data?.clusters ?? []
  return c.find((x) => x.role === 'primary') ?? c[0] ?? null
}

const UNAVAILABLE = ['telemetry unavailable — the collector isn’t reporting from here.']

// ── command set ───────────────────────────────────────────────────────────────
export const COMMANDS: Record<string, Command> = {
  help: {
    group: 'builtin',
    help: 'list available commands',
    run: () => {
      const lines = ['petzko shell (psh) — commands:', '']
      const groups: Record<string, string[]> = { builtin: [], cluster: [], fun: [] }
      for (const [name, cmd] of Object.entries(COMMANDS)) {
        groups[cmd.group].push(`  ${pad(name, 22)} ${cmd.help}`)
      }
      lines.push('builtins:', ...groups.builtin.sort())
      lines.push('', 'cluster (live homelab):', ...groups.cluster.sort())
      lines.push('', 'misc:', ...groups.fun.sort())
      lines.push('', "tip: ↑/↓ history · Tab completes · 'exit' or <esc> to leave")
      return lines
    },
  },
  man: {
    group: 'builtin',
    help: 'man <cmd> — show a command’s description',
    run: (args) => {
      const c = COMMANDS[args[0]]
      if (!args[0]) return 'What manual page do you want? (try: man ls)'
      if (!c) return `No manual entry for ${args[0]}`
      return [`NAME`, `    ${args[0]} — ${c.help}`, ``, `SECTION`, `    psh ${c.group}`]
    },
  },
  ls: {
    group: 'builtin',
    help: 'list files',
    run: () => FILES.join('   '),
  },
  cat: {
    group: 'builtin',
    help: 'cat <file> — print a file',
    run: (args, ctx) => {
      const f = args[0]
      if (!f) return 'usage: cat <file>'
      if (f === 'about.md') return ctx.content.about.body.split('\n')
      if (f === 'contacts.yaml')
        return ctx.content.contacts.flatMap((c) => [`- ${c.type}: ${c.url}`])
      if (f === 'portfolio.yaml')
        return ctx.content.portfolio.flatMap((p) => [`- ${p.name}${p.url ? ` <${p.url}>` : ''}`])
      if (f === '.secret') return 'the only secret here is that the uptime really is great.'
      if (f.endsWith('/')) return `cat: ${f}: Is a directory`
      if (FILES.includes(f)) return `cat: ${f}: Is a directory`
      return `cat: ${f}: No such file or directory`
    },
  },
  cd: {
    group: 'builtin',
    help: 'cd <section> — jump to a site section',
    run: (args) => {
      const s = args[0]?.replace(/\/$/, '')
      if (!s) return { __control: 'goto', section: 'about' }
      if (SECTIONS.includes(s)) return { __control: 'goto', section: s }
      return `cd: ${s}: no such section (try: ${SECTIONS.join(', ')})`
    },
  },
  whoami: { group: 'builtin', help: 'print the current user', run: () => 'visitor' },
  pwd: { group: 'builtin', help: 'print working directory', run: () => '/home/visitor' },
  echo: { group: 'builtin', help: 'echo <text>', run: (args) => args.join(' ') },
  date: { group: 'builtin', help: 'current date/time', run: () => new Date().toString() },
  clear: { group: 'builtin', help: 'clear the screen (Ctrl+L)', run: () => ({ __control: 'clear' }) },
  exit: { group: 'builtin', help: 'leave the shell (<esc>)', run: () => ({ __control: 'exit' }) },
  quit: { group: 'builtin', help: 'leave the shell', run: () => ({ __control: 'exit' }) },
  history: {
    group: 'builtin',
    help: 'show command history',
    run: (_args, ctx) => ctx.history.map((h, i) => `  ${pad(String(i + 1), 4)}${h}`),
  },

  // ── cluster (live) ──
  neofetch: {
    group: 'cluster',
    help: 'system summary (ASCII)',
    run: async () => {
      const c = await primaryCluster()
      if (!c) return UNAVAILABLE
      const crest = ['   *   ', '  /\\   ', ' /  \\  ', '/____\\ ', '  ~~~  ', ' \\  /  ', '  \\/   ']
      const facts = [
        `visitor@${c.cluster_id}`,
        '───────────────────',
        `OS      Talos ${c.cluster.talos_version || '—'}`,
        `Kernel  k8s ${c.cluster.k8s_version || '—'}`,
        `Uptime  ${uptimeStr(c.cluster.uptime_seconds)}`,
        `Nodes   ${c.cluster.nodes_ready}/${c.cluster.nodes_total}`,
        `CPU     ${pct(c.resources.cpu_used_cores, c.resources.cpu_total_cores)}%`,
        `Memory  ${pct(c.resources.mem_used_bytes, c.resources.mem_total_bytes)}%`,
        `Pods    ${c.workloads.pods_running}/${c.workloads.pods_total}`,
        c.services ? `Svcs    ${c.services.length}` : '',
      ].filter(Boolean)
      const rows = Math.max(crest.length, facts.length)
      const out: string[] = []
      for (let i = 0; i < rows; i++) out.push(`${pad(crest[i] ?? '', 8)} ${facts[i] ?? ''}`)
      return out
    },
  },
  uptime: {
    group: 'cluster',
    help: 'how long the cluster has been up',
    run: async () => {
      const c = await primaryCluster()
      if (!c) return UNAVAILABLE
      const t = new Date().toLocaleTimeString('en-GB', { hour12: false })
      const load = c.cluster.load_1 != null ? `, load average: ${c.cluster.load_1.toFixed(2)}, ${(c.cluster.load_5 ?? 0).toFixed(2)}, ${(c.cluster.load_15 ?? 0).toFixed(2)}` : ''
      return ` ${t} up ${uptimeStr(c.cluster.uptime_seconds)}${load}`
    },
  },
  top: {
    group: 'cluster',
    help: 'live node resource usage',
    run: async () => {
      const c = await primaryCluster()
      if (!c) return UNAVAILABLE
      const out = [
        `cpu ${bar(pct(c.resources.cpu_used_cores, c.resources.cpu_total_cores))} ${pct(c.resources.cpu_used_cores, c.resources.cpu_total_cores)}%   ` +
          `mem ${bar(pct(c.resources.mem_used_bytes, c.resources.mem_total_bytes))} ${pct(c.resources.mem_used_bytes, c.resources.mem_total_bytes)}%`,
        '',
        `${pad('NODE', 16)}${pad('CPU', 8)}MEM`,
      ]
      for (const n of c.nodes) out.push(`${pad(n.name, 16)}${pad(n.cpu_pct + '%', 8)}${n.mem_pct}%`)
      return out
    },
  },
  kubectl: {
    group: 'cluster',
    help: 'kubectl get nodes | pods | applications',
    run: async (args) => {
      if (args[0] !== 'get') return "usage: kubectl get <nodes|pods|applications>"
      const c = await primaryCluster()
      if (!c) return UNAVAILABLE
      const what = args[1]
      if (what === 'nodes') {
        const out = [`${pad('NAME', 16)}${pad('STATUS', 10)}${pad('CPU', 7)}MEM`]
        for (const n of c.nodes)
          out.push(`${pad(n.name, 16)}${pad(n.ready ? 'Ready' : 'NotReady', 10)}${pad(n.cpu_pct + '%', 7)}${n.mem_pct}%`)
        return out
      }
      if (what === 'pods')
        return `${c.workloads.pods_running}/${c.workloads.pods_total} pods running across ${c.workloads.namespaces} namespaces`
      if (what === 'applications' || what === 'apps' || what === 'app') {
        if (!c.services?.length) return 'no application data (ArgoCD metrics not scraped)'
        return ['NAME', ...c.services.map((s) => `  ${s}`)]
      }
      return `error: unknown resource "${what ?? ''}" (try: nodes, pods, applications)`
    },
  },
  stats: {
    group: 'cluster',
    help: 'live site stats',
    run: async () => {
      try {
        const [s, gb] = await Promise.all([fetchStats(), fetchGuestbook(50).catch(() => [])])
        return [
          `page views      ${s.visits.toLocaleString()}`,
          `unique visitors ${s.uniques.toLocaleString()}`,
          `guestbook       ${gb.length} entries`,
        ]
      } catch {
        return 'stats unavailable'
      }
    },
  },
  who: {
    group: 'cluster',
    help: 'who is online right now',
    run: (_args, ctx) =>
      ctx.presence == null
        ? 'presence unavailable'
        : `${ctx.presence} ${ctx.presence === 1 ? 'visitor' : 'visitors'} connected`,
  },
  curl: {
    group: 'cluster',
    help: 'curl /api/<path> — fetch an allow-listed endpoint',
    run: async (args) => {
      const raw = args[0]
      if (!raw) return 'usage: curl /api/<path>'
      const path = raw.replace(/^https?:\/\/petzko\.sh/i, '')
      if (!path.startsWith('/api/')) return `curl: refusing ${raw} — only /api/* paths are allowed`
      try {
        const res = await fetch(path, { headers: { accept: 'application/json' } })
        const text = await res.text()
        try {
          return JSON.stringify(JSON.parse(text), null, 2).split('\n')
        } catch {
          return text.split('\n').slice(0, 40)
        }
      } catch {
        return `curl: (7) failed to connect to ${path}`
      }
    },
  },

  // ── misc / easter eggs ──
  vim: {
    group: 'fun',
    help: 'open vim (good luck)',
    run: () => ({ __control: 'vim' }),
  },
  sudo: {
    group: 'fun',
    help: 'sudo <cmd> — execute as superuser',
    run: () => 'visitor is not in the sudoers file. This incident will be reported.',
  },
  rm: {
    group: 'fun',
    help: 'rm <file>',
    run: (args) => {
      const a = args.join(' ')
      if (/-[a-z]*r[a-z]*f|--no-preserve-root/.test(a) && a.includes('/'))
        return ['rm: removing /…', 'rm: removing /etc…', 'rm: removing /home…', '…just kidding. nice try.']
      if (!args.length) return 'rm: missing operand'
      return `rm: cannot remove '${args[0]}': Permission denied`
    },
  },
  fortune: {
    group: 'fun',
    help: 'a random quip',
    run: () => {
      const fs = [
        'My biggest strength is that I know how to exit vim.',
        'There is no cloud — it’s just someone else’s homelab.',
        'It works on my cluster.',
        'Emotionally unavailable, but the uptime is great.',
        'rm -rf regrets/',
      ]
      return fs[Math.floor(((Date.now() / 1000) % fs.length))]
    },
  },
  cowsay: {
    group: 'fun',
    help: 'cowsay <message>',
    run: (args) => {
      const msg = args.join(' ') || 'mooo'
      const top = ' ' + '_'.repeat(msg.length + 2)
      const bot = ' ' + '-'.repeat(msg.length + 2)
      return [top, `< ${msg} >`, bot, '        \\   ^__^', '         \\  (oo)\\_______', '            (__)\\       )\\/\\', '                ||----w |', '                ||     ||']
    },
  },
  sl: { group: 'fun', help: 'you typed it wrong', run: () => 'choo choo! 🚂  (you meant `ls`)' },
}

// Aliases.
export const ALIASES: Record<string, string> = { kgapp: 'kubectl', users: 'who', '?': 'help' }

// Tab-completion: complete a command name, or an argument for cat/cd/kubectl.
// Returns the completed input string (full match + space, or the longest common
// prefix when ambiguous), or nothing when there's no match / no progress.
export function complete(input: string): string | undefined {
  const parts = input.split(/\s+/)
  const isFirst = parts.length <= 1
  const pre = parts[parts.length - 1] ?? ''
  let pool: string[]
  if (isFirst) {
    if (!pre) return undefined
    pool = [...Object.keys(COMMANDS), ...Object.keys(ALIASES)]
  } else if (parts[0] === 'cat') pool = FILES
  else if (parts[0] === 'cd' || parts[0] === 'goto') pool = SECTIONS
  else if (parts[0] === 'kubectl') pool = ['get', 'nodes', 'pods', 'applications']
  else return undefined

  const m = pool.filter((x) => x.startsWith(pre)).sort()
  if (m.length === 0) return undefined
  const rebuild = (tok: string, space: boolean) =>
    (isFirst ? tok : parts.slice(0, -1).concat(tok).join(' ')) + (space ? ' ' : '')
  if (m.length === 1) return rebuild(m[0], true)
  let cp = m[0]
  for (const s of m) while (!s.startsWith(cp)) cp = cp.slice(0, -1)
  return cp.length > pre.length ? rebuild(cp, false) : undefined
}
