import { useState } from 'react'
import type { LogEntry, ScanResult } from '../types'

interface Props {
  removedCount: number
  freedBytes: number
  onReset: () => void
  log: LogEntry[]
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const VERIFY_CATEGORIES = new Set(['Core', 'Bundled', 'Piriform', 'Telemetry'])

export default function CompleteScreen({ removedCount, freedBytes, onReset, log }: Props) {
  const [exportStatus, setExportStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'scanning' | 'clean' | 'found'>('idle')
  const [stillDetected, setStillDetected] = useState<ScanResult[]>([])

  async function handleExportLog() {
    const lines: string[] = [
      'CCleanKILLER — Removal Log',
      `Generated: ${new Date().toLocaleString()}`,
      '='.repeat(50),
      ''
    ]
    for (const entry of log) {
      lines.push(`[${entry.action.toUpperCase()}] ${entry.target}: ${entry.message}`)
    }
    const content = lines.join('\n')
    try {
      const result = await window.api.exportLog(content)
      setExportStatus(result.ok ? 'saved' : 'error')
    } catch {
      setExportStatus('error')
    }
    setTimeout(() => setExportStatus('idle'), 3000)
  }

  async function handleVerifyClean() {
    setVerifyStatus('scanning')
    setStillDetected([])
    try {
      const result = await window.api.scan()
      if (!result.ok || !result.results) {
        setVerifyStatus('idle')
        return
      }
      const remnants = (result.results as ScanResult[]).filter(
        (r) => VERIFY_CATEGORIES.has(r.Category) && r.IsDetected
      )
      setStillDetected(remnants)
      setVerifyStatus(remnants.length === 0 ? 'clean' : 'found')
    } catch {
      setVerifyStatus('idle')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 screen-enter">
      {/* Checkmark */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)',
          border: '1px solid rgba(34,197,94,0.25)',
          boxShadow: '0 0 40px rgba(34,197,94,0.1)'
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path
            d="M8 18L15 25L28 11"
            stroke="url(#cg)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="cg" x1="8" y1="18" x2="28" y2="18">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Headline */}
      <div className="text-center">
        <h2 className="text-3xl font-black tracking-tight text-text-primary mb-2">Done.</h2>
        <p className="text-text-secondary text-sm">Bloatware removed. Your system is cleaner.</p>
      </div>

      {/* Stats */}
      <div className="flex items-stretch gap-px rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-8 py-4 text-center" style={{ background: '#141414' }}>
          <p className="text-2xl font-black text-gradient">{removedCount}</p>
          <p className="text-text-muted text-xs mt-0.5 font-medium">Items Removed</p>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)' }} />
        <div className="px-8 py-4 text-center" style={{ background: '#141414' }}>
          <p className="text-2xl font-black text-gradient">{formatBytes(freedBytes)}</p>
          <p className="text-text-muted text-xs mt-0.5 font-medium">Space Freed</p>
        </div>
      </div>

      {/* CTA row */}
      <div className="flex gap-3 mt-2 flex-wrap justify-center">
        <button className="btn-ghost" onClick={onReset}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 7A5 5 0 1 1 7 2M7 2l3 0M7 2l0 3" />
          </svg>
          Scan Again
        </button>

        {/* Export Log button */}
        <button
          className="btn-ghost"
          onClick={handleExportLog}
          disabled={exportStatus === 'saved'}
        >
          {exportStatus === 'saved' ? (
            <>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 7l4 4 6-6" />
              </svg>
              <span style={{ color: '#22c55e' }}>Saved!</span>
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 2v7M4 6l3 3 3-3M2 10v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1" />
              </svg>
              Export Log
            </>
          )}
        </button>

        {/* Verify Clean button */}
        <button
          className="btn-ghost"
          onClick={handleVerifyClean}
          disabled={verifyStatus === 'scanning'}
        >
          {verifyStatus === 'scanning' ? (
            <>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="7" cy="7" r="5" strokeDasharray="8 8" />
              </svg>
              Scanning…
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="4" />
                <path d="M9 9l3 3" />
              </svg>
              Verify Clean
            </>
          )}
        </button>

        <button className="btn-primary" onClick={() => window.api.close()}>
          Close
        </button>
      </div>

      {/* Verify result inline */}
      {verifyStatus === 'clean' && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
            color: '#22c55e'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 7l4 4 6-6" />
          </svg>
          System is clean — no CCleaner remnants detected
        </div>
      )}

      {verifyStatus === 'found' && (
        <div
          className="flex flex-col gap-2 px-4 py-3 rounded-xl text-sm"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            maxWidth: '360px',
            width: '100%'
          }}
        >
          <div className="flex items-center gap-2 font-medium" style={{ color: '#ef4444' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 2L12 11H2L7 2z" />
              <path d="M7 6v2.5M7 10h.01" />
            </svg>
            Remnants still detected
          </div>
          <ul className="pl-4 space-y-0.5" style={{ color: '#f87171' }}>
            {stillDetected.map((r) => (
              <li key={r.Id} className="text-xs">• {r.Name}</li>
            ))}
          </ul>
          <button
            className="btn-ghost mt-1 self-start"
            style={{ fontSize: '12px', padding: '4px 10px' }}
            onClick={onReset}
          >
            Remove Again
          </button>
        </div>
      )}
    </div>
  )
}
