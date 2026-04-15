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
    "Quiet start to the day.",
    "Nothing pressing this morning.",
    "A calm morning here.",
    "All looks good to start.",
    "Nothing needs attention right now.",
  ],
  afternoon: [
    "Everything's holding steady.",
    "All is in order this afternoon.",
    "Nothing urgent right now.",
    "The house is in good shape.",
    "All clear this afternoon.",
  ],
  evening: [
    "Nothing left hanging today.",
    "The house is settled for the evening.",
    "All is steady this evening.",
    "Everything looks in order.",
    "A quiet evening at home.",
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
