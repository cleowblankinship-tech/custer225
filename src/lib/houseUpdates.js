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
