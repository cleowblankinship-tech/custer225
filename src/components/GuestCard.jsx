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

// Short weekday name for a date string: "Fri Jun 14"
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

  const today = new Date()
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

  // ── Occupancy + operational stats for the viewed month ────────────────────
  const monthStats = useMemo(() => {
    if (!data?.all) return null

    // Count booked nights in the viewed month from dayMap
    const nightsBooked = Object.keys(dayMap).filter(dateStr => {
      const [y, m] = dateStr.split('-').map(Number)
      return y === viewYear && (m - 1) === viewMonth
    }).length

    const daysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const occupancyPct    = Math.round((nightsBooked / daysInViewMonth) * 100)

    // Next arrival from today (Mountain Time)
    const sorted = [...data.all].sort((a, b) =>
      toMTDateStr(a.checkIn).localeCompare(toMTDateStr(b.checkIn))
    )
    const nextArrival  = sorted.find(b => toMTDateStr(b.checkIn) >= todayMT) ?? null
    const nextCheckout = [...data.all]
      .sort((a, b) => toMTDateStr(a.checkOut).localeCompare(toMTDateStr(b.checkOut)))
      .find(b => toMTDateStr(b.checkOut) > todayMT) ?? null

    // Revenue booked this viewed month
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
    <div style={{ padding: '0 20px 24px' }}>
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
                      position:  'absolute',
                      top: '50%', transform: 'translateY(-50%)',
                      height:    32,
                      left:      info.isFirst ? '8%' : 0,
                      right:     info.isLast  ? '8%' : 0,
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

        {/* ── Occupancy stats panel — the operational heartbeat ─────────── */}
        {!loading && monthStats && (
          <div style={{ background: 'var(--surface-strong)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Hero row: occupancy % + nights + revenue */}
            <div style={{ padding: '24px 24px 20px', display: 'flex', alignItems: 'flex-end', gap: 0 }}>

              {/* Occupancy — the hero number */}
              <div style={{ flex: '0 0 auto', marginRight: 28 }}>
                <p style={{
                  fontSize: 64, fontWeight: 800, lineHeight: 1,
                  letterSpacing: '-0.05em',
                  color: monthStats.occupancyPct >= 70 ? '#7DC140'
                       : monthStats.occupancyPct >= 40 ? '#F5D800'
                       : 'rgba(255,255,255,0.6)',
                }}>
                  {monthStats.occupancyPct}%
                </p>
                <p style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
                  marginTop: 4,
                }}>
                  Occupancy
                </p>
              </div>

              {/* Nights + Revenue — stacked secondary stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {monthStats.nightsBooked}
                    <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>
                      / {monthStats.daysInViewMonth} nights
                    </span>
                  </p>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                    Booked
                  </p>
                </div>
                {monthStats.monthRevenue > 0 && (
                  <div>
                    <p style={{ fontSize: 22, fontWeight: 700, color: '#7DC140', lineHeight: 1, letterSpacing: '-0.02em' }}>
                      ${monthStats.monthRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                    <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                      Revenue
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 24px' }} />

            {/* Next arrival + checkout */}
            <div style={{ display: 'flex', padding: '18px 24px 22px', gap: 24 }}>
              {monthStats.nextArrival ? (
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', marginBottom: 6 }}>
                    Next Arrival
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.90)', lineHeight: 1.2 }}>
                    {fmtFull(monthStats.nextArrival.checkIn)}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                    {monthStats.nextArrival.name}
                  </p>
                </div>
              ) : (
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', marginBottom: 6 }}>
                    Next Arrival
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>None upcoming</p>
                </div>
              )}

              {monthStats.nextCheckout && monthStats.nextCheckout.checkIn !== monthStats.nextArrival?.checkIn && (
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', marginBottom: 6 }}>
                    Next Checkout
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.90)', lineHeight: 1.2 }}>
                    {fmtFull(monthStats.nextCheckout.checkOut)}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                    {monthStats.nextCheckout.name}
                  </p>
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
                  <div style={{ width: 10, height: 32, borderRadius: 3, background: color.bar, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

        {!loading && visibleBookings.length === 0 && (
          <div style={{ padding: '28px 20px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, color: 'var(--text3)' }}>No bookings this month</p>
          </div>
        )}
      </div>
    </div>
  )
}
