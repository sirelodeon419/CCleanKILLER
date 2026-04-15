interface Props {
  onStart: () => void
}

export default function ScanScreen({ onStart }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full pb-8 screen-enter">
      {/* Animated rings */}
      <div className="relative flex items-center justify-center mb-10">
        <div className="ring-3 absolute w-52 h-52 rounded-full border border-red-500/10" />
        <div className="ring-2 absolute w-40 h-40 rounded-full border border-red-500/15" />
        <div className="ring-1 absolute w-28 h-28 rounded-full border border-red-500/25" />

        {/* Center icon */}
        <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(255,51,51,0.15), rgba(255,102,51,0.15))', border: '1px solid rgba(255,51,51,0.2)' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="12" cy="12" r="8" stroke="url(#sg)" strokeWidth="1.75" />
            <path d="M18 18L24 24" stroke="url(#sg)" strokeWidth="1.75" strokeLinecap="round" />
            <defs>
              <linearGradient id="sg" x1="0" y1="0" x2="28" y2="28">
                <stop offset="0%" stopColor="#ff3333" />
                <stop offset="100%" stopColor="#ff6633" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-4xl font-black tracking-tight mb-3">
        <span className="text-text-primary">CClean</span>
        <span className="text-gradient">KILLER</span>
      </h1>
      <p className="text-text-secondary text-sm mb-2 font-medium">
        Complete removal of CCleaner, Piriform tools, Avast, AVG &amp; bundled bloatware
      </p>
      <p className="text-text-muted text-xs mb-10">
        Scans files, registry, services, scheduled tasks &amp; startup entries
      </p>

      {/* Scan button */}
      <button className="btn-primary text-base px-8 py-3.5 rounded-2xl" onClick={onStart}>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" />
        </svg>
        Scan System
      </button>

      {/* Footer note */}
      <p className="text-text-muted text-xs mt-8">
        Requires Administrator — changes are permanent
      </p>
    </div>
  )
}
