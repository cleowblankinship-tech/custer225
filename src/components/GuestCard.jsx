import { useState, useEffect, useMemo } from 'react'

const BOOKING_COLORS = [
  { bar: '#8C7B6E', text: '#fff' },  // warm stone
  { bar: '#7A8A7C', text: '#fff' },  // sage
  { bar: '#7B8FA1', text: '#fff' },  // slate
  { bar: '#A0907E', text: '#fff' },  // sand
  { bar: '#8A8070', text: '#fff' },  // greige
  { bar: '#6E7E8A', text: '#fff' },  // blue-grey
]

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']
const DAY_LABELS  = ['Su','Mo','Tu','We','Th','Fr','Sa']

function toMTDateStr(iso) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
}

function ymd(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function fmt(iso) {
  const d = ymd(toMTDateStr(iso))
  return `${MONTH_NAMES[d.getMonth()].slice(0,3)} ${d.getDate()}`
}

function fmtFull(iso) {
  const d = ymd(toMTDateStr(iso))
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  return `${days[d.getDay()]} ${MONTH_NAMES[d.getMonth()].slice(0,3)} ${d.getDate()}`
}

function assignColors(bookings) {
  const map = {}
  bookings.forEach((b, i) => { map[b.checkIn] = BOOKING_COLORS[i % BOOKING_COLORS.length] })
  return map
}

function matchRevenue(booking, incomeEntries) {
  const ci = toMTDateStr(booking.checkIn)
  const co = toMTDateStr(booking.checkOut)
  const match = incomeEntries.find(e => e.date >= ci && e.date <= co)
  return match ? Number(match.amount) : null
}

export default function GuestCard({ expenses = [], calendarData: propData }) {
  const [fetchedData, setFetchedData] = useState(null)
  const [loading,     setLoading]     = useState(!propData)
  // The booking whose name tooltip is shown; keyed by checkIn ISO
  const [activeBooking, setActiveBooking] = useState(null)

  const data = propData ?? fetchedData

  const today    = new Date()
  const todayStr = today.toLocaleDateString('en-CA')
  const todayMT  = today.toLocaleDateString('en-CA', { timeZone: 'America/Denver' })

  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  // Only fetch if App hasn't provided calendar data via props
  useEffect(() => {
    if (propData) { setLoading(false); return }
    fetch('/api/calendar')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setFetchedData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [propData])

  // When prop data arrives, clear loading
  useEffect(() => {
    if (propData) setLoading(false)
  }, [propData])

  const incomeEntries = useMemo(
    () => expenses.filter(e => e.entry_type === 'income'),
    [expenses]
  )

  const colorMap = useMemo(
    () => data?.all ? assignColors(data.all) : {},
    [data]
  )

  const monthStart = useMemo(() => new Date(viewYear, viewMonth, 1),     [viewYear, viewMonth])
  const monthEnd   = useMemo(() => new Date(viewYear, viewMonth + 1, 0), [viewYear, viewMonth])

  const visibleBookings = useMemo(() => {
    if (!data?.all) return []
    return data.all.filter(b => {
      const ci = ymd(toMTDateStr(b.checkIn))
      const co = ymd(toMTDateStr(b.checkOut))
      return ci <= monthEnd && co > monthStart
    })
  }, [data, monthStart, monthEnd])

  const dayMap = useMemo(() => {
    const map = {}
    if (!data?.all) return map
    for (const b of data.all) {
      const color = colorMap[b.checkIn] ?? BOOKING_COLORS[0]
      const ciStr = toMTDateStr(b.checkIn)
      const ci    = ymd(ciStr)
      const co    = ymd(toMTDateStr(b.checkOut))
      const cursor = new Date(ci)
      while (cursor < co) {
        const key = cursor.toLocaleDateString('en-CA')
        map[key] = {
          booking: b,
          isFirst: key === ciStr,
          isLast:  cursor.getTime() === new Date(co - 86400000).getTime(),
          color,
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    return map
  }, [data, colorMap])

  const monthStats = useMemo(() => {
    if (!data?.all) return null

    const nightsBooked = Object.keys(dayMap).filter(dateStr => {
      const [y, m] = dateStr.split('-').map(Number)
      return y === viewYear && (m - 1) === viewMonth
    }).length

    const daysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const occupancyPct    = Math.round((nightsBooked / daysInViewMonth) * 100)

    const sorted       = [...data.all].sort((a, b) => toMTDateStr(a.checkIn).localeCompare(toMTDateStr(b.checkIn)))
    const nextArrival  = sorted.find(b => toMTDateStr(b.checkIn) >= todayMT) ?? null
    const nextCheckout = [...data.all]
      .sort((a, b) => toMTDateStr(a.checkOut).localeCompare(toMTDateStr(b.checkOut)))
      .find(b => toMTDateStr(b.checkOut) > todayMT) ?? null

    const monthRevenue = visibleBookings.reduce((sum, b) => {
      const r = matchRevenue(b, incomeEntries)
      return sum + (r ?? 0)
    }, 0)

    return { nightsBooked, daysInViewMonth, occupancyPct, nextArrival, nextCheckout, monthRevenue }
  }, [data, dayMap, viewYear, viewMonth, visibleBookings, incomeEntries, todayMT])

  function prevMonth() {
    setActiveBooking(null)
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    setActiveBooking(null)
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function handleDayClick(info) {
    if (!info) return
    const key = info.booking.checkIn
    setActiveBooking(prev => prev === key ? null : key)
  }

  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstWeekDay = new Date(viewYear, viewMonth, 1).getDay()

  return (
    <div style={{ padding: '24px 24px 20px' }}>

      {/* ── Month nav ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <button onClick={prevMonth} style={{ fontSize: 20, color: 'var(--text3)', padding: '0 4px', lineHeight: 1 }}>‹</button>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </p>
        <button onClick={nextMonth} style={{ fontSize: 20, color: 'var(--text3)', padding: '0 4px', lineHeight: 1 }}>›</button>
      </div>

      {/* ── Day labels ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 2 }}>
        {DAY_LABELS.map(l => (
          <div key={l} style={{
            textAlign: 'center', fontSize: 10, fontWeight: 600,
            color: 'var(--text3)', letterSpacing: '0.08em', paddingBottom: 4,
          }}>
            {l}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ──────────────────────────────────────────────────── */}
      {loading && !data ? (
        <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
          Loading…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 1 }}>
          {Array.from({ length: firstWeekDay }).map((_, i) => <div key={`e${i}`} />)}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day     = i + 1
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const info    = dayMap[dateStr]
            const isToday = dateStr === todayStr
            const isActive = info && activeBooking === info.booking.checkIn

            return (
              <div
                key={day}
                style={{ position: 'relative', height: 38 }}
                onClick={() => handleDayClick(info)}
              >
                {info && (
                  <div style={{
                    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                    height: 26,
                    left:   info.isFirst ? '8%' : 0,
                    right:  info.isLast  ? '8%' : 0,
                    background: info.color.bar,
                    borderRadius: info.isFirst && info.isLast ? 13
                                : info.isFirst ? '13px 0 0 13px'
                                : info.isLast  ? '0 13px 13px 0' : 0,
                    opacity:    isActive ? 1 : 0.78,
                    cursor: 'pointer',
                    transition: 'opacity 120ms ease',
                  }} />
                )}
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize:   12,
                  fontWeight: isToday ? 800 : info ? 600 : 400,
                  color:      info    ? info.color.text
                            : isToday ? 'var(--accent)'
                            :           'var(--text2)',
                  zIndex: 1,
                  cursor: info ? 'pointer' : 'default',
                }}>
                  {day}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Selected booking — plain text row, colored accent ─────────────── */}
      {!loading && activeBooking && (() => {
        const b = data?.all?.find(b => b.checkIn === activeBooking)
        if (!b) return null
        const color = colorMap[b.checkIn] ?? BOOKING_COLORS[0]
        return (
          <div style={{
            marginTop: 12,
            paddingLeft: 10,
            borderLeft: `3px solid ${color.bar}`,
            display: 'flex', alignItems: 'baseline',
            justifyContent: 'space-between', gap: 8,
          }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{b.name}</span>
              <span style={{ color: 'var(--text3)', marginLeft: 8 }}>
                {fmt(b.checkIn)} – {fmt(b.checkOut)} · {b.nights} night{b.nights !== 1 ? 's' : ''}
              </span>
            </div>
            <button onClick={() => setActiveBooking(null)}
              style={{ fontSize: 14, color: 'var(--text3)', flexShrink: 0 }}>×</button>
          </div>
        )
      })()}

      {/* ── Stats — quiet text line ────────────────────────────────────────── */}
      {!loading && monthStats && (
        <div style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'baseline', gap: 20, flexWrap: 'wrap',
        }}>
          <div>
            <span style={{
              fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em',
              color: monthStats.occupancyPct >= 70 ? 'var(--green, #5A9A30)'
                   : monthStats.occupancyPct >= 40 ? 'var(--text)'
                   :                                 'var(--text3)',
            }}>
              {monthStats.occupancyPct}%
            </span>
            <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 4 }}>occ.</span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
            {monthStats.nightsBooked} / {monthStats.daysInViewMonth} nights
          </div>

          {monthStats.monthRevenue > 0 && (
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>
              ${monthStats.monthRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </div>
          )}

          {(monthStats.nextArrival || monthStats.nextCheckout) && (
            <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: 11, color: 'var(--text3)', lineHeight: 1.7 }}>
              {monthStats.nextArrival && (
                <div><span style={{ fontWeight: 600, color: 'var(--text2)' }}>In </span>{fmtFull(monthStats.nextArrival.checkIn)}</div>
              )}
              {monthStats.nextCheckout && monthStats.nextCheckout.checkIn !== monthStats.nextArrival?.checkIn && (
                <div><span style={{ fontWeight: 600, color: 'var(--text2)' }}>Out </span>{fmtFull(monthStats.nextCheckout.checkOut)}</div>
              )}
            </div>
          )}
        </div>
      )}

      {!loading && !data && (
        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text3)' }}>No calendar connected</p>
      )}
    </div>
  )
}
