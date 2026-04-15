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

const MOCK_UPDATES = [
  {
    id: 'hw1',
    type: 'alert',
    priority: 'high',
    title: 'Freeze tonight — drain sprinklers',
    detail: 'Low of 28°F expected. Drain the sprinkler lines and bring in porch plants before dark.',
  },
  {
    id: 'hw2',
    type: 'reminder',
    priority: 'normal',
    title: 'Trash goes out tonight',
    detail: 'Bins need to be at the curb by 7 AM tomorrow morning.',
  },
  {
    id: 'hw3',
    type: 'maintenance',
    priority: 'normal',
    title: 'Replace air filter this month',
    detail: 'HVAC filter is due. Size 16×25×1, MERV-8 or higher recommended.',
  },
]

// ── API ───────────────────────────────────────────────────────────────────────

/** Returns all active updates, sorted high-priority first. */
export function getActiveUpdates() {
  // Phase 2: filter by date, fetch from weather API, merge with task reminders, etc.
  return sortByPriority(MOCK_UPDATES)
}

/** Sort an update array — high priority first, then as-is. */
export function sortByPriority(updates) {
  return [...updates].sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1
    if (b.priority === 'high' && a.priority !== 'high') return 1
    return 0
  })
}
