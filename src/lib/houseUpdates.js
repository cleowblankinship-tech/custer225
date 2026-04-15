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
// Rotates daily by day-of-year so the message feels fresh without being random.

const CALM_MESSAGES = [
  "Quiet day at home.",
  "Everything looks good.",
  "Nothing urgent right now.",
  "All clear today.",
  "Looking good from here.",
  "Smooth sailing today.",
  "No issues to report.",
]

/**
 * Returns a calm-state message that rotates once per day.
 * @returns {string}
 */
export function getCalmMessage() {
  const start   = new Date(new Date().getFullYear(), 0, 0).getTime()
  const dayOfYear = Math.floor((Date.now() - start) / 86400000)
  return CALM_MESSAGES[dayOfYear % CALM_MESSAGES.length]
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
