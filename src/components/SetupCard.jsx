import { useState, useEffect } from 'react'
import { INITIAL_ITEMS, computeSpinUpStats } from '../lib/spinupData'
import { getSetupItems } from '../lib/supabase'

const STORAGE_KEY = '225-spinup-v1'

export default function SetupCard({ onNavigate }) {
  const [stats, setStats] = useState(null)

  // Try Supabase first (so card is accurate on any device), fall back to
  // localStorage (fast local cache written by SpinUp on every change).
  useEffect(() => {
    async function load() {
      try {
        const dbItems = await getSetupItems()
        if (dbItems && dbItems.length > 0) {
          setStats(computeSpinUpStats(dbItems))
          return
        }
      } catch {}
      // Fall back to localStorage
      try {
        const s = localStorage.getItem(STORAGE_KEY)
        const items = s ? JSON.parse(s) : INITIAL_ITEMS
        setStats(computeSpinUpStats(items))
      } catch {
        setStats(computeSpinUpStats(INITIAL_ITEMS))
      }
    }
    load()
  }, [])

  if (!stats) return null

  const barColor = stats.pct === 100 ? 'var(--green)' : 'var(--accent)'

  return (
    <button
      onClick={onNavigate}
      style={{
        width: '100%',
        padding: '16px 18px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg2)',
        border: '0.5px solid var(--border)',
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
          marginBottom: 8,
        }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)', letterSpacing: '0.01em' }}>
            Launch readiness
          </span>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            {stats.pct}%
          </span>
        </div>

        {/* Progress bar — taller for visual weight */}
        <div style={{
          height: 5,
          borderRadius: 3,
          background: 'var(--border)',
          overflow: 'hidden',
          marginBottom: 8,
        }}>
          <div style={{
            height: '100%',
            width: stats.pct + '%',
            background: barColor,
            borderRadius: 3,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* Subtext row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            {stats.done} of {stats.total} complete · {stats.remaining} remaining
          </span>
          {stats.photoTasksRemaining > 0 && (
            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 500 }}>
              {stats.photoTasksRemaining} photos needed
            </span>
          )}
        </div>

      </div>

      {/* Chevron */}
      <span style={{ color: 'var(--text3)', fontSize: 14, flexShrink: 0 }}>→</span>
    </button>
  )
}
