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

// Revenue: prefer real payout data from the Hospitable API; fall back to
// matching a manually-entered income entry by date.
// The ledger income entry matched to a booking by date, or null
function matchIncomeEntry(booking, incomeEntries) {
  const ci = toMTDateStr(booking.checkIn)
  const co = toMTDateStr(booking.checkOut)
  return incomeEntries.find(e => e.date >= ci && e.date <= co) ?? null
}

function matchRevenue(booking, incomeEntries) {
  if (booking.revenue != null) return Number(booking.revenue)
  const match = matchIncomeEntry(booking, incomeEntries)
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

// Hand-drawn circle around today's date — an open, wobbly ink loop that
// overshoots its start point, like someone circled the date with a marker.
function SketchCircle() {
  return (
    <svg
      viewBox="0 0 30 30"
      aria-hidden="true"
      style={{
        position: 'absolute', inset: -5,
        width: 'calc(100% + 10px)', height: 'calc(100% + 10px)',
        overflow: 'visible', pointerEvents: 'none',
        animation: 'sketchPulse 2.8s ease-in-out infinite',
      }}
    >
      <path
        d="M 21.5 4.8
           C 14 1.5, 4.5 5, 3.2 12.5
           C 2 19.5, 7 26.5, 15 26.8
           C 23 27.1, 28.5 21, 27.8 13.8
           C 27.2 7.5, 21.5 3.5, 16 4.5"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.9"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  )
}

export default function GuestCard({ expenses = [], calendarData: propData, onAddIncome, onEditIncome }) {
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
    setActiveDay(null)
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    setActiveBooking(null)
    setActiveDay(null)
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function handleDayClick(info, dateStr) {
    const hasReminders = (remindersByDate[dateStr]?.length ?? 0) > 0
    setActiveDay(prev => hasReminders && prev !== dateStr ? dateStr : null)
    if (!info) { setActiveBooking(null); return }
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

  // Reset revenue input whenever a different booking is selected
  useEffect(() => { setRevenueInput(''); setEditingRevenue(false) }, [activeBooking])

  // ── Reminders → calendar ──────────────────────────────────────────────────
  // Open reminders with a due date appear on their day: a note pill when the
  // day is free, a pin dot when a booking ribbon already occupies the slot.
  const remindersByDate = useMemo(() => {
    const map = {}
    for (const e of expenses) {
      if (e.entry_type !== 'reminder' || !e.due_date || e.completed) continue
      ;(map[e.due_date] ??= []).push(e)
    }
    return map
  }, [expenses])

  const [activeDay, setActiveDay] = useState(null)
  const [revenueInput, setRevenueInput] = useState('')
  const [revenueSaving, setRevenueSaving] = useState(false)
  const [editingRevenue, setEditingRevenue] = useState(false)
  const activeDayReminders = activeDay ? remindersByDate[activeDay] ?? [] : []

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
          gridAutoRows: 'minmax(60px, 1fr)', rowGap: 2,
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
            const dayReminders = remindersByDate[dateStr] ?? []
            const hasReminders = dayReminders.length > 0

            return (
              <div
                key={day}
                style={{
                  position: 'relative',
                  background: isGap ? 'rgba(10,10,8,0.045)' : 'transparent',
                  borderRadius: isGap ? 8 : 0,
                  cursor: (info || hasReminders) ? 'pointer' : 'default',
                }}
                onClick={() => handleDayClick(info, dateStr)}
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
                }}>
                  {isToday && <SketchCircle />}
                  <span>{day}</span>
                </div>

                {/* Booking card strip — bottom of cell */}
                {info && (
                  <div style={{
                    // Anchored to the top so the ribbon hugs its date number
                    // even when rows stretch taller
                    position: 'absolute', top: 27,
                    height: 26,
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
                        fontSize: 12, fontWeight: 700, color: info.color.text,
                        whiteSpace: 'nowrap', letterSpacing: '0.01em',
                        textShadow: '0 1px 1px rgba(10,10,8,0.12)',
                      }}>
                        {isCheckInDay && <MiniHouse size={11} color={info.color.text} />}
                        {firstName(info.booking.name)}
                      </span>
                    )}
                  </div>
                )}

                {/* Reminder — note pill on a free day, pin dot over a booking */}
                {hasReminders && (
                  info ? (
                    <span style={{
                      position: 'absolute', top: 5, right: 5,
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--accent)',
                      boxShadow: '0 0 0 2px var(--bubble-bg)',
                      zIndex: 4,
                    }} />
                  ) : (
                    <div style={{
                      position: 'absolute', top: 27, left: 3, right: 3,
                      height: 26,
                      background: 'var(--accent-light)',
                      border: '1px dashed var(--accent)',
                      borderRadius: 7,
                      display: 'flex', alignItems: 'center',
                      padding: '0 5px', overflow: 'hidden',
                      zIndex: 1,
                    }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: 'var(--accent)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        ✎ {dayReminders[0].title}
                        {dayReminders.length > 1 && ` +${dayReminders.length - 1}`}
                      </span>
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Reminder detail card ───────────────────────────────────────────── */}
      {!loading && activeDayReminders.length > 0 && (
        <div style={{
          marginTop: 14,
          background: 'var(--accent-light)',
          borderLeft: '4px solid var(--accent)',
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
              Reminder{activeDayReminders.length > 1 ? 's' : ''} · {MONTH_NAMES[+activeDay.slice(5,7) - 1].slice(0,3)} {+activeDay.slice(8,10)}
            </p>
            {activeDayReminders.map(r => (
              <p key={r.id} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.5 }}>
                {r.title}
              </p>
            ))}
          </div>
          <button onClick={() => setActiveDay(null)}
            style={{ fontSize: 15, color: 'var(--text3)', flexShrink: 0, padding: '0 2px' }}>×</button>
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

        const ledgerEntry = matchIncomeEntry(activeB, incomeEntries)

        async function saveRevenue() {
          const amt = parseFloat(revenueInput.replace(/[^0-9.]/g, ''))
          if (!amt) return
          setRevenueSaving(true)
          if (editingRevenue && ledgerEntry && onEditIncome) {
            await onEditIncome(ledgerEntry.id, { amount: amt })
          } else if (onAddIncome) {
            await onAddIncome({
              description: `${activeB.name} — ${fmt(activeB.checkIn)} to ${fmt(activeB.checkOut)}`,
              amount: amt,
              category: 'Booking revenue',
              entry_type: 'income',
              tax_type: null,
              date: toMTDateStr(activeB.checkIn),
            })
          }
          setRevenueInput('')
          setEditingRevenue(false)
          setRevenueSaving(false)
        }

        return (
          <div style={{
            marginTop: 14,
            background: 'var(--bg2)',
            borderLeft: `4px solid ${color.solid}`,
            borderRadius: 10,
            padding: '12px 14px',
          }}>
            {/* Top row: name + status + close */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>{activeB.name}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: color.solid }}>{STATUS_LABELS[status]}</p>
              </div>
              <button onClick={() => setActiveBooking(null)}
                style={{ fontSize: 15, color: 'var(--text3)', padding: '0 2px', flexShrink: 0 }}>×</button>
            </div>

            {/* Dates + nights */}
            <p style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.7, marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: 'var(--text2)' }}>In</span> {fmt(activeB.checkIn)}
              <span style={{ margin: '0 6px' }}>→</span>
              <span style={{ fontWeight: 700, color: 'var(--text2)' }}>Out</span> {fmt(activeB.checkOut)}
              <span style={{ margin: '0 6px' }}>·</span>
              {activeB.nights} night{activeB.nights !== 1 ? 's' : ''}
              {activeB.guests != null && <><span style={{ margin: '0 6px' }}>·</span>{activeB.guests} guest{activeB.guests !== 1 ? 's' : ''}</>}
            </p>

            {/* Revenue — show if known, otherwise inline entry form */}
            {revenue != null && !editingRevenue ? (
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 10,
                paddingTop: 8, borderTop: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--gold)' }}>
                  {dollars(revenue)}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
                  {dollars(revenue / activeB.nights)}/night · gross revenue
                </p>
                {ledgerEntry && onEditIncome && (
                  <button
                    onClick={() => { setRevenueInput(String(ledgerEntry.amount)); setEditingRevenue(true) }}
                    aria-label="Edit revenue"
                    style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text3)', padding: '0 4px' }}
                  >
                    ✎
                  </button>
                )}
              </div>
            ) : (onAddIncome || editingRevenue) ? (
              <div style={{
                paddingTop: 8, borderTop: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Gross booking revenue
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <span style={{
                      position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 14, fontWeight: 700, color: 'var(--text3)',
                    }}>$</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={revenueInput}
                      onChange={e => setRevenueInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveRevenue()}
                      style={{
                        paddingLeft: 22, paddingRight: 10, height: 38,
                        fontSize: 15, fontWeight: 700,
                        borderRadius: 8, width: '100%',
                      }}
                    />
                  </div>
                  <button
                    onClick={saveRevenue}
                    disabled={!revenueInput || revenueSaving}
                    style={{
                      height: 38, padding: '0 16px', borderRadius: 8,
                      background: revenueInput ? 'var(--gold)' : 'var(--bg)',
                      color: revenueInput ? '#fff' : 'var(--text3)',
                      fontSize: 13, fontWeight: 700,
                      border: `1px solid ${revenueInput ? 'transparent' : 'var(--border-mid)'}`,
                      transition: 'background 150ms, color 150ms',
                      flexShrink: 0,
                    }}
                  >
                    {revenueSaving ? 'Saving…' : editingRevenue ? 'Update' : 'Save'}
                  </button>
                  {editingRevenue && (
                    <button
                      onClick={() => { setEditingRevenue(false); setRevenueInput('') }}
                      style={{
                        height: 38, padding: '0 12px', borderRadius: 8,
                        background: 'var(--bg)', color: 'var(--text2)',
                        fontSize: 13, fontWeight: 600,
                        border: '1px solid var(--border-mid)', flexShrink: 0,
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
                {activeB.nights > 1 && revenueInput && !isNaN(parseFloat(revenueInput)) && (
                  <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>
                    {dollars(parseFloat(revenueInput) / activeB.nights)}/night
                  </p>
                )}
              </div>
            ) : null}
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
