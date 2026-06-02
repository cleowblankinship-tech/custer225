// ── /api/calendar ─────────────────────────────────────────────────────────────
//
// Fetches the Hospitable iCal feed server-side (avoids CORS), parses VEVENT
// blocks, and returns structured booking data for the GuestCard component.
//
// Response shape:
// {
//   current:    { name, firstName, checkIn, checkOut, nights } | null
//   next:       { name, firstName, checkIn, checkOut, nights } | null
//   upcoming:   [ ...same shape, up to 3 future bookings ]
//   monthCount: number  — bookings that overlap the current calendar month
//   fetchedAt:  ISO string
// }
//
// Cached 15 min via Cache-Control (Vercel edge cache).
// iCal URL stored in HOSPITABLE_ICAL_URL env var.

const ICAL_URL = process.env.HOSPITABLE_ICAL_URL

// Parse "20260509T160000" in America/Denver (MDT = UTC-6, MST = UTC-7).
// We use a fixed -06:00 offset — close enough for check-in/out display purposes.
function parseIcalDate(str) {
  if (!str || str.length < 8) return null
  const y  = str.slice(0, 4)
  const mo = str.slice(4, 6)
  const d  = str.slice(6, 8)
  if (str.length === 8) {
    // DATE only (no time) — treat as midnight MT
    return new Date(`${y}-${mo}-${d}T00:00:00-06:00`)
  }
  const h  = str.slice(9, 11)
  const m  = str.slice(11, 13)
  return new Date(`${y}-${mo}-${d}T${h}:${m}:00-06:00`)
}

function parseEvents(icalText) {
  const eventBlocks = icalText.split('BEGIN:VEVENT').slice(1)
  const events = []

  for (const block of eventBlocks) {
    const end = block.indexOf('END:VEVENT')
    const body = end > -1 ? block.slice(0, end) : block

    // Unfold continued lines (RFC 5545: lines starting with space/tab are continuations)
    const unfolded = body.replace(/\r?\n[ \t]/g, '')

    const get = (key) => {
      // Matches KEY: or KEY;...: variants
      const m = unfolded.match(new RegExp(`${key}[^:]*:(.+)`))
      return m ? m[1].trim() : null
    }

    const summary  = get('SUMMARY')
    const dtstart  = get('DTSTART')
    const dtend    = get('DTEND')

    if (!summary || !dtstart || !dtend) continue

    const checkIn  = parseIcalDate(dtstart)
    const checkOut = parseIcalDate(dtend)
    if (!checkIn || !checkOut) continue

    const nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24))

    // Extract first name from "Full Name (CODE)" format
    const namePart  = summary.replace(/\s*\([^)]+\)\s*$/, '').trim()
    const firstName = namePart.split(' ')[0]

    events.push({ name: namePart, firstName, checkIn, checkOut, nights })
  }

  events.sort((a, b) => a.checkIn - b.checkIn)
  return events
}

export default async function handler(req, res) {
  if (!ICAL_URL) {
    return res.status(500).json({ error: 'HOSPITABLE_ICAL_URL not configured' })
  }

  try {
    const response = await fetch(ICAL_URL)
    if (!response.ok) {
      return res.status(502).json({ error: `iCal fetch failed: ${response.status}` })
    }

    const icalText = await response.text()
    const events   = parseEvents(icalText)
    const now      = new Date()

    // Classify bookings
    const current  = events.find(e => e.checkIn <= now && now < e.checkOut) ?? null
    const upcoming = events.filter(e => e.checkIn > now)
    const next     = upcoming[0] ?? null

    // Monthly count: bookings that overlap the current calendar month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const monthCount = events.filter(
      e => e.checkIn <= monthEnd && e.checkOut >= monthStart
    ).length

    // Serialize dates as ISO strings for JSON transport
    const serialize = (e) => e ? {
      name:      e.name,
      firstName: e.firstName,
      checkIn:   e.checkIn.toISOString(),
      checkOut:  e.checkOut.toISOString(),
      nights:    e.nights,
    } : null

    res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json({
      current:    serialize(current),
      next:       serialize(next),
      upcoming:   upcoming.slice(0, 3).map(serialize),
      monthCount,
      fetchedAt:  new Date().toISOString(),
    })
  } catch (err) {
    console.error('[calendar] error:', err?.message)
    res.status(500).json({ error: 'Failed to fetch calendar' })
  }
}
