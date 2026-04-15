import { useEffect, useRef, useCallback } from 'react'
import type { LogEntry } from '../types'

interface Props {
  targets: string[]
  log: LogEntry[]
  setLog: React.Dispatch<React.SetStateAction<LogEntry[]>>
  onComplete: () => void
}

const ACTION_STYLES: Record<string, { icon: string; color: string }> = {
  start:             { icon: '◆', color: '#94a3b8' },
  service_stopped:   { icon: '⏹', color: '#fb923c' },
  service_removed:   { icon: '✓', color: '#4ade80' },
  process_killed:    { icon: '✕', color: '#f87171' },
  uninstall_attempt: { icon: '⟳', color: '#94a3b8' },
  uninstall_complete:{ icon: '✓', color: '#4ade80' },
  task_removed:      { icon: '✓', color: '#4ade80' },
  startup_removed:   { icon: '✓', color: '#4ade80' },
  path_removed:      { icon: '✓', color: '#4ade80' },
  registry_removed:  { icon: '✓', color: '#4ade80' },
  complete:          { icon: '✓', color: '#22c55e' },
  skip:              { icon: '→', color: '#555' },
  error:             { icon: '✕', color: '#f87171' },
  info:              { icon: '·', color: '#555' }
}

export default function RemovalScreen({ targets, log, setLog, onComplete }: Props) {
  const logRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  const scrollToBottom = useCallback(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [log, scrollToBottom])

  useEffect(() => {
    if (started.current) return
    started.current = true

    window.api.onRemovalLog((entry) => {
      setLog((prev) => [...prev, entry as LogEntry])
    })

    window.api.onRemovalComplete(() => {
      window.api.removeAllListeners('removal:log')
      window.api.removeAllListeners('removal:complete')
      setTimeout(onComplete, 800)
    })

    window.api.remove(targets).catch((err) => {
      setLog((prev) => [
        ...prev,
        { target: 'system', action: 'error', message: String(err) }
      ])
    })

    return () => {
      window.api.removeAllListeners('removal:log')
      window.api.removeAllListeners('removal:complete')
    }
  }, [targets, setLog, onComplete])

  return (
    <div className="flex flex-col h-full screen-enter">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div>
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #ff3333, #ff6633)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
            Removing bloatware...
          </h2>
          <p className="text-text-muted text-xs mt-0.5">{targets.length} item{targets.length !== 1 ? 's' : ''} queued for removal</p>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            stroke="rgba(255,51,51,0.6)" strokeWidth="1.5" strokeLinecap="round"
            style={{ animation: 'spin 1.5s linear infinite' }}>
            <path d="M7 2a5 5 0 1 0 4.33 2.5" />
          </svg>
          <span className="text-text-muted text-xs font-mono">live</span>
        </div>
      </div>

      {/* Log */}
      <div ref={logRef} className="flex-1 overflow-y-auto px-5 py-3 font-mono text-xs">
        {log.length === 0 && (
          <p className="text-text-muted text-xs">Initializing removal engine...</p>
        )}
        {log.map((entry, i) => {
          const style = ACTION_STYLES[entry.action] ?? ACTION_STYLES.info
          return (
            <div
              key={i}
              className="flex items-start gap-3 py-0.5 leading-5"
              style={{ animation: i === log.length - 1 ? 'fadeIn 0.15s ease-out' : 'none' }}
            >
              <span className="flex-shrink-0 w-3 text-center" style={{ color: style.color }}>
                {style.icon}
              </span>
              <span className="text-text-muted flex-shrink-0 opacity-50 text-[10px] pt-0.5 w-24 truncate">
                {entry.target}
              </span>
              <span style={{ color: entry.action === 'error' ? '#f87171' : entry.action === 'complete' ? '#4ade80' : '#666' }}>
                {entry.message}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress indicator */}
      <div className="px-5 py-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="progress-track">
          <div className="progress-fill progress-animated h-full" style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  )
}
