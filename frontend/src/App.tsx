import { useEffect } from 'react'
import { BootSplash } from '@/boot/BootSplash'
import { CrtMonitor } from '@/tui/CrtMonitor'
import { Tui } from '@/tui/Tui'
import { useBootState } from '@/state/useBootState'
import { beaconVisit } from '@/api/stats'

export default function App() {
  const { phase, skip } = useBootState()

  // Count this page load (fire-and-forget; deduped per load).
  useEffect(() => {
    beaconVisit()
  }, [])

  return (
    <CrtMonitor>
      {phase === 'BOOTING' && <BootSplash onSkip={skip} />}
      {phase === 'BUILDING_TUI' && <Tui building />}
      {phase === 'READY' && <Tui />}
    </CrtMonitor>
  )
}
