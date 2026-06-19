import { BootSplash } from '@/boot/BootSplash'
import { CrtMonitor } from '@/tui/CrtMonitor'
import { Tui } from '@/tui/Tui'
import { useBootState } from '@/state/useBootState'

export default function App() {
  const { phase, skip } = useBootState()

  return (
    <CrtMonitor>
      {phase === 'BOOTING' && <BootSplash onSkip={skip} />}
      {phase === 'BUILDING_TUI' && <Tui building />}
      {phase === 'READY' && <Tui />}
    </CrtMonitor>
  )
}
