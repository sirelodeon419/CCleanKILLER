export default function TitleBar() {
  return (
    <div
      className="flex items-center justify-between px-4 h-10 flex-shrink-0 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <svg
          width="18"
          height="18"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="20" cy="20" r="17" stroke="url(#tg)" strokeWidth="2.5" />
          <path d="M13 13L27 27M27 13L13 27" stroke="url(#tg)" strokeWidth="2.5" strokeLinecap="round" />
          <defs>
            <linearGradient id="tg" x1="0" y1="0" x2="40" y2="40">
              <stop offset="0%" stopColor="#ff3333" />
              <stop offset="100%" stopColor="#ff6633" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-xs font-semibold tracking-wider text-text-secondary uppercase">
          CClean<span className="text-gradient">KILLER</span>
        </span>
      </div>

      {/* Window controls */}
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Minimize */}
        <button
          onClick={() => window.api.minimize()}
          className="w-8 h-6 rounded flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-white/5 transition-all duration-150"
          title="Minimize"
        >
          <svg width="10" height="2" viewBox="0 0 10 2" fill="currentColor">
            <rect width="10" height="1.5" rx="0.75" />
          </svg>
        </button>

        {/* Close */}
        <button
          onClick={() => window.api.close()}
          className="w-8 h-6 rounded flex items-center justify-center text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1 1L9 9M9 1L1 9" />
          </svg>
        </button>
      </div>
    </div>
  )
}
