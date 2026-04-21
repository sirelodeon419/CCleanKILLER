import { useState, useMemo } from 'react'
import DetectionCard from './DetectionCard'
import { formatBytes } from '../lib/format'
import type { ScanResult, FilterCategory } from '../types'

interface Props {
  results: ScanResult[]
  onRemove: (targets: string[]) => void
  onReset: () => void
}

const CATEGORIES: { key: FilterCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Core', label: 'Core' },
  { key: 'Bundled', label: 'Bundled' },
  { key: 'Piriform', label: 'Piriform' },
  { key: 'PUP', label: 'PUPs' },
  { key: 'Offer', label: 'Offers' },
  { key: 'Telemetry', label: 'Telemetry' }
]

export default function ResultsScreen({ results, onRemove, onReset }: Props) {
  const detected = useMemo(() => results.filter((r) => r.IsDetected), [results])
  const [filter, setFilter] = useState<FilterCategory>('all')
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(detected.filter((r) => !r.DetectOnly).map((r) => r.Id))
  )

  const filtered = useMemo(
    () => (filter === 'all' ? detected : detected.filter((r) => r.Category === filter)),
    [detected, filter]
  )

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    detected.forEach((r) => {
      counts[r.Category] = (counts[r.Category] || 0) + 1
    })
    return counts
  }, [detected])

  const totalSize = useMemo(
    () => detected.reduce((sum, r) => sum + (r.TotalSizeBytes || 0), 0),
    [detected]
  )

  const toggleCard = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () =>
    setSelected(new Set(detected.filter((r) => !r.DetectOnly).map((r) => r.Id)))
  const deselectAll = () => setSelected(new Set())

  if (detected.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 screen-enter">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            stroke="#4ade80"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 14L11 20L23 8" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-text-primary mb-1">System is Clean</h2>
          <p className="text-text-secondary text-sm">No CCleaner or related bloatware detected.</p>
        </div>
        <button className="btn-ghost mt-2" onClick={onReset}>
          Scan Again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full screen-enter">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 pt-3 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div>
          <h2 className="text-base font-bold text-text-primary">
            Found <span className="text-gradient">{detected.length}</span> items
          </h2>
          <p className="text-text-muted text-xs mt-0.5">
            {formatBytes(totalSize)} total bloatware detected
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost text-xs py-1.5 px-3" onClick={onReset}>
            <svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M12 7A5 5 0 1 1 7 2M7 2l3 0M7 2l0 3" />
            </svg>
            Rescan
          </button>
          <button
            className="btn-primary text-xs py-1.5 px-4 rounded-xl"
            disabled={selected.size === 0}
            onClick={() => onRemove(Array.from(selected))}
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                clipRule="evenodd"
              />
            </svg>
            Remove {selected.size > 0 && `(${selected.size})`}
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div
        className="flex items-center gap-1 px-5 py-2 overflow-x-auto flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        {CATEGORIES.map(({ key, label }) => {
          const count = key === 'all' ? detected.length : categoryCounts[key] || 0
          if (key !== 'all' && count === 0) return null
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 flex-shrink-0 ${
                filter === key
                  ? 'text-text-primary bg-white/8'
                  : 'text-text-muted hover:text-text-secondary hover:bg-white/4'
              }`}
              style={filter === key ? { background: 'rgba(255,255,255,0.08)' } : {}}
            >
              {label}
              <span
                className="text-xs px-1.5 py-0.5 rounded-full"
                style={{
                  background: filter === key ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  color: filter === key ? '#aaa' : '#555'
                }}
              >
                {count}
              </span>
            </button>
          )
        })}

        <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
          <button
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            onClick={selectAll}
          >
            Select all
          </button>
          <span className="text-text-muted/30">·</span>
          <button
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            onClick={deselectAll}
          >
            None
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div
          className="grid grid-cols-1 gap-2.5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}
        >
          {filtered.map((result) => (
            <DetectionCard
              key={result.Id}
              result={result}
              selected={selected.has(result.Id)}
              onToggle={toggleCard}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
