// ── Booking Notifications ──────────────────────────────────────────────────────
//
// Detects new Airbnb/Hospitable bookings by comparing the live calendar feed
// against a localStorage cache of previously-seen booking keys.
//
// Two notification channels:
//   1. House speech bubble — injects a short-lived update item
//   2. Browser push notification — fires via the Notification API (PWA)

const SEEN_KEY = 'custer225_seen_bookings_v1'

/** Stable key for a booking — checkIn ISO + guest name. */
function bookingKey(b) {
  return `${b.checkIn}::${b.name}`
}

/** Return the set of previously-seen booking keys from localStorage. */
function getSeenKeys() {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

/** Persist the seen-keys set. */
function saveSeenKeys(keys) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...keys]))
  } catch {}
}

/**
 * Compare a fresh booking list against the cache.
 * Returns bookings that weren't in the cache and marks them as seen.
 * On the very first run (empty cache) we seed the cache without treating
 * existing bookings as "new" — avoids a burst of stale notifications.
 *
 * @param {Array} bookings — all bookings from /api/calendar (data.all)
 * @returns {Array} newly-seen bookings (empty on first run)
 */
export function checkForNewBookings(bookings) {
  if (!bookings?.length) return []

  const seen    = getSeenKeys()
  const isFirst = seen.size === 0

  const newOnes = isFirst ? [] : bookings.filter(b => !seen.has(bookingKey(b)))

  // Seed / update the cache
  const updated = new Set(seen)
  for (const b of bookings) updated.add(bookingKey(b))
  saveSeenKeys(updated)

  return newOnes
}

// ── Browser push notifications ─────────────────────────────────────────────────

/** Request Notification permission. Returns 'granted' | 'denied' | 'default'. */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

/** Current permission state without prompting. */
export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

/**
 * Fire a browser notification for a new booking.
 * @param {{ name: string, checkIn: string, checkOut: string, nights: number }} booking
 */
export function sendBookingNotification(booking) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-US', {
    timeZone:  'America/Denver',
    month:     'short',
    day:       'numeric',
  })
  const checkOutDate = new Date(booking.checkOut).toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    month:    'short',
    day:      'numeric',
  })

  const nights = `${booking.nights} night${booking.nights !== 1 ? 's' : ''}`

  new Notification('New booking — 225 Custer', {
    body: `${booking.name} · ${checkInDate}–${checkOutDate} (${nights})`,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag:  `booking-${bookingKey(booking)}`,  // deduplicate
  })
}

/**
 * Build a house-update item for a new booking.
 * Returns an object shaped for getActiveUpdates().
 */
export function buildBookingUpdate(booking) {
  const checkInDate = new Date(booking.checkIn).toLocaleDateString('en-US', {
    timeZone: 'America/Denver',
    month:    'short',
    day:      'numeric',
  })

  return {
    id:       `new-booking-${bookingKey(booking)}`,
    type:     'update',
    priority: 'normal',
    title:    `New booking: ${booking.firstName}, ${checkInDate}`,
    detail:   `${booking.name} · ${booking.nights} night${booking.nights !== 1 ? 's' : ''}`,
    // Auto-dismiss after 30 minutes so the bubble clears itself
    expiresAt: Date.now() + 30 * 60 * 1000,
  }
}
