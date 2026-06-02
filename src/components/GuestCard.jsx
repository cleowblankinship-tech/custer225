import { useState, useEffect, useMemo } from 'react'

// ── Palette — one color per booking slot (cycles if > 6 in a year) ────────────
const BOOKING_COLORS = [
  { bar: '#C05538', text: '#fff' },  // terracotta
  { bar: '#185FA5', text: '#fff' },  // blue
  { bar: '#3B6D11', text: '#fff' },  // green
  { bar: '#A0720A', text: '#fff' },  // gold
  { bar: '#7B3FA0', text: '#fff' },  // purple
  { bar: '#1A7A78', text: '#fff' },  // teal
]

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']
const DAY_LABELS  = ['Su','Mo','Tu','We','Th','Fr','Sa']

// ── Date helpers ──────────────────────────────────────────────────────────────

// Returns YYYY-MM-DD string in Mountain Time for an ISO date string
function toMTDateStr(iso) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
}

// Returns a plain Date at midnight local for a YYYY-MM-DD string
function ymd(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmt(iso) {
  const d = ymd(toMTDateStr(iso))
  return `${MONTH_NAMES[d.getMonth()].slice(0,3)} ${d.getDate()}`
}

// ── Booking → color assignment (stable across renders) ────────────────────────
function assignColors(bookings) {
  const map = {}
  bookings.forEach((b, i) => {
    map[b.checkIn] = BOOKING_COLORS[i % BOOKING_COLORS.length]
  })
  return map
}

// ── Match a booking to an income entry by date overlap ────────────────────────
function matchRevenue(booking, incomeEntries) {
  const ci = toMTDateStr(booking.checkIn)
  const co = toMTDateStr(booking.checkOut)
  const match = incomeEntries.find(e => e.date >= ci && e.date <= co)
  return match ? Number(match.amount) : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function GuestCard({ expenses = [] }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Displayed month (defaults to current)
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-based

  useEffect(() => {
    fetch('/api/calendar')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const incomeEntries = useMemo(
    () => expenses.filter(e => e.entry_type === 'income'),
    [expenses]
  )

  const colorMap = useMemo(
    () => data?.all ? assignColors(data.all) : {},
    [data]
  )

  // Bookings that overlap the displayed month
  const monthStart = useMemo(() => new Date(viewYear, viewMonth, 1),      [viewYear, viewMonth])
  const monthEnd   = useMemo(() => new Date(viewYear, viewMonth + 1, 0),  [viewYear, viewMonth])

  const visibleBookings = useMemo(() => {
    if (!data?.all) return []
    return data.all.filter(b => {
      const ci = ymd(toMTDateStr(b.checkIn))
      const co = ymd(toMTDateStr(b.checkOut))
      return ci <= monthEnd && co > monthStart
    })
  }, [data, monthStart, monthEnd])

  // Build a day-map: "YYYY-MM-DD" → { booking, isFirst, isLast, color }
  const dayMap = useMemo(() => {
    const map = {}
    if (!data?.all) return map
    for (const b of data.all) {
      const color   = colorMap[b.checkIn] ?? BOOKING_COLORS[0]
      const ciStr   = toMTDateStr(b.checkIn)
      const coStr   = toMTDateStr(b.checkOut)
      const ci      = ymd(ciStr)
      const co      = ymd(coStr)           // checkout day — guest leaves, don't color
      // color from checkIn up to (but not including) checkOut
      const cursor = new Date(ci)
      while (cursor < co) {
        const key = cursor.toLocaleDateString('en-CA')
        map[key] = {
          booking:  b,
          isFirst:  key === ciStr,
          isLast:   cursor.getTime() === new Date(co - 86400000).getTime(),
          color,
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    return map
  }, [data, colorMap])

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstWeekDay = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
  const todayStr     = today.toLocaleDateString('en-CA')

  return (
    <div style={{ padding: '0 20px 4px' }}>
      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>

        {/* ── Month header ──────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 10px',
        }}>
          <button onClick={prevMonth} style={{ fontSize: 18, color: 'var(--text2)', padding: '0 6px' }}>‹</button>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </p>
          <button onClick={nextMonth} style={{ fontSize: 18, color: 'var(--text2)', padding: '0 6px' }}>›</button>
        </div>

        {/* ── Day-of-week labels ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px' }}>
          {DAY_LABELS.map(l => (
            <div key={l} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600,
              color: 'var(--text3)', letterSpacing: '0.04em', paddingBottom: 6 }}>
              {l}
            </div>
          ))}
        </div>

        {/* ── Calendar grid ─────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
            Loading bookings…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 8px 8px', rowGap: 2 }}>
            {/* Empty cells before first day */}
            {Array.from({ length: firstWeekDay }).map((_, i) => (
              <div key={`e${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day    = i + 1
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const info    = dayMap[dateStr]
              const isToday = dateStr === todayStr

              return (
                <div key={day} style={{ position: 'relative', height: 36 }}>
                  {/* Booking bar background */}
                  {info && (
                    <div style={{
                      position:    'absolute',
                      top:         '50%',
                      transform:   'translateY(-50%)',
                      height:      26,
                      left:        info.isFirst ? '10%' : 0,
                      right:       info.isLast  ? '10%' : 0,
                      background:  info.color.bar,
                      borderRadius: info.isFirst && info.isLast ? 13
                                  : info.isFirst ? '13px 0 0 13px'
                                  : info.isLast  ? '0 13px 13px 0'
                                  : 0,
                      opacity: 0.90,
                    }} />
                  )}

                  {/* Day number */}
                  <div style={{
                    position:   'absolute',
                    inset:      0,
                    display:    'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize:   12,
                    fontWeight: isToday ? 700 : info ? 600 : 400,
                    color:      info ? info.color.text
                                     : isToday ? 'var(--accent)'
                                     : 'var(--text)',
                    zIndex:     1,
                  }}>
                    {day}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Booking list for visible month ────────────────────────────── */}
        {!loading && visibleBookings.length > 0 && (
          <div style={{ borderTop: '0.5px solid var(--border)' }}>
            {visibleBookings.map((b, i) => {
              const color   = colorMap[b.checkIn] ?? BOOKING_COLORS[0]
              const revenue = matchRevenue(b, incomeEntries)
              return (
                <div key={b.checkIn} style={{
                  display:     'flex',
                  alignItems:  'center',
                  gap:         12,
                  padding:     '12px 16px',
                  borderBottom: i < visibleBookings.length - 1 ? '0.5px solid var(--border)' : 'none',
                }}>
                  {/* Color swatch */}
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color.bar, flexShrink: 0 }} />

                  {/* Name + dates */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                      {fmt(b.checkIn)} – {fmt(b.checkOut)} · {b.nights} night{b.nights !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Revenue */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {revenue !== null ? (
                      <>
                        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>
                          ${revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
                          ${Math.round(revenue / b.nights)}/night
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--text3)' }}>—</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && visibleBookings.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', borderTop: '0.5px solid var(--border)' }}>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>No bookings this month</p>
          </div>
        )}
      </div>
    </div>
  )
}
