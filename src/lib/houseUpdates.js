import { normalizeCategory } from './categories'

// ── House Updates ─────────────────────────────────────────────────────────────
//
// Data model for the "House Today" layer.
//
// Phase 1: mock data only — getActiveUpdates() returns a static array.
// Phase 2: replace getActiveUpdates() with real sources:
//   - Weather API alerts (freeze, hail, high wind, etc.)
//   - User-created reminders from the tasks system
//   - Scheduled maintenance notices
//   - Booking-triggered reminders (guest arriving → prep tasks)

// ── Types ─────────────────────────────────────────────────────────────────────

export const UPDATE_TYPES = {
  alert:       { label: 'Alert',       plural: 'Alerts' },
  reminder:    { label: 'Reminder',    plural: 'Reminders' },
  maintenance: { label: 'Maintenance', plural: 'Maintenance' },
  update:      { label: 'Update',      plural: 'Updates' },
}

// Render order in the House Today panel
export const SECTION_ORDER = ['alert', 'reminder', 'maintenance', 'update']

// ── Mock data ─────────────────────────────────────────────────────────────────
//
// Each item:
//   id        — unique string
//   type      — 'alert' | 'reminder' | 'maintenance' | 'update'
//   priority  — 'high' | 'normal' | 'low'
//   title     — short message shown in the speech bubble
//   detail    — longer description shown in the House Today panel

const MOCK_UPDATES = []

// ── Mood system ───────────────────────────────────────────────────────────────
//
// Three moods, determined from the active updates array:
//
//   urgent    — any high-priority alert (weather, safety)
//   attention — any reminder, maintenance, or task due today
//   calm      — nothing active

/**
 * Derive house mood from the current update list.
 * @param {Array} updates — from getActiveUpdates()
 * @returns {'urgent'|'attention'|'calm'}
 */
export function getHouseMood(updates) {
  if (updates.some(u => u.type === 'alert' && u.priority === 'high')) return 'urgent'
  if (updates.length > 0) return 'attention'
  return 'calm'
}

// ── Calm-state messaging ──────────────────────────────────────────────────────
//
// Shown in the speech bubble when there are no active updates.
// Messages are time-of-day aware (morning / afternoon / evening), randomly
// selected, and cached in sessionStorage so they stay stable for the session
// while feeling fresh on the next visit.

const CALM_MESSAGES = {
  morning: [
    "All is quiet this morning.",
    "Nothing pressing. For now.",
    "Everything is holding steady.",
    "No issues to start the day.",
    "The house is calm.",
  ],
  afternoon: [
    "Everything is in order.",
    "Nothing urgent right now.",
    "All is steady.",
    "No action needed today.",
    "Holding steady.",
  ],
  evening: [
    "All is quiet tonight.",
    "Nothing left unattended.",
    "The house is settled.",
    "Everything is in order.",
    "A quiet evening.",
  ],
}

function getTimeOfDay() {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}

/**
 * Returns a calm-state message.
 * - Time-of-day aware (morning / afternoon / evening pools)
 * - Randomly selected, never repeating the previous message
 * - Cached in sessionStorage — stable for the current browser session
 * @returns {string}
 */
export function getCalmMessage() {
  const period    = getTimeOfDay()
  const pool      = CALM_MESSAGES[period]
  const cacheKey  = `custer225_calm_${period}`
  const lastKey   = 'custer225_calm_last'

  // Return the cached pick for this period if it exists and is still valid
  try {
    const cached = sessionStorage.getItem(cacheKey)
    if (cached && pool.includes(cached)) return cached
  } catch {}

  // Avoid repeating the last message shown (across any period)
  let prev = null
  try { prev = sessionStorage.getItem(lastKey) } catch {}
  const candidates = pool.filter(m => m !== prev)
  const source = candidates.length > 0 ? candidates : pool
  const pick   = source[Math.floor(Math.random() * source.length)]

  try {
    sessionStorage.setItem(cacheKey, pick)
    sessionStorage.setItem(lastKey, pick)
  } catch {}

  return pick
}

// ── Composite message ─────────────────────────────────────────────────────────
//
// Called when there are no active alerts/reminders — replaces the plain
// calm message with something that synthesises current app state.
// Priority: near-launch countdown → pre-launch no-revenue → launched no-revenue
//           → weather → calm fallback.
//
// All arguments are optional with safe defaults so callers can pass partial state.

/**
 * @param {object} opts
 * @param {string|null}  opts.weatherBlurb    — short weather string, e.g. "Hazy and cold."
 * @param {number}       opts.setupPct        — 0–100 launch readiness %
 * @param {number}       opts.setupRemaining  — tasks still incomplete
 * @param {number}       opts.totalRevenue    — all-time Airbnb revenue
 * @returns {string}
 */
export function getCompositeMessage({
  weatherBlurb = null,
  setupPct = 100,
  setupRemaining = 0,
  totalRevenue = 0,
} = {}) {
  const launched   = setupPct >= 100
  const hasRevenue = totalRevenue > 0
  const w          = weatherBlurb   // shorthand

  // Near launch: specific task countdown
  if (!launched && setupPct >= 85) {
    const tasks = setupRemaining === 1 ? '1 task' : `${setupRemaining} tasks`
    return w
      ? `${w} ${tasks} left before launch.`
      : `${tasks} left before launch. Final stretch.`
  }

  // Pre-launch, no revenue — motivate
  if (!launched && !hasRevenue) {
    if (setupPct >= 60) {
      return w
        ? `${w} Almost ready to earn.`
        : `No income yet, but the house is almost ready.`
    }
    return w
      ? `${w} House is ${setupPct}% ready.`
      : `The house is ${setupPct}% ready. Keep going.`
  }

  // Launched, still no revenue — prompt for first booking
  if (launched && !hasRevenue) {
    return w
      ? `${w} Add your first Airbnb booking when it comes in.`
      : `Ready to launch. Add your first booking when it comes in.`
  }

  // All good — fall back to weather or calm pool
  return w ?? getCalmMessage()
}

// ── Guest-aware speech ────────────────────────────────────────────────────────
//
// Returns a message about the current or next guest when calendar data is live.
// Called before the composite message so guest context takes priority.

/**
 * @param {{ current, next }} calendarData — from /api/calendar
 * @returns {string|null} message, or null if no relevant guest context
 */
export function getGuestMessage(calendarData) {
  if (!calendarData) return null

  const now = new Date()

  if (calendarData.current) {
    const g = calendarData.current
    const checkout = new Date(g.checkOut)
    const checkoutDateStr = checkout.toLocaleDateString('en-US', {
      timeZone: 'America/Denver', month: 'short', day: 'numeric',
    })
    const isCheckoutToday = checkout.toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
      === now.toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
    if (isCheckoutToday) {
      return `${g.firstName} checks out today.`
    }
    const msLeft    = checkout - now
    const daysLeft  = Math.ceil(msLeft / (1000 * 60 * 60 * 24))
    if (daysLeft === 1) return `${g.firstName} checks out tomorrow.`
    return `${g.firstName} is staying for ${daysLeft} more night${daysLeft !== 1 ? 's' : ''}.`
  }

  if (calendarData.next) {
    const g = calendarData.next
    const checkin = new Date(g.checkIn)
    const msAway  = checkin - now
    const daysAway = Math.ceil(msAway / (1000 * 60 * 60 * 24))
    const checkinDateStr = checkin.toLocaleDateString('en-US', {
      timeZone: 'America/Denver', weekday: 'short', month: 'short', day: 'numeric',
    })
    const isCheckinToday = checkin.toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
      === now.toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
    if (isCheckinToday) return `${g.firstName} checks in today.`
    if (daysAway <= 2) return `${g.firstName} arrives in ${daysAway} day${daysAway !== 1 ? 's' : ''}.`
    return `Next guest: ${g.firstName} on ${checkinDateStr}.`
  }

  return null
}

// ── Month pulse ───────────────────────────────────────────────────────────────
//
// One narrator sentence about how the current month is shaping up, derived
// from live calendar data. Appended to guest/calm messages so the house reads
// as the dashboard's narrator, not just an alert lamp.

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']

/**
 * @param {{ all }} calendarData — from /api/calendar
 * @returns {string|null} e.g. "June is 87% booked — 5 stays on the calendar."
 */
export function getMonthPulse(calendarData) {
  if (!calendarData?.all?.length) return null

  const now      = new Date()
  const mtToday  = now.toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
  const [y, m]   = mtToday.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const prefix   = `${y}-${String(m).padStart(2, '0')}`

  const bookedNights = new Set()
  let stays = 0
  for (const b of calendarData.all) {
    const ci = new Date(b.checkIn).toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
    const co = new Date(b.checkOut).toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
    let touchesMonth = false
    const cursor = new Date(ci.slice(0, 4), ci.slice(5, 7) - 1, ci.slice(8, 10))
    const end    = new Date(co.slice(0, 4), co.slice(5, 7) - 1, co.slice(8, 10))
    while (cursor < end) {
      const key = cursor.toLocaleDateString('en-CA')
      if (key.startsWith(prefix)) { bookedNights.add(key); touchesMonth = true }
      cursor.setDate(cursor.getDate() + 1)
    }
    if (touchesMonth) stays++
  }
  if (stays === 0) return null

  const pct = Math.round((bookedNights.size / daysInMonth) * 100)
  return `${MONTH_NAMES[m - 1]} is ${pct}% booked — ${stays} stay${stays !== 1 ? 's' : ''} on the calendar.`
}

// ── House narrator ────────────────────────────────────────────────────────────
//
// The house speaks in first person — a warm, slightly wry host who knows its
// own calendar and books. getHouseNarration() weaves together up to three
// beats: today's headline (turnovers, reminders), the guest story, and a
// business pulse (occupancy, revenue, gap-night nudges). Phrasing rotates
// daily via a date seed so the voice feels alive without flickering between
// renders.


function mtDate(iso) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
}

function fmtDay(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}`
}

function dollars(n) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

// Deterministic daily variety: same phrasing all day, fresh tomorrow.
function pick(pool, slot = 0) {
  const now  = new Date()
  const seed = now.getFullYear() * 366 + Math.floor(
    (now - new Date(now.getFullYear(), 0, 0)) / 86400000
  )
  return pool[(seed + slot * 7) % pool.length]
}

function nightsWord(n) {
  return `${n} night${n !== 1 ? 's' : ''}`
}

// Normalize the raw calendar into sorted, MT-dated stays
function normalizeStays(calendarData) {
  if (!calendarData?.all?.length) return []
  return calendarData.all
    .map(b => ({
      name:    (b.name ?? b.firstName ?? 'a guest').split(' ')[0],
      ci:      mtDate(b.checkIn),
      co:      mtDate(b.checkOut),
      nights:  b.nights ?? null,
      revenue: b.revenue != null ? Number(b.revenue) : null,
    }))
    .sort((a, b) => a.ci.localeCompare(b.ci))
}

// ── Beat 1: the guest story ──────────────────────────────────────────────────
function guestStory(stays, todayMT) {
  if (!stays.length) return pick([
    "My calendar's wide open — no guests on the books yet.",
    "All quiet here. No stays booked at the moment.",
  ])

  const current  = stays.find(b => b.ci <= todayMT && todayMT < b.co)
  const outToday = stays.find(b => b.co === todayMT)
  const inToday  = stays.find(b => b.ci === todayMT)
  const next     = stays.find(b => b.ci > todayMT)

  // Same-day turnover — the busiest kind of day for a house
  if (outToday && inToday) {
    return `${outToday.name} heads out and ${inToday.name} arrives — a same-day turnover, so I'll be buzzing.`
  }

  if (outToday) {
    let s = pick([
      `${outToday.name} checks out today — time to get the linens going.`,
      `Waving ${outToday.name} off today.`,
    ])
    if (next) {
      const restNights = Math.round((new Date(next.ci) - new Date(todayMT)) / 86400000)
      s += restNights > 1
        ? ` Then I get ${restNights - 0} quiet days before ${next.name} arrives on ${fmtDay(next.ci)}.`
        : ` ${next.name} arrives ${restNights === 1 ? 'tomorrow' : `on ${fmtDay(next.ci)}`}.`
    }
    return s
  }

  if (inToday) {
    return pick([
      `${inToday.name} checks in today for ${nightsWord(inToday.nights ?? 1)} — I'd better look my best.`,
      `Fresh towels out: ${inToday.name} arrives today for ${nightsWord(inToday.nights ?? 1)}.`,
    ])
  }

  if (current) {
    const left = Math.round((new Date(current.co) - new Date(todayMT)) / 86400000)
    let s = left === 1
      ? pick([
          `${current.name} checks out tomorrow.`,
          `Last night of ${current.name}'s stay tonight.`,
        ])
      : pick([
          `${current.name} is settled in — ${nightsWord(left)} left with me.`,
          `I've got ${current.name} here through ${fmtDay(current.co)}.`,
        ])
    if (next) s += ` ${next.name} follows on ${fmtDay(next.ci)}.`
    return s
  }

  // Nothing in-house — look ahead
  const daysAway = Math.round((new Date(next.ci) - new Date(todayMT)) / 86400000)
  if (daysAway <= 2) {
    return `${next.name} arrives in ${daysAway} day${daysAway !== 1 ? 's' : ''} for ${nightsWord(next.nights ?? 1)} — getting the place ready.`
  }
  return pick([
    `A little breather for me — next up is ${next.name} on ${fmtDay(next.ci)} for ${nightsWord(next.nights ?? 1)}.`,
    `Empty rooms until ${fmtDay(next.ci)}, when ${next.name} arrives for ${nightsWord(next.nights ?? 1)}.`,
  ])
}

// ── Beat 2: the business pulse ───────────────────────────────────────────────
function businessPulse(stays, expenses, todayMT) {
  if (!stays.length) return null
  const [y, m] = todayMT.split('-').map(Number)
  const prefix = `${y}-${String(m).padStart(2, '0')}`
  const daysInMonth = new Date(y, m, 0).getDate()
  const monthName   = MONTH_NAMES[m - 1]

  const incomeEntries = expenses.filter(e => e.entry_type === 'income')
  const bookedNights  = new Set()
  let stayCount = 0
  let revenue   = 0

  for (const b of stays) {
    const cursor = new Date(b.ci.slice(0, 4), b.ci.slice(5, 7) - 1, b.ci.slice(8, 10))
    const end    = new Date(b.co.slice(0, 4), b.co.slice(5, 7) - 1, b.co.slice(8, 10))
    let touches = false
    while (cursor < end) {
      const key = cursor.toLocaleDateString('en-CA')
      if (key.startsWith(prefix)) { bookedNights.add(key); touches = true }
      cursor.setDate(cursor.getDate() + 1)
    }
    if (!touches) continue
    stayCount++
    // Mirror the calendar's revenue matching: API payout first, then the
    // ledger income entry dated to check-in
    revenue += b.revenue
      ?? Number(incomeEntries.find(
           e => normalizeCategory(e.category) === 'Gross Booking Revenue' && e.date === b.ci
         )?.amount ?? 0)
  }
  if (stayCount === 0) return null

  const pct = Math.round((bookedNights.size / daysInMonth) * 100)
  const text = revenue > 0
    ? pick([
        `${monthName} so far: ${pct}% booked, ${stayCount} stay${stayCount !== 1 ? 's' : ''}, ${dollars(revenue)} through my doors.`,
        `I'm ${pct}% booked this ${monthName} — ${stayCount} stay${stayCount !== 1 ? 's' : ''} bringing in ${dollars(revenue)}.`,
      ], 1)
    : `${monthName} is ${pct}% booked across ${stayCount} stay${stayCount !== 1 ? 's' : ''}.`

  // Flourish is skipped when a gap nudge follows — one editorial note at a time
  const flourish = pct >= 85 ? pick([' Barely a night to myself.', ' A full house suits me.'], 2)
                 : pct < 40  ? ' Plenty of room for more company.'
                 : ''
  return { text, flourish, revenue, bookedNights: bookedNights.size, prefix, daysInMonth }
}

// ── Beat 3: the gap-night nudge ──────────────────────────────────────────────
function gapNudge(stays, pulse, todayMT) {
  if (!pulse || stays.length < 2) return null
  // Vacant nights between consecutive stays, still ahead of today, this month
  let gaps = 0
  let firstGap = null
  for (let i = 0; i < stays.length - 1; i++) {
    const cursor = new Date(stays[i].co.slice(0, 4), stays[i].co.slice(5, 7) - 1, stays[i].co.slice(8, 10))
    const end    = new Date(stays[i + 1].ci.slice(0, 4), stays[i + 1].ci.slice(5, 7) - 1, stays[i + 1].ci.slice(8, 10))
    while (cursor < end) {
      const key = cursor.toLocaleDateString('en-CA')
      if (key.startsWith(pulse.prefix) && key >= todayMT) {
        gaps++
        firstGap ??= key
      }
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  if (gaps === 0) return null

  const rate = pulse.bookedNights > 0 ? pulse.revenue / pulse.bookedNights : 0
  if (rate > 0) {
    const lost = Math.round((rate * gaps) / 10) * 10
    return `Those ${gaps} empty night${gaps !== 1 ? 's' : ''} between stays? About ${dollars(lost)} sitting on the table.`
  }
  return `I've got ${gaps} empty night${gaps !== 1 ? 's' : ''} between stays starting ${fmtDay(firstGap)} — worth a look.`
}

/**
 * The house's full narration — up to three beats, ~2-3 sentences.
 * @param {object} opts
 * @param {object|null} opts.calendarData   — from /api/calendar
 * @param {Array}       opts.expenses       — ledger entries (for revenue matching)
 * @param {string|null} opts.weatherBlurb   — e.g. "Hazy and cold."
 * @param {number}      opts.setupPct       — launch readiness 0-100
 * @param {number}      opts.setupRemaining — launch tasks left
 * @param {string|null} opts.reminderTitle  — top active reminder, if any
 * @returns {string}
 */
export function getHouseNarration({
  calendarData = null,
  expenses = [],
  weatherBlurb = null,
  setupPct = 100,
  setupRemaining = 0,
  reminderTitle = null,
} = {}) {
  // Pre-launch: the house is excited to open
  if (setupPct < 100) {
    if (setupPct >= 85) {
      return `${setupRemaining === 1 ? 'One task' : `${setupRemaining} tasks`} and I'm open for business. Final stretch.`
    }
    return `I'm ${setupPct}% ready for guests — ${setupRemaining} tasks to go. ${weatherBlurb ?? ''}`.trim()
  }

  const todayMT = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
  const stays   = normalizeStays(calendarData)
  const beats   = []

  // Reminders lead — the house keeps the to-do list
  if (reminderTitle) beats.push(`On today's list: ${reminderTitle.replace(/\.+$/, '')}.`)

  beats.push(guestStory(stays, todayMT))

  const pulse = businessPulse(stays, expenses, todayMT)
  const nudge = reminderTitle ? null : gapNudge(stays, pulse, todayMT)
  if (pulse) beats.push(pulse.text + (nudge ? '' : pulse.flourish))

  // Third beat only when there's room: nudge about money on the table,
  // otherwise a touch of weather
  if (nudge) beats.push(nudge)
  else if (!reminderTitle && weatherBlurb) beats.unshift(weatherBlurb)

  return beats.filter(Boolean).join(' ') || getCalmMessage()
}

// ── API ───────────────────────────────────────────────────────────────────────

/**
 * Returns all active updates merged and sorted high-priority first.
 * @param {Array} extraItems — live items from weather/tasks to merge with base updates
 */
export function getActiveUpdates(extraItems = []) {
  return sortByPriority([...extraItems, ...MOCK_UPDATES])
}

/** Sort an update array — high priority first, then as-is. */
export function sortByPriority(updates) {
  return [...updates].sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1
    if (b.priority === 'high' && a.priority !== 'high') return 1
    return 0
  })
}
