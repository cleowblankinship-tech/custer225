import { useState, useEffect, useMemo } from 'react'

// ── Booking color palette ──────────────────────────────────────────────────────
//
// Inspired by the property's visual identity: terracotta, gold, coral sand,
// warm charcoal, honey, and slate. Avoids generic calendar primaries.
// All bars use white text. Tested on both light (day) and dark (night) surfaces.
//
const BOOKING_COLORS = [
  { bar: '#C4614A', text: '#fff' },  // terracotta
  { bar: '#C8920A', text: '#fff' },  // amber gold
  { bar: '#C97860', text: '#fff' },  // coral sand
  { bar: '#9A8070', text: '#fff' },  // warm charcoal
  { bar: '#D4A450', text: '#fff' },  // honey / sand
  { bar: '#5A7888', text: '#fff' },  // slate blue
]

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']
const DAY_LABELS  = ['Su','Mo','Tu','We','Th','Fr','Sa']

// ── Date helpers ──────────────────────────────────────────────────────────────

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

// "Fri Jun 14"
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

// ─────────────────────────────────────────────────────────────────────────────

export default function GuestCard({ expenses = [] }) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  const today   = new Date()
  const todayStr = today.toLocaleDateString('en-CA')
  const todayMT  = today.toLocaleDateString('en-CA', { timeZone: 'America/Denver' })

  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

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

  // "YYYY-MM-DD" → { booking, isFirst, isLast, color }
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

  // ── Occupancy + operational stats ─────────────────────────────────────────
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
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstWeekDay = new Date(viewYear, viewMonth, 1).getDay()

  return (
    <div style={{ padding: '20px 20px 24px' }}>
      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>

        {/* ── Month nav ─────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px',
          borderBottom: '1px solid var(--border)',
        }}>
          <button onClick={prevMonth} style={{ fontSize: 24, color: 'var(--text2)', padding: '0 2px', lineHeight: 1 }}>‹</button>
          <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </p>
          <button onClick={nextMonth} style={{ fontSize: 24, color: 'var(--text2)', padding: '0 2px', lineHeight: 1 }}>›</button>
        </div>

        {/* ── Day labels ────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '10px 14px 2px' }}>
          {DAY_LABELS.map(l => (
            <div key={l} style={{
              textAlign: 'center', fontSize: 11, fontWeight: 700,
              color: 'var(--text3)', letterSpacing: '0.06em', paddingBottom: 2,
            }}>
              {l}
            </div>
          ))}
        </div>

        {/* ── Calendar grid ─────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
            Loading…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 14px 14px', rowGap: 2 }}>
            {Array.from({ length: firstWeekDay }).map((_, i) => <div key={`e${i}`} />)}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day     = i + 1
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const info    = dayMap[dateStr]
              const isToday = dateStr === todayStr

              return (
                <div key={day} style={{ position: 'relative', height: 44 }}>
                  {info && (
                    <div style={{
                      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                      height: 32,
                      left:   info.isFirst ? '8%' : 0,
                      right:  info.isLast  ? '8%' : 0,
                      background: info.color.bar,
                      borderRadius: info.isFirst && info.isLast ? 16
                                  : info.isFirst ? '16px 0 0 16px'
                                  : info.isLast  ? '0 16px 16px 0' : 0,
                      opacity: 0.93,
                    }} />
                  )}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize:   14,
                    fontWeight: isToday ? 800 : info ? 700 : 400,
                    color:      info    ? info.color.text
                              : isToday ? 'var(--accent)'
                              :           'var(--text)',
                    zIndex: 1,
                  }}>
                    {day}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Occupancy stats — the operational heartbeat ───────────────── */}
        {/*
          Design intent: one dominant number (occupancy %) that is so large
          it reads before you consciously look. Supporting stats are present
          but quiet — they're there when you need them, invisible when you don't.

          Color coding: green ≥70% (performing), yellow ≥40% (moderate), dim <40%.
        */}
        {!loading && monthStats && (
          <div style={{ background: 'var(--surface-strong)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

            {/* ── Hero row ─────────────────────────────────────────────── */}
            <div style={{ padding: '28px 24px 22px', display: 'flex', alignItems: 'flex-end' }}>

              {/* Occupancy % — the number that matters most */}
              <div style={{ flex: '0 0 auto', marginRight: 32 }}>
                <p style={{
                  fontSize:      80,
                  fontWeight:    800,
                  lineHeight:    1,
                  letterSpacing: '-0.06em',
                  color: monthStats.occupancyPct >= 70 ? '#7DC140'
                       : monthStats.occupancyPct >= 40 ? '#F5D800'
                       :                                 'rgba(255,255,255,0.45)',
                }}>
                  {monthStats.occupancyPct}%
                </p>
                <p style={{
                  fontSize:      9,
                  fontWeight:    700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color:         'rgba(255,255,255,0.28)',
                  marginTop:     6,
                }}>
                  {MONTH_NAMES[viewMonth].slice(0,3).toUpperCase()} {viewYear}
                </p>
              </div>

              {/* Secondary: nights + revenue */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 4 }}>

                {/* Nights booked */}
                <div>
                  <p style={{
                    fontSize:      28,
                    fontWeight:    800,
                    lineHeight:    1,
                    letterSpacing: '-0.03em',
                    color:         'rgba(255,255,255,0.80)',
                  }}>
                    {monthStats.nightsBooked}
                    <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.25)', marginLeft: 2 }}>
                      /{monthStats.daysInViewMonth}
                    </span>
                  </p>
                  <p style={{
                    fontSize:      8,
                    fontWeight:    700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color:         'rgba(255,255,255,0.25)',
                    marginTop:     4,
                  }}>
                    Nights
                  </p>
                </div>

                {/* Revenue — only if data present */}
                {monthStats.monthRevenue > 0 && (
                  <div>
                    <p style={{
                      fontSize:      28,
                      fontWeight:    800,
                      lineHeight:    1,
                      letterSpacing: '-0.03em',
                      color:         '#7DC140',
                    }}>
                      ${monthStats.monthRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                    <p style={{
                      fontSize:      8,
                      fontWeight:    700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color:         'rgba(255,255,255,0.25)',
                      marginTop:     4,
                    }}>
                      Revenue
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Arrivals / Departures ─────────────────────────────────── */}
            {/*
              Stripped to essentials: direction label (In / Out), date, name.
              No headers — the labels are the headers.
            */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding:   '16px 24px 22px',
              display:   'flex',
              flexDirection: 'column',
              gap:       10,
            }}>
              {monthStats.nextArrival ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
                    width: 22, flexShrink: 0,
                  }}>
                    In
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                    {fmtFull(monthStats.nextArrival.checkIn)}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginLeft: 2 }}>
                    {monthStats.nextArrival.name}
                  </span>
                </div>
              ) : (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>No upcoming arrivals</p>
              )}

              {monthStats.nextCheckout &&
               monthStats.nextCheckout.checkIn !== monthStats.nextArrival?.checkIn && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)',
                    width: 22, flexShrink: 0,
                  }}>
                    Out
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                    {fmtFull(monthStats.nextCheckout.checkOut)}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginLeft: 2 }}>
                    {monthStats.nextCheckout.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Booking list ───────────────────────────────────────────────── */}
        {!loading && visibleBookings.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {visibleBookings.map((b, i) => {
              const color   = colorMap[b.checkIn] ?? BOOKING_COLORS[0]
              const revenue = matchRevenue(b, incomeEntries)
              return (
                <div key={b.checkIn} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px',
                  borderBottom: i < visibleBookings.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  {/* Vertical bar swatch — stronger visual rhythm than dots */}
                  <div style={{
                    width: 3, height: 36, borderRadius: 2,
                    background: color.bar, flexShrink: 0,
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 15, fontWeight: 700, color: 'var(--text)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {b.name}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                      {fmt(b.checkIn)} – {fmt(b.checkOut)} · {b.nights} night{b.nights !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {revenue !== null ? (
                      <>
                        <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>
                          ${revenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
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

        {!loading && visibleBookings.length === 0 && !loading && (
          <div style={{ padding: '28px 20px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, color: 'var(--text3)' }}>No bookings this month</p>
          </div>
        )}
      </div>
    </div>
  )
}
