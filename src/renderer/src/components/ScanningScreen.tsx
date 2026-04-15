import { useEffect, useState, useRef } from 'react'
import type { ScanResult } from '../types'

interface Props {
  onComplete: (results: ScanResult[]) => void
}

const SCAN_STEPS = [
  'Checking installed programs...',
  'Scanning Program Files...',
  'Scanning AppData directories...',
  'Inspecting registry keys...',
  'Checking Windows services...',
  'Scanning scheduled tasks...',
  'Checking startup entries...',
  'Detecting telemetry traces...',
  'Calculating disk usage...',
  'Finalizing results...'
]

export default function ScanningScreen({ onComplete }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    // Register PS1 progress callback
    window.api.onScanProgress(({ step, index, total }) => {
      setStepIndex(Math.min(index, SCAN_STEPS.length - 1))
      setProgress(Math.round((index / total) * 90))
    })

    // Animate steps in parallel with real scan
    let uiStep = 0
    const interval = setInterval(() => {
      uiStep = Math.min(uiStep + 1, SCAN_STEPS.length - 1)
      setStepIndex(uiStep)
      setProgress(Math.round((uiStep / SCAN_STEPS.length) * 85))
    }, 500)

    window.api
      .scan()
      .then(({ ok, results, error: err }) => {
        clearInterval(interval)
        window.api.removeAllListeners('scan:progress')

        if (!ok || !results) {
          setError(err ?? 'Unknown scan error')
          return
        }

        setProgress(100)
        setStepIndex(SCAN_STEPS.length - 1)

        setTimeout(() => {
          onComplete(results as ScanResult[])
        }, 400)
      })
      .catch((err) => {
        clearInterval(interval)
        setError(String(err))
      })

    return () => {
      clearInterval(interval)
      window.api.removeAllListeners('scan:progress')
    }
  }, [onComplete])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 screen-enter">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
            <path d="M10 6v5M10 14h.01M3 10a7 7 0 1 0 14 0 7 7 0 0 0-14 0Z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-text-secondary text-sm font-medium mb-1">Scan failed</p>
          <p className="text-text-muted text-xs max-w-sm font-mono">{error}</p>
        </div>
        <p className="text-text-muted text-xs mt-2">Ensure the app is running as Administrator</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 screen-enter">
      {/* Scanner animation */}
      <div className="relative w-48 h-1 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #ff3333, #ff6633)'
          }}
        />
      </div>

      {/* Animated scan icon */}
      <div className="relative">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="24" stroke="rgba(255,51,51,0.15)" strokeWidth="1.5" />
          <circle
            cx="28"
            cy="28"
            r="24"
            stroke="url(#scanGrad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="40 110"
            style={{ animation: 'spin 1.2s linear infinite' }}
          />
          <path
            d="M20 28L25 33L36 22"
            stroke="rgba(255,51,51,0.25)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="scanGrad" x1="0" y1="0" x2="56" y2="56">
              <stop offset="0%" stopColor="#ff3333" />
              <stop offset="100%" stopColor="#ff6633" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="text-center">
        <p className="text-text-primary text-sm font-semibold mb-1">Scanning system...</p>
        <p className="text-text-muted text-xs font-mono transition-all duration-200 h-4">
          {SCAN_STEPS[stepIndex]}
        </p>
      </div>

      <p className="text-text-muted text-xs">{progress}%</p>
    </div>
  )
}
