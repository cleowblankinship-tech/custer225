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

  const complete = stats.pct === 100

  return (
    <button
      onClick={onNavigate}
      style={{
        width: '100%',
        padding: '14px 16px',
        borderRadius: 'var(--radius-sm)',
        background: complete ? 'var(--green)' : 'var(--text)',
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
          <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Launch readiness
          </span>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
            {stats.pct}%
          </span>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 3,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          overflow: 'hidden',
          marginBottom: 8,
        }}>
          <div style={{
            height: '100%',
            width: stats.pct + '%',
            background: 'rgba(255,255,255,0.85)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Subtext row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            {stats.done} of {stats.total} complete · {stats.remaining} remaining
          </span>
          {stats.photoTasksRemaining > 0 && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
              📷 {stats.photoTasksRemaining}
            </span>
          )}
        </div>

      </div>

      {/* Chevron */}
      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, flexShrink: 0 }}>→</span>
    </button>
  )
}
