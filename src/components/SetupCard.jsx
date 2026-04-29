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

  function readinessLine(pct) {
    if (pct === 100) return 'Ready to launch'
    if (pct >= 90)  return 'Final stretch'
    if (pct >= 75)  return 'Almost there'
    if (pct >= 50)  return 'More than halfway'
    if (pct >= 25)  return 'Making progress'
    return 'Just getting started'
  }

  return (
    <button
      onClick={onNavigate}
      style={{
        width: '100%',
        padding: '18px 20px 16px',
        borderRadius: 'var(--radius-sm)',
        background: complete ? 'var(--green)' : 'var(--text)',
        textAlign: 'left',
      }}
    >
      {/* Label + chevron */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
          Launch readiness
        </span>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>→</span>
      </div>

      {/* Big % + personality */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 48, fontWeight: 700, lineHeight: 1, color: '#fff', letterSpacing: '-0.03em' }}>
          {stats.pct}%
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontStyle: 'italic' }}>
          {readinessLine(stats.pct)}
        </p>
      </div>

      {/* Thick progress bar with accent gradient */}
      <div style={{
        height: 8,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.12)',
        overflow: 'hidden',
        marginBottom: 10,
      }}>
        <div style={{
          height: '100%',
          width: stats.pct + '%',
          background: complete
            ? 'rgba(255,255,255,0.9)'
            : 'linear-gradient(to right, #E07050, #C05538)',
          borderRadius: 3,
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
            {stats.done} / {stats.total} complete
          </span>
          {stats.remaining > 0 && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>
              {stats.remaining} remaining
            </span>
          )}
        </div>
        {stats.photoTasksRemaining > 0 && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
            📷 {stats.photoTasksRemaining}
          </span>
        )}
      </div>
    </button>
  )
}
