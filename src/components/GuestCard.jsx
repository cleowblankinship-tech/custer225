import { useState, useEffect } from 'react'

// ── Date helpers ──────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

function daysUntil(iso) {
  if (!iso) return null
  const diff = new Date(iso) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function daysUntilLabel(iso) {
  const d = daysUntil(iso)
  if (d === null) return ''
  if (d === 0)  return 'today'
  if (d === 1)  return 'tomorrow'
  return `in ${d} days`
}

// ── GuestCard ─────────────────────────────────────────────────────────────────

export default function GuestCard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    fetch('/api/calendar')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return <GuestCardShell><p style={{ fontSize: 13, color: 'var(--text3)' }}>Loading bookings…</p></GuestCardShell>
  if (error)   return null   // fail silently — don't clutter home with an error card

  const { current, next, monthCount } = data

  return (
    <GuestCardShell>
      {/* ── Currently occupied ── */}
      {current ? (
        <div style={{ marginBottom: next ? 14 : 0 }}>
          <Row
            dot="var(--green)"
            label="Guests in house"
            main={current.firstName}
            sub={`checks out ${fmt(current.checkOut)} · ${current.nights} night${current.nights !== 1 ? 's' : ''}`}
          />
        </div>
      ) : (
        <div style={{ marginBottom: next ? 14 : 0 }}>
          <Row
            dot="var(--text3)"
            label="Currently"
            main="Vacant"
            sub={next ? `next arrival ${daysUntilLabel(next.checkIn)}` : 'no upcoming bookings'}
          />
        </div>
      )}

      {/* ── Next booking ── */}
      {next && (
        <div style={{
          borderTop: '0.5px solid var(--border)',
          paddingTop: 12,
          marginBottom: monthCount > 0 ? 14 : 0,
        }}>
          <Row
            dot="var(--accent)"
            label={`Next arrival · ${daysUntilLabel(next.checkIn)}`}
            main={next.firstName}
            sub={`${fmt(next.checkIn)} – ${fmt(next.checkOut)} · ${next.nights} night${next.nights !== 1 ? 's' : ''}`}
          />
        </div>
      )}

      {/* ── Monthly count ── */}
      {monthCount > 0 && (
        <div style={{
          borderTop: '0.5px solid var(--border)',
          paddingTop: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>
            {new Date().toLocaleString('default', { month: 'long' })} bookings
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>
            {monthCount}
          </p>
        </div>
      )}
    </GuestCardShell>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GuestCardShell({ children }) {
  return (
    <div style={{ padding: '0 20px 4px' }}>
      <div style={{
        background:   'var(--bg2)',
        borderRadius: 'var(--radius)',
        padding:      '14px 16px',
      }}>
        <p style={{
          fontSize:      10,
          fontWeight:    600,
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          color:         'var(--text3)',
          marginBottom:  12,
        }}>
          The House
        </p>
        {children}
      </div>
    </div>
  )
}

function Row({ dot, label, main, sub }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      {/* Status dot */}
      <div style={{
        width:        8,
        height:       8,
        borderRadius: '50%',
        background:   dot,
        marginTop:    5,
        flexShrink:   0,
      }} />
      <div>
        <p style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, letterSpacing: '0.04em', marginBottom: 2 }}>
          {label.toUpperCase()}
        </p>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
          {main}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
          {sub}
        </p>
      </div>
    </div>
  )
}
