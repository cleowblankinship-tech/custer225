import { useState, useEffect, useMemo } from 'react'

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

  // First day of a booking visible in the current month view — used to
  // position the guest name label inside the strip without overflow clipping.
  function isFirstVisibleDay(dateStr, booking) {
    const d    = ymd(dateStr)
    const prev = new Date(d)
    prev.setDate(prev.getDate() - 1)
    const prevStr  = prev.toLocaleDateString('en-CA')
    const prevInfo = dayMap[prevStr]
    return !prevInfo || prevInfo.booking.checkIn !== booking.checkIn
  }

  return (
    <div style={{ padding: '20px 20px 24px' }}>
      <div style={{ background: 'var(--bg2)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>

        {/* ── Month nav ──────────────────────────────────────────────────────── */}
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

        {/* ── Day labels ─────────────────────────────────────────────────────── */}
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

        {/* ── Calendar grid ──────────────────────────────────────────────────── */}
        {loading && !data ? (
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
              const isActive   = info && activeBooking === info.booking.checkIn
              const showLabel  = isActive && isFirstVisibleDay(dateStr, info.booking)

              return (
                <div
                  key={day}
                  style={{ position: 'relative', height: 52 }}
                  onClick={() => handleDayClick(info)}
                >
                  {/* Booking strip */}
                  {info && (
                    <div style={{
                      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                      height: 38,
                      left:   info.isFirst ? '6%' : 0,
                      right:  info.isLast  ? '6%' : 0,
                      background: info.color.bar,
                      borderRadius: info.isFirst && info.isLast ? 19
                                  : info.isFirst ? '19px 0 0 19px'
                                  : info.isLast  ? '0 19px 19px 0' : 0,
                      opacity: isActive ? 1 : 0.88,
                      cursor: 'pointer',
                      transition: 'opacity 120ms ease',
                      overflow: 'visible',
                    }}>
                      {/* Guest name — rendered INSIDE the strip starting at first visible day.
                          No overflow clipping since it's contained within the strip bounds. */}
                      {showLabel && (
                        <div style={{
                          position:   'absolute',
                          top: '50%', transform: 'translateY(-50%)',
                          left: info.isFirst ? 10 : 6,
                          right: 0,
                          display:    'flex',
                          alignItems: 'center',
                          gap:        5,
                          pointerEvents: 'none',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}>
                          <span style={{
                            fontSize:   11,
                            fontWeight: 800,
                            color:      '#fff',
                            letterSpacing: '-0.01em',
                          }}>
                            {info.booking.name}
                          </span>
                          <span style={{
                            fontSize:  10,
                            fontWeight: 400,
                            color:     'rgba(255,255,255,0.72)',
                          }}>
                            {fmt(info.booking.checkIn)}–{fmt(info.booking.checkOut)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Day number */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center',
                    justifyContent: showLabel ? 'flex-end' : 'center',
                    paddingRight: showLabel ? 6 : 0,
                    fontSize:   14,
                    fontWeight: isToday ? 800 : info ? 700 : 400,
                    color:      info    ? info.color.text
                              : isToday ? 'var(--accent)'
                              :           'var(--text)',
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

        {/* ── Occupancy stats — lighter, doesn't compete with the calendar ──── */}
        {!loading && monthStats && (
          <div style={{
            borderTop:  '1px solid var(--border)',
            padding:    '16px 24px 18px',
            display:    'flex',
            alignItems: 'baseline',
            gap:        28,
            flexWrap:   'wrap',
          }}>

            {/* Occupancy */}
            <div>
              <span style={{
                fontSize:      36,
                fontWeight:    800,
                letterSpacing: '-0.04em',
                color: monthStats.occupancyPct >= 70 ? 'var(--green, #5A9A30)'
                     : monthStats.occupancyPct >= 40 ? 'var(--text)'
                     :                                 'var(--text3)',
              }}>
                {monthStats.occupancyPct}%
              </span>
              <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>occupancy</span>
            </div>

            {/* Nights */}
            <div>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                {monthStats.nightsBooked}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>
                / {monthStats.daysInViewMonth} nights
              </span>
            </div>

            {/* Revenue — only if tracked */}
            {monthStats.monthRevenue > 0 && (
              <div>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--green, #5A9A30)', letterSpacing: '-0.02em' }}>
                  ${monthStats.monthRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>revenue</span>
              </div>
            )}

            {/* Next arrival / departure — inline, quiet */}
            {(monthStats.nextArrival || monthStats.nextCheckout) && (
              <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
                {monthStats.nextArrival && (
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text2)' }}>In </span>
                    {fmtFull(monthStats.nextArrival.checkIn)}
                  </div>
                )}
                {monthStats.nextCheckout &&
                 monthStats.nextCheckout.checkIn !== monthStats.nextArrival?.checkIn && (
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text2)' }}>Out </span>
                    {fmtFull(monthStats.nextCheckout.checkOut)}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && !data && (
          <div style={{ padding: '28px 20px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 14, color: 'var(--text3)' }}>No calendar connected</p>
          </div>
        )}
      </div>
    </div>
  )
}
