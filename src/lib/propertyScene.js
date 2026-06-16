// ── Property scene state ──────────────────────────────────────────────────────
//
// Derives the storybook world's *maturity* from how established and well-tended
// the property actually is — not points, not achievements. A brand-new listing
// is bare ground and a house; a property with a long booking history, healthy
// earnings, and cash in reserve grows into a thriving little homestead.
//
// The result is read by HouseScene to decide which environment elements exist.
// Nothing here is ever shown as a number or a "level badge" — the world simply
// reflects the work, the way a garden reflects its gardener.
//
// The scene is driven by the property's *history*, not an abstract level:
//   listed       a real listing → the mailbox goes up
//   bookings     each recorded stay plants a flower (a visual record)
//   established  a few stays in → the first tree takes root
//   consistent   operating across several months → garden beds
//   longTerm     a long, steady run → mature trees and abundant wildlife
//
// Also returned:
//   season   spring|summer|autumn|winter, from the real calendar date
//   activity 0–1, how much wildlife/movement (occupancy + a guest in house)
//   level    1–5 coarse summary, kept for continuity (never shown to the user)

import { normalizeStays, computeMonth } from './houseUpdates'
import { computeCashFlow } from './finance'
import { normalizeCategory } from './categories'

export function getSeason(date = new Date()) {
  const m = date.getMonth() // 0–11
  if (m === 11 || m <= 1) return 'winter'
  if (m <= 4)             return 'spring'
  if (m <= 7)             return 'summer'
  return 'autumn'
}

const clamp01 = n => Math.min(Math.max(n, 0), 1)

/**
 * @param {object} ctx — { expenses, calendarData, setupStats }
 * @returns {{ level: number, maturity: number, season: string, activity: number }}
 */
export function getPropertyScene({ expenses = [], calendarData = null, setupStats = null } = {}) {
  const stays  = normalizeStays(calendarData)
  const income = expenses.filter(e => e.entry_type === 'income')
  const revenue = income.reduce((s, e) => s + Number(e.amount), 0)
  const cash    = computeCashFlow(expenses).availableCash

  // ── The property's history — durable, accumulating record ────────────────
  // Each logged booking-revenue entry is a stay you recorded; that's the
  // permanent history a flower can stand for, even after the live calendar
  // window has rolled past. Fall back to the live calendar when nothing's
  // logged yet so a freshly-connected listing still shows life.
  const loggedBookings = income.filter(e => normalizeCategory(e.category) === 'Gross Booking Revenue').length
  const bookings       = Math.max(loggedBookings, stays.length)
  const monthsActive   = new Set(income.map(e => e.date?.slice(0, 7)).filter(Boolean)).size

  const listed      = (setupStats?.pct >= 100) || bookings > 0
  const established = bookings >= 3
  const consistent  = monthsActive >= 3
  const longTerm    = monthsActive >= 9 || bookings >= 15

  // Four signals of a cared-for, established property, each normalized 0–1 and
  // accumulating slowly so the world grows gradually rather than in leaps.
  const roots    = setupStats ? clamp01(setupStats.pct / 100) : 0  // launch readiness
  const history  = clamp01(stays.length / 18)                      // a season-plus of stays
  const earnings = clamp01(revenue / 50000)                        // gross taken in
  const reserves = clamp01(cash / 25000)                           // cash on hand

  const maturity = roots * 0.22 + history * 0.30 + earnings * 0.28 + reserves * 0.20

  // Thresholds climb gradually so the world keeps developing as the property
  // does, and a full, thriving homestead (level 5) is genuinely well-earned.
  let level =
    maturity < 0.10 ? 1 :
    maturity < 0.34 ? 2 :
    maturity < 0.58 ? 3 :
    maturity < 0.78 ? 4 : 5

  // A launched property is at least a tended yard (tree + mailbox), even before
  // it has earned anything — it exists and is open for business.
  if (setupStats?.pct >= 100 && level < 2) level = 2

  // Wildlife and movement track how busy the place is right now.
  const t = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
  const [y, m] = t.split('-').map(Number)
  const occ = stays.length ? computeMonth(stays, expenses, y, m).pct / 100 : 0
  const hasGuest = stays.some(b => b.ci <= t && t < b.co)
  const activity = clamp01(occ * 0.8 + (hasGuest ? 0.2 : 0))

  // A guest arriving in the next couple of days → the property stirs with a
  // little anticipation (livelier wildlife, a more welcoming door).
  const DAY = 86400000
  const arrivingSoon = stays.some(b => {
    if (b.ci <= t) return false
    return (new Date(b.ci) - new Date(t)) / DAY <= 2.5
  })

  return {
    level, maturity, season: getSeason(), activity, arrivingSoon,
    bookings, monthsActive,
    listed, established, consistent, longTerm,
  }
}
