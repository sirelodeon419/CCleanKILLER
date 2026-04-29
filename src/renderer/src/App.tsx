import { useState, useCallback, useRef } from 'react'
import TitleBar from './components/TitleBar'
import ScanScreen from './components/ScanScreen'
import ScanningScreen from './components/ScanningScreen'
import ResultsScreen from './components/ResultsScreen'
import ConfirmScreen from './components/ConfirmScreen'
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
  const [backupPath, setBackupPath] = useState<string | null>(null)
  const backupPathRef = useRef<string | null>(null)

  const handleScanComplete = useCallback((results: ScanResult[]) => {
    setScanResults(results)
    setScreen('results')
  }, [])

  // Go to confirm screen instead of removing immediately
  const handleRemove = useCallback((targets: string[]) => {
    setRemovalTargets(targets)
    setScreen('confirm')
  }, [])

  // Called from ConfirmScreen — actually starts removal
  const handleConfirmRemove = useCallback(() => {
    setRemovalLog([])
    backupPathRef.current = null

    const bytes = scanResults
      .filter((r) => removalTargets.includes(r.Id))
      .reduce((sum, r) => sum + (r.TotalSizeBytes || 0), 0)
    setFreedBytes(bytes)
    setRemovedCount(removalTargets.length)

    setScreen('removing')
  }, [scanResults, removalTargets])

  // Intercepts setLog calls to capture backup_created entries
  const handleSetLog: React.Dispatch<React.SetStateAction<LogEntry[]>> = useCallback((updater) => {
    setRemovalLog((prev) => {
      const next = typeof updater === 'function' ? (updater as (p: LogEntry[]) => LogEntry[])(prev) : updater
      const last = next[next.length - 1]
      if (last?.action === 'backup_created' && last.message !== backupPathRef.current) {
        backupPathRef.current = last.message
      }
      return next
    })
  }, [])

  const handleRemovalComplete = useCallback(() => {
    setBackupPath(backupPathRef.current)
    setScreen('complete')
  }, [])

  const handleReset = useCallback(() => {
    setScanResults([])
    setRemovalTargets([])
    setRemovalLog([])
    setRemovedCount(0)
    setFreedBytes(0)
    setBackupPath(null)
    backupPathRef.current = null
    setScreen('scan')
  }, [])

  const confirmTargets = scanResults.filter((r) => removalTargets.includes(r.Id))

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
        {screen === 'confirm' && (
          <ConfirmScreen
            targets={confirmTargets}
            onConfirm={handleConfirmRemove}
            onBack={() => setScreen('results')}
          />
        )}
        {screen === 'removing' && (
          <RemovalScreen
            targets={removalTargets}
            log={removalLog}
            setLog={handleSetLog}
            onComplete={handleRemovalComplete}
          />
        )}
        {screen === 'complete' && (
          <CompleteScreen
            removedCount={removedCount}
            freedBytes={freedBytes}
            onReset={handleReset}
            log={removalLog}
            backupPath={backupPath}
          />
        )}
      </main>
    </div>
  )
}
