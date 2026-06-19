import { useCallback, useState } from 'react'

export interface Layer {
  id: string
  label: string
}

const ROOT: Layer = { id: 'home', label: 'home' }

/**
 * Tracks the k9s-style navigation layer stack. The bottom layer is always
 * <home>; drilling into a section pushes a layer, and `pop` removes the
 * top-most layer (never the root).
 */
export function useNavStack() {
  const [stack, setStack] = useState<Layer[]>([ROOT])

  const push = useCallback((layer: Layer) => {
    setStack((s) => [...s, layer])
  }, [])

  /** Pop the top-most layer, unless only the root remains. */
  const pop = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  }, [])

  /** Jump straight to a layer from anywhere (resets to <home> + that layer). */
  const goTo = useCallback((layer: Layer) => {
    setStack([ROOT, layer])
  }, [])

  const current = stack[stack.length - 1]
  const atRoot = stack.length === 1

  return { stack, current, atRoot, push, pop, goTo }
}
