import { useEffect } from 'react'
import { BootSplash } from '@/boot/BootSplash'
import { CrtMonitor } from '@/tui/CrtMonitor'
import { Tui } from '@/tui/Tui'
import { useBootState } from '@/state/useBootState'
import { beaconVisit } from '@/api/stats'
import { consoleHint } from '@/lib/easterEgg'

export default function App() {
  const { phase, skip } = useBootState()

  // Count this page load (fire-and-forget; deduped per load) and drop the
  // console breadcrumb for the hidden `:sign` command.
  useEffect(() => {
    beaconVisit()
    consoleHint()
  }, [])

  return (
    <CrtMonitor>
      {phase === 'BOOTING' && <BootSplash onSkip={skip} />}
      {phase === 'BUILDING_TUI' && <Tui building />}
      {phase === 'READY' && <Tui />}
    </CrtMonitor>
  )
}
