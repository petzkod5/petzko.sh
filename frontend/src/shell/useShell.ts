import { useCallback, useMemo, useRef, useState } from 'react'
import { useSiteContent } from '@/state/ContentProvider'
import { usePresence } from '@/state/PresenceProvider'
import { servingCluster, appVersion, buildEnv } from '@/config'
import { COMMANDS, ALIASES, isControl, type RunResult, type ShellCtx } from './commands'

export interface Entry {
  id: number
  echo: string | null // the typed line (with prompt), or null for plain output
  output: string[]
  pending?: boolean
}

const HISTORY_KEY = 'petzko:psh:history'

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) return JSON.parse(raw) as string[]
  } catch {
    /* ignore */
  }
  return []
}

const MOTD = [
  'psh — petzko.sh shell',
  "type 'help' for commands · 'exit' or <esc> to leave",
  '',
]

const VIM_SCREEN = [
  '~ about.md [readonly]',
  '~',
  '~  you opened vim.',
  '~',
  '~  type  :q  to quit  (or :q!, :wq)',
  '~',
]

export interface UseShell {
  entries: Entry[]
  prompt: string
  history: string[]
  run: (raw: string) => void
}

export function useShell(opts: { onExit: () => void; onGoto: (section: string) => void }): UseShell {
  const content = useSiteContent()
  const presence = usePresence()
  const host = servingCluster || 'petzko.sh'
  const promptStr = `visitor@${host}:~$ `

  const [entries, setEntries] = useState<Entry[]>([{ id: 0, echo: null, output: MOTD }])
  const [history, setHistory] = useState<string[]>(loadHistory)
  const [mode, setMode] = useState<'shell' | 'vim'>('shell')

  const idRef = useRef(1)
  const historyRef = useRef(history)
  historyRef.current = history

  const append = useCallback((echo: string | null, output: string[], pending = false): number => {
    const id = idRef.current++
    setEntries((e) => [...e, { id, echo, output, pending }])
    return id
  }, [])

  const patch = useCallback((id: number, output: string[]) => {
    setEntries((e) => e.map((x) => (x.id === id ? { ...x, output, pending: false } : x)))
  }, [])

  const toLines = (r: Exclude<RunResult, { __control: string }>): string[] =>
    typeof r === 'string' ? [r] : r

  const handleControl = useCallback(
    (c: Extract<RunResult, { __control: string }>) => {
      if (c.__control === 'clear') setEntries([])
      else if (c.__control === 'exit') opts.onExit()
      else if (c.__control === 'goto' && c.section) opts.onGoto(c.section)
      else if (c.__control === 'vim') {
        setMode('vim')
        append(null, VIM_SCREEN)
      }
    },
    [append, opts],
  )

  const run = useCallback(
    async (raw: string) => {
      // ── vim sub-mode ──
      if (mode === 'vim') {
        const cmd = raw.trim()
        append(cmd, [])
        if ([':q', ':q!', ':wq', ':wq!', 'ZZ'].includes(cmd)) {
          setMode('shell')
          append(null, ['left vim. you made it out alive.'])
        } else {
          append(null, [`E37: no write since last change — type :q! to quit`])
        }
        return
      }

      // ── shell mode ──
      const trimmed = raw.trim()
      if (!trimmed) {
        append(promptStr, [])
        return
      }

      const next = [...historyRef.current, trimmed].slice(-100)
      historyRef.current = next
      setHistory(next)
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
      } catch {
        /* ignore */
      }

      const [name, ...args] = trimmed.split(/\s+/)
      const key = ALIASES[name] ?? name
      const cmd = COMMANDS[key]
      const echo = promptStr + raw

      if (!cmd) {
        append(echo, [`psh: command not found: ${name}`, "type 'help' for a list of commands."])
        return
      }

      const ctx: ShellCtx = { host, appVersion, buildEnv, content, presence, history: historyRef.current }
      const maybe = cmd.run(args, ctx)

      if (maybe instanceof Promise) {
        const id = append(echo, ['…'], true)
        const result = await maybe
        if (isControl(result)) {
          patch(id, [])
          handleControl(result)
        } else {
          patch(id, toLines(result))
        }
        return
      }

      if (isControl(maybe)) {
        append(echo, [])
        handleControl(maybe)
      } else {
        append(echo, toLines(maybe))
      }
    },
    [mode, promptStr, host, content, presence, append, patch, handleControl],
  )

  const prompt = useMemo(() => (mode === 'vim' ? '' : promptStr), [mode, promptStr])

  return { entries, prompt, history, run }
}
