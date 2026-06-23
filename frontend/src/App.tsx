import { useEffect } from 'react'
import { BootSplash } from '@/boot/BootSplash'
import { CrtMonitor } from '@/tui/CrtMonitor'
import { Tui } from '@/tui/Tui'
import { useBootState } from '@/state/useBootState'
import { ContentProvider } from '@/state/ContentProvider'
import { PresenceProvider } from '@/state/PresenceProvider'
import { beaconVisit } from '@/api/stats'
import { consoleHint } from '@/lib/easterEgg'

export default function App() {
  const { phase, skip } = useBootState()

  useEffect(() => {
    beaconVisit()
    consoleHint()
  }, [])

  return (
    <ContentProvider>
      <PresenceProvider>
        <CrtMonitor>
          {phase === 'BOOTING' && <BootSplash onSkip={skip} />}
          {phase === 'BUILDING_TUI' && <Tui building />}
          {phase === 'READY' && <Tui />}
        </CrtMonitor>
      </PresenceProvider>
    </ContentProvider>
  )
}
