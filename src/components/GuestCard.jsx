import { useState, useEffect, useMemo } from 'react'

// ── Semantic status colors ────────────────────────────────────────────────────
// Color communicates booking state, not arbitrary identity:
//   upcoming      → sage green
//   current guest → warm yellow
//   checkout day  → coral
//   past          → muted stone
const STATUS_COLORS = {
  upcoming: { bar: 'rgba(122, 155, 109, 0.82)', solid: '#7A9B6D', text: '#fff'    },
  current:  { bar: 'rgba(232, 185, 49, 0.88)',  solid: '#C99B14', text: '#3A3208' },
  checkout: { bar: 'rgba(224, 106, 78, 0.85)',  solid: '#E06A4E', text: '#fff'    },
  past:     { bar: 'rgba(150, 145, 130, 0.45)', solid: '#969182', text: '#fff'    },
}

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

function matchRevenue(booking, incomeEntries) {
  const ci = toMTDateStr(booking.checkIn)
  const co = toMTDateStr(booking.checkOut)
  const match = incomeEntries.find(e => e.date >= ci && e.date <= co)
  return match ? Number(match.amount) : null
}

function bookingStatus(b, todayMT) {
  const ci = toMTDateStr(b.checkIn)
  const co = toMTDateStr(b.checkOut)
  if (co === todayMT)                 return 'checkout'
  if (ci <= todayMT && todayMT < co)  return 'current'
  if (ci > todayMT)                   return 'upcoming'
  return 'past'
}

function firstName(name) {
  return (name ?? '').split(' ')[0]
}

function dollars(n) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

// Tiny house glyph — connects the calendar to the house mascot
function MiniHouse({ size = 9, color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: '-1px', flexShrink: 0 }}>
      <path d="M 1 6 L 6 1.5 L 11 6 M 2.5 5.5 L 2.5 10.5 L 9.5 10.5 L 9.5 5.5"
        fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function GuestCard({ expenses = [], calendarData: propData }) {
  const [fetchedData, setFetchedData] = useState(null)
  const [loading,     setLoading]     = useState(!propData)
  // The booking whose detail card is shown; keyed by checkIn ISO
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

  useEffect(() => {
    if (propData) setLoading(false)
  }, [propData])

  const incomeEntries = useMemo(
    () => expenses.filter(e => e.entry_type === 'income'),
    [expenses]
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

  // dayMap: every booked night → booking + status color + position-in-run
  const dayMap = useMemo(() => {
    const map = {}
    if (!data?.all) return map
    for (const b of data.all) {
      const status = bookingStatus(b, todayMT)
      const color  = STATUS_COLORS[status]
      const ciStr  = toMTDateStr(b.checkIn)
      const ci     = ymd(ciStr)
      const co     = ymd(toMTDateStr(b.checkOut))
      const cursor = new Date(ci)
      while (cursor < co) {
        const key = cursor.toLocaleDateString('en-CA')
        map[key] = {
          booking: b,
          status,
          isFirst: key === ciStr,
          isLast:  cursor.getTime() === new Date(co - 86400000).getTime(),
          color,
        }
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    return map
  }, [data, todayMT])

  // gapSet: vacant nights that fall BETWEEN reservations — lost-revenue signal
  const gapSet = useMemo(() => {
    const set = new Set()
    if (!data?.all || data.all.length < 2) return set
    const sorted = [...data.all].sort((a, b) =>
      toMTDateStr(a.checkIn).localeCompare(toMTDateStr(b.checkIn)))
    for (let i = 0; i < sorted.length - 1; i++) {
      const gapStart = ymd(toMTDateStr(sorted[i].checkOut))
      const gapEnd   = ymd(toMTDateStr(sorted[i + 1].checkIn))
      const cursor   = new Date(gapStart)
      while (cursor < gapEnd) {
        set.add(cursor.toLocaleDateString('en-CA'))
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    return set
  }, [data])

  const monthStats = useMemo(() => {
    if (!data?.all) return null

    const inViewMonth = dateStr => {
      const [y, m] = dateStr.split('-').map(Number)
      return y === viewYear && (m - 1) === viewMonth
    }

    const nightsBooked    = Object.keys(dayMap).filter(inViewMonth).length
    const gapNights       = [...gapSet].filter(inViewMonth).length
    const daysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const occupancyPct    = Math.round((nightsBooked / daysInViewMonth) * 100)

    const monthRevenue = visibleBookings.reduce((sum, b) => {
      const r = matchRevenue(b, incomeEntries)
      return sum + (r ?? 0)
    }, 0)

    return { nightsBooked, daysInViewMonth, occupancyPct, monthRevenue, gapNights,
             bookingCount: visibleBookings.length }
  }, [data, dayMap, gapSet, viewYear, viewMonth, visibleBookings, incomeEntries])

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

  // First day of a booking visible in the current month view — where the
  // guest name label is anchored (handles bookings spilling in from last month)
  function isFirstVisibleDay(dateStr, booking) {
    const d    = ymd(dateStr)
    if (d.getDate() === 1) return true
    const prev = new Date(d)
    prev.setDate(prev.getDate() - 1)
    const prevInfo = dayMap[prev.toLocaleDateString('en-CA')]
    return !prevInfo || prevInfo.booking.checkIn !== booking.checkIn
  }

  const activeB = activeBooking ? data?.all?.find(b => b.checkIn === activeBooking) : null

  return (
    // ── Dashboard panel container ─────────────────────────────────────────────
    <div style={{
      margin: '12px 16px 16px',
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--bubble-bg)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      boxShadow: '0 1px 2px rgba(10,10,8,0.04), 0 8px 24px rgba(10,10,8,0.06)',
      padding: '20px 22px 18px',
      minWidth: 0,
    }}>

      {/* ── Premium month header ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <div>
          <p style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {MONTH_NAMES[viewMonth]} <span style={{ color: 'var(--text3)', fontWeight: 600 }}>{viewYear}</span>
          </p>
          {monthStats && (
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', marginTop: 3 }}>
              {monthStats.occupancyPct}% occupancy · {monthStats.nightsBooked} of {monthStats.daysInViewMonth} nights
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['‹', prevMonth, 'Previous month'], ['›', nextMonth, 'Next month']].map(([sym, fn, label]) => (
            <button key={label} onClick={fn} aria-label={label} style={{
              width: 30, height: 30, lineHeight: 1, fontSize: 18, fontWeight: 600,
              color: 'var(--text2)', background: 'var(--bg2)',
              border: '1px solid var(--border)', borderRadius: 8,
            }}>
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* ── Operational metrics strip ──────────────────────────────────────── */}
      {monthStats && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
          marginBottom: 16,
        }}>
          {[
            [`${monthStats.occupancyPct}%`, 'Occupancy',
              monthStats.occupancyPct >= 70 ? STATUS_COLORS.upcoming.solid : 'var(--text)'],
            [monthStats.monthRevenue > 0 ? dollars(monthStats.monthRevenue) : '—', 'Revenue', 'var(--text)'],
            [monthStats.bookingCount, `Booking${monthStats.bookingCount !== 1 ? 's' : ''}`, 'var(--text)'],
            [monthStats.gapNights, `Gap night${monthStats.gapNights !== 1 ? 's' : ''}`,
              monthStats.gapNights > 0 ? STATUS_COLORS.checkout.solid : 'var(--text3)'],
          ].map(([value, label, color]) => (
            <div key={label} style={{
              background: 'var(--bg2)', borderRadius: 10, padding: '8px 10px',
              minWidth: 0,
            }}>
              <p style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color, lineHeight: 1.2 }}>
                {value}
              </p>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Day labels ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DAY_LABELS.map(l => (
          <div key={l} style={{
            textAlign: 'center', fontSize: 10, fontWeight: 700,
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
        <div style={{
          flex: 1, minHeight: 0,
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: 'minmax(48px, 1fr)', rowGap: 2,
        }}>
          {Array.from({ length: firstWeekDay }).map((_, i) => <div key={`e${i}`} />)}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day      = i + 1
            const dateStr  = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const info     = dayMap[dateStr]
            const isToday  = dateStr === todayStr
            const isActive = info && activeBooking === info.booking.checkIn
            const isGap    = !info && gapSet.has(dateStr)
            const showName = info && isFirstVisibleDay(dateStr, info.booking)
            const isCheckInDay = info?.isFirst

            return (
              <div
                key={day}
                style={{
                  position: 'relative',
                  background: isGap ? 'rgba(10,10,8,0.045)' : 'transparent',
                  borderRadius: isGap ? 8 : 0,
                  cursor: info ? 'pointer' : 'default',
                }}
                onClick={() => handleDayClick(info)}
              >
                {/* Date number — top-left; today gets a hand-drawn circle */}
                <div style={{
                  position: 'absolute', top: 3, left: 6,
                  width: 22, height: 22,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: isToday ? 900 : 700,
                  color: isToday ? 'var(--accent)' : isGap ? 'var(--text3)' : 'var(--text2)',
                  zIndex: 2,
                  ...(isToday && {
                    border: '2px solid var(--accent)',
                    borderRadius: '52% 46% 50% 48% / 48% 52% 46% 52%',
                    transform: 'rotate(-4deg)',
                    animation: 'todayPulse 2.6s ease-in-out infinite',
                  }),
                }}>
                  <span style={{ transform: isToday ? 'rotate(4deg)' : 'none' }}>{day}</span>
                </div>

                {/* Booking card strip — bottom of cell */}
                {info && (
                  <div style={{
                    position: 'absolute', bottom: 4,
                    height: 20,
                    left:   info.isFirst ? 3 : -1,
                    right:  info.isLast  ? 3 : -1,
                    background: info.color.bar,
                    borderRadius: info.isFirst && info.isLast ? 7
                                : info.isFirst ? '7px 0 0 7px'
                                : info.isLast  ? '0 7px 7px 0' : 0,
                    boxShadow: isActive
                      ? `0 0 0 2px ${info.color.solid}, 0 2px 6px rgba(10,10,8,0.18)`
                      : '0 1px 3px rgba(10,10,8,0.12)',
                    transition: 'box-shadow 130ms ease',
                    display: 'flex', alignItems: 'center',
                    paddingLeft: showName ? 6 : 0,
                    overflow: 'visible',
                    zIndex: isActive ? 3 : 1,
                  }}>
                    {showName && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontSize: 10, fontWeight: 700, color: info.color.text,
                        whiteSpace: 'nowrap', letterSpacing: '0.01em',
                        textShadow: '0 1px 1px rgba(10,10,8,0.12)',
                      }}>
                        {isCheckInDay && <MiniHouse color={info.color.text} />}
                        {firstName(info.booking.name)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Booking detail card ────────────────────────────────────────────── */}
      {!loading && activeB && (() => {
        const status  = bookingStatus(activeB, todayMT)
        const color   = STATUS_COLORS[status]
        const revenue = matchRevenue(activeB, incomeEntries)
        const STATUS_LABELS = {
          upcoming: 'Upcoming', current: 'Staying now',
          checkout: 'Checks out today', past: 'Past stay',
        }
        return (
          <div style={{
            marginTop: 14,
            background: 'var(--bg2)',
            borderLeft: `4px solid ${color.solid}`,
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>
                {activeB.name}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: color.solid }}>
                {STATUS_LABELS[status]}
              </p>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
              <span style={{ fontWeight: 700, color: 'var(--text2)' }}>In</span> {fmt(activeB.checkIn)}
              <span style={{ margin: '0 6px' }}>→</span>
              <span style={{ fontWeight: 700, color: 'var(--text2)' }}>Out</span> {fmt(activeB.checkOut)}
              <span style={{ margin: '0 6px' }}>·</span>
              {activeB.nights} night{activeB.nights !== 1 ? 's' : ''}
            </div>
            {revenue != null && (
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <p style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em' }}>{dollars(revenue)}</p>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)' }}>
                  {dollars(revenue / activeB.nights)}/night
                </p>
              </div>
            )}
            <button onClick={() => setActiveBooking(null)}
              style={{ fontSize: 15, color: 'var(--text3)', flexShrink: 0, padding: '0 2px' }}>×</button>
          </div>
        )
      })()}

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      {!loading && data && (
        <div style={{
          marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)',
          display: 'flex', gap: 14, flexWrap: 'wrap',
        }}>
          {[
            ['Current',  STATUS_COLORS.current.bar],
            ['Upcoming', STATUS_COLORS.upcoming.bar],
            ['Checkout', STATUS_COLORS.checkout.bar],
            ['Gap night','rgba(10,10,8,0.08)'],
          ].map(([label, swatch]) => (
            <span key={label} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10, fontWeight: 600, color: 'var(--text3)',
            }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: swatch, display: 'inline-block' }} />
              {label}
            </span>
          ))}
        </div>
      )}

      {!loading && !data && (
        <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text3)' }}>No calendar connected</p>
      )}
    </div>
  )
}
