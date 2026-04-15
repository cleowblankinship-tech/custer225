// ── Recurring House Reminder Rules ────────────────────────────────────────────
//
// Defines rules for routines that repeat on a schedule (weekly, biweekly).
// When a rule fires on today's date it produces an update item that flows
// through the existing House Today / speech bubble pipeline unchanged.
//
// Supported cadence types (Phase 1):
//   weekly    — fires on the same weekday every week
//   biweekly  — fires every other week, phase-locked to an anchor date
//
// Weekday uses JS Date.getDay() convention:
//   0 = Sunday  1 = Monday  2 = Tuesday  3 = Wednesday
//   4 = Thursday  5 = Friday  6 = Saturday
//
// To add a new rule: copy one of the entries below and adjust the fields.
// To disable a rule without deleting it: set active: false.

// ── Rule definitions ──────────────────────────────────────────────────────────

export const RECURRING_RULES = [
  {
    id:            'trash-weekly',
    title:         'Trash goes out tonight.',
    type:          'trash',
    cadence_type:  'weekly',
    cadence_config: { weekday: 4 },   // every Thursday
    active:        true,
    start_date:    null,
    end_date:      null,
    notes:         null,
  },
  {
    id:            'recycling-biweekly',
    title:         'Recycling goes out tonight.',
    type:          'recycling',
    cadence_type:  'biweekly',
    cadence_config: {
      weekday:     4,             // Thursday
      anchor_date: '2026-04-16', // a known recycling Thursday — adjust to match
    },                            // your actual collection schedule
    active:        true,
    start_date:    null,
    end_date:      null,
    notes:         null,
  },
]

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Parse a YYYY-MM-DD string into a local midnight Date.
 * Using `new Date('YYYY-MM-DD')` parses as UTC midnight, which shifts the
 * apparent day in timezones west of UTC — this avoids that pitfall.
 */
function localDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// ── Firing logic ──────────────────────────────────────────────────────────────

/**
 * Return true if a rule should fire on the given date string (YYYY-MM-DD).
 *
 * weekly   — fires when the date's weekday matches cadence_config.weekday.
 *
 * biweekly — fires when the weekday matches AND the date is an exact multiple
 *            of 14 days from the anchor_date (in either direction), so the
 *            phase is always correct regardless of what date you start from.
 *
 * @param {Object} rule
 * @param {string} dateStr  YYYY-MM-DD
 * @returns {boolean}
 */
function ruleFiresOn(rule, dateStr) {
  if (!rule.active) return false
  if (rule.start_date && dateStr < rule.start_date) return false
  if (rule.end_date   && dateStr > rule.end_date)   return false

  const d = localDate(dateStr)

  if (rule.cadence_type === 'weekly') {
    return d.getDay() === rule.cadence_config.weekday
  }

  if (rule.cadence_type === 'biweekly') {
    const { weekday, anchor_date } = rule.cadence_config
    // Fast exit — wrong weekday
    if (d.getDay() !== weekday) return false
    // Check phase: difference from anchor must be a multiple of 14
    const anchor   = localDate(anchor_date)
    const diffDays = Math.round((d - anchor) / 86_400_000)
    return Math.abs(diffDays) % 14 === 0
  }

  return false
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Evaluate all (or the supplied) rules against a date and return update items
 * that are compatible with getActiveUpdates() in houseUpdates.js.
 *
 * @param {string} dateStr   YYYY-MM-DD — the date to evaluate (usually today)
 * @param {Array}  rules     Defaults to the exported RECURRING_RULES
 * @returns {Array}          Zero or more update item objects
 */
export function getRecurringRemindersForDate(dateStr, rules = RECURRING_RULES) {
  return rules
    .filter(rule => ruleFiresOn(rule, dateStr))
    .map(rule => ({
      id:       `recurring-${rule.id}`,
      type:     'reminder',
      priority: 'normal',
      title:    rule.title,
      detail:   rule.notes ?? null,
      source:   'recurring',      // distinguishes these from manual task reminders
      ruleId:   rule.id,
    }))
}
