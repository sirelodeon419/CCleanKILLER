import { useState } from 'react'
import type { ScanResult } from '../types'

interface Props {
  result: ScanResult
  selected: boolean
  onToggle: (id: string) => void
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return ''
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function DetectionCard({ result, selected, onToggle }: Props) {
  const [expanded, setExpanded] = useState(false)

  const handleClick = () => {
    if (!result.DetectOnly) onToggle(result.Id)
  }

  const hasDetails =
    result.FoundPaths.length > 0 ||
    result.FoundRegistryKeys.length > 0 ||
    result.FoundServices.length > 0 ||
    result.FoundScheduledTasks.length > 0 ||
    result.FoundStartupEntries.length > 0

  return (
    <div
      className={`detection-card ${selected ? 'selected' : ''} ${result.DetectOnly ? 'detect-only' : ''}`}
      onClick={handleClick}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        {!result.DetectOnly && (
          <div className={`custom-checkbox mt-0.5 ${selected ? 'checked' : ''}`}>
            {selected && (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 5L4.5 7.5L8.5 2.5" />
              </svg>
            )}
          </div>
        )}
        {result.DetectOnly && (
          <div className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-md flex items-center justify-center border border-blue-500/30 bg-blue-500/10">
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#60a5fa" strokeWidth="1.8">
              <path d="M6 1v6M6 9.5v1" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* Name + category */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary leading-tight">{result.Name}</span>
            <span className={`pill-${result.Category}`}>{result.Category}</span>
          </div>
          {result.Note && (
            <p className="text-xs text-blue-400/80 mt-1 leading-snug">{result.Note}</p>
          )}
        </div>

        {/* Size */}
        {result.TotalSizeBytes > 0 && (
          <span className="text-xs font-mono text-text-muted flex-shrink-0 mt-0.5">
            {formatBytes(result.TotalSizeBytes)}
          </span>
        )}
      </div>

      {/* Artifact badges */}
      {(result.FoundPaths.length > 0 || result.FoundRegistryKeys.length > 0 || result.FoundServices.length > 0 || result.FoundScheduledTasks.length > 0 || result.FoundStartupEntries.length > 0 || result.FoundUninstallEntries.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {result.FoundPaths.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-mono"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#666', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="opacity-60">📁</span> {result.FoundPaths.length}
            </span>
          )}
          {result.FoundRegistryKeys.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-mono"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#666', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="opacity-60">🔑</span> {result.FoundRegistryKeys.length}
            </span>
          )}
          {result.FoundServices.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-mono"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#666', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="opacity-60">⚙️</span> {result.FoundServices.length}
            </span>
          )}
          {result.FoundScheduledTasks.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-mono"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#666', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="opacity-60">⏱</span> {result.FoundScheduledTasks.length}
            </span>
          )}
          {result.FoundStartupEntries.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-mono"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#666', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="opacity-60">🚀</span> startup
            </span>
          )}
          {result.FoundUninstallEntries.length > 0 && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-mono"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#666', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="opacity-60">🗑</span> uninstaller
            </span>
          )}
        </div>
      )}

      {/* Expand toggle */}
      {hasDetails && (
        <>
          <button
            className="flex items-center gap-1.5 mt-3 text-xs text-text-muted hover:text-text-secondary transition-colors duration-150"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded((v) => !v)
            }}
          >
            <svg
              width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <path d="M2 4L6 8L10 4" />
            </svg>
            {expanded ? 'Hide details' : 'Show details'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {result.FoundPaths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Paths</p>
                  <ul className="space-y-1">
                    {result.FoundPaths.map((p, i) => (
                      <li key={i} className="text-xs font-mono text-text-secondary break-all leading-relaxed">{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.FoundRegistryKeys.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Registry</p>
                  <ul className="space-y-1">
                    {result.FoundRegistryKeys.map((k, i) => (
                      <li key={i} className="text-xs font-mono text-text-secondary break-all leading-relaxed">{k}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.FoundServices.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Services</p>
                  <ul className="space-y-1">
                    {result.FoundServices.map((s, i) => (
                      <li key={i} className="text-xs font-mono text-text-secondary">{s.DisplayName || s.Name} <span className="text-text-muted">({s.Status})</span></li>
                    ))}
                  </ul>
                </div>
              )}
              {result.FoundScheduledTasks.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Scheduled Tasks</p>
                  <ul className="space-y-1">
                    {result.FoundScheduledTasks.map((t, i) => (
                      <li key={i} className="text-xs font-mono text-text-secondary">{t.Name} <span className="text-text-muted">({t.State})</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
