import { useState, useEffect } from 'react'
import { INITIAL_ITEMS, computeSpinUpStats } from '../lib/spinupData'

const STORAGE_KEY = '225-spinup-v1'

export default function SetupCard({ onNavigate }) {
  const [stats, setStats] = useState(null)

  // Re-reads localStorage every time the Home page mounts (i.e. each time
  // the user navigates back from the Setup tab), so data is always fresh.
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY)
      const items = s ? JSON.parse(s) : INITIAL_ITEMS
      setStats(computeSpinUpStats(items))
    } catch {
      setStats(computeSpinUpStats(INITIAL_ITEMS))
    }
  }, [])

  if (!stats) return null

  const barColor = stats.pct === 100 ? 'var(--green)' : 'var(--accent)'

  return (
    <button
      onClick={onNavigate}
      style={{
        width: '100%',
        padding: '13px 16px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg2)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
      }}
    >
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Title row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
            Launch readiness
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {stats.pct}%
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 3,
          borderRadius: 2,
          background: 'var(--border)',
          overflow: 'hidden',
          marginBottom: 6,
        }}>
          <div style={{
            height: '100%',
            width: stats.pct + '%',
            background: barColor,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Subtext row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            {stats.done} of {stats.total} complete · {stats.remaining} remaining
          </span>
          {stats.photoTasksRemaining > 0 && (
            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
              📷 {stats.photoTasksRemaining}
            </span>
          )}
        </div>

      </div>

      {/* Chevron */}
      <span style={{ color: 'var(--text3)', fontSize: 14, flexShrink: 0 }}>→</span>
    </button>
  )
}
