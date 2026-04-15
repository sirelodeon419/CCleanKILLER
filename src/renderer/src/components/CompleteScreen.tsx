interface Props {
  removedCount: number
  freedBytes: number
  onReset: () => void
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export default function CompleteScreen({ removedCount, freedBytes, onReset }: Props) {
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

      {/* CTA */}
      <div className="flex gap-3 mt-2">
        <button className="btn-ghost" onClick={onReset}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 7A5 5 0 1 1 7 2M7 2l3 0M7 2l0 3" />
          </svg>
          Scan Again
        </button>
        <button className="btn-primary" onClick={() => window.api.close()}>
          Close
        </button>
      </div>
    </div>
  )
}
