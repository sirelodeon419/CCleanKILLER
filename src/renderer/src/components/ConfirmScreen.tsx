import { useMemo } from 'react'
import type { ScanResult } from '../types'

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

interface Props {
  targets: ScanResult[]
  onConfirm: () => void
  onBack: () => void
}

export default function ConfirmScreen({ targets, onConfirm, onBack }: Props) {
  const stats = useMemo(() => {
    let files = 0, regKeys = 0, services = 0, tasks = 0, bytes = 0
    for (const t of targets) {
      files += t.FoundPaths.length
      regKeys += t.FoundRegistryKeys.length
      services += t.FoundServices.length
      tasks += t.FoundScheduledTasks.length
      bytes += t.TotalSizeBytes || 0
    }
    return { files, regKeys, services, tasks, bytes }
  }, [targets])

  return (
    <div className="flex flex-col h-full screen-enter">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 className="text-base font-bold text-text-primary">Confirm Removal</h2>
        <p className="text-text-muted text-xs mt-0.5">Review what will be deleted before proceeding</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Items', value: targets.length },
            { label: 'Files', value: stats.files },
            { label: 'Reg Keys', value: stats.regKeys },
            { label: 'Services', value: stats.services },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl px-3 py-3 text-center"
              style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <p className="text-lg font-black text-gradient">{value}</p>
              <p className="text-text-muted text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Warning banner */}
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <path d="M8 2L13.5 12H2.5L8 2z" />
            <path d="M8 7v2.5M8 11h.01" />
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#ef4444' }}>
              {formatBytes(stats.bytes)} will be permanently deleted
            </p>
            <p className="text-text-muted text-xs mt-1 leading-relaxed">
              Registry keys will be backed up to <code style={{ color: '#888' }}>%APPDATA%\CCleanKILLER\backups</code> before deletion.
              A Windows System Restore point will also be created automatically.
            </p>
          </div>
        </div>

        {/* Item list */}
        <div>
          <p className="text-text-muted text-xs font-medium mb-2 uppercase tracking-wider">Items queued for removal</p>
          <div className="flex flex-col gap-1.5">
            {targets.map((t) => (
              <div
                key={t.Id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl"
                style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />
                <span className="text-text-secondary text-sm font-medium flex-1 min-w-0 truncate">{t.Name}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#666' }}
                >
                  {t.Category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <button className="btn-ghost" onClick={onBack}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 3L5 7l4 4" />
          </svg>
          Back
        </button>
        <button
          className="btn-primary flex-1"
          style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', boxShadow: '0 0 20px rgba(220,38,38,0.3)' }}
          onClick={onConfirm}
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
          </svg>
          Remove {targets.length} {targets.length === 1 ? 'item' : 'items'}
        </button>
      </div>
    </div>
  )
}
