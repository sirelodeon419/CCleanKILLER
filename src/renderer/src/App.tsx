import { useState, useCallback } from 'react'
import TitleBar from './components/TitleBar'
import ScanScreen from './components/ScanScreen'
import ScanningScreen from './components/ScanningScreen'
import ResultsScreen from './components/ResultsScreen'
import RemovalScreen from './components/RemovalScreen'
import CompleteScreen from './components/CompleteScreen'
import type { AppScreen, ScanResult, LogEntry } from './types'

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('scan')
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [removalTargets, setRemovalTargets] = useState<string[]>([])
  const [removalLog, setRemovalLog] = useState<LogEntry[]>([])
  const [removedCount, setRemovedCount] = useState(0)
  const [freedBytes, setFreedBytes] = useState(0)

  const handleScanComplete = useCallback((results: ScanResult[]) => {
    setScanResults(results)
    setScreen('results')
  }, [])

  const handleRemove = useCallback(
    (targets: string[]) => {
      setRemovalTargets(targets)
      setRemovalLog([])

      // Calculate bytes to be freed
      const bytes = scanResults
        .filter((r) => targets.includes(r.Id))
        .reduce((sum, r) => sum + (r.TotalSizeBytes || 0), 0)
      setFreedBytes(bytes)
      setRemovedCount(targets.length)

      setScreen('removing')
    },
    [scanResults]
  )

  const handleRemovalComplete = useCallback(() => {
    setScreen('complete')
  }, [])

  const handleReset = useCallback(() => {
    setScanResults([])
    setRemovalTargets([])
    setRemovalLog([])
    setRemovedCount(0)
    setFreedBytes(0)
    setScreen('scan')
  }, [])

  return (
    <div className="flex flex-col h-screen bg-bg-primary overflow-hidden">
      {/* Background glows */}
      <div className="glow-orb w-96 h-96 bg-red-600 -top-32 -right-32" />
      <div className="glow-orb w-64 h-64 bg-orange-600 bottom-0 -left-16" />

      {/* Title bar */}
      <TitleBar />

      {/* Main content */}
      <main className="flex-1 overflow-hidden relative">
        {screen === 'scan' && <ScanScreen onStart={() => setScreen('scanning')} />}
        {screen === 'scanning' && <ScanningScreen onComplete={handleScanComplete} />}
        {screen === 'results' && (
          <ResultsScreen results={scanResults} onRemove={handleRemove} onReset={handleReset} />
        )}
        {screen === 'removing' && (
          <RemovalScreen
            targets={removalTargets}
            log={removalLog}
            setLog={setRemovalLog}
            onComplete={handleRemovalComplete}
          />
        )}
        {screen === 'complete' && (
          <CompleteScreen
            removedCount={removedCount}
            freedBytes={freedBytes}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  )
}
