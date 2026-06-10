// ── /api/calendar ─────────────────────────────────────────────────────────────
//
// Booking data for the GuestCard calendar.
//
// Two sources, best-first:
//   1. Hospitable Public API (HOSPITABLE_API_KEY set) — full reservation data
//      including real financials: revenue per booking, nightly rate, guest count.
//   2. Hospitable iCal feed (HOSPITABLE_ICAL_URL) — names + dates only. Used as
//      a fallback if no API key is configured or the API call fails.
//
// Response shape (superset — iCal bookings simply lack the financial fields):
// {
//   current:    booking | null
//   next:       booking | null
//   all:        [ booking... ]
//   upcoming:   [ booking... ]
//   monthCount: number
//   source:     'api' | 'ical'
//   fetchedAt:  ISO string
// }
// booking = { name, firstName, checkIn, checkOut, nights,
//             revenue?, nightlyRate?, guests?, platform?, code? }
//
// Cached 15 min via Cache-Control (Vercel edge cache).

const ICAL_URL = process.env.HOSPITABLE_ICAL_URL
const API_KEY  = process.env.HOSPITABLE_API_KEY
const API_BASE = 'https://public.api.hospitable.com/v2'

// ── Hospitable Public API source ──────────────────────────────────────────────

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Hospitable API ${path} → ${res.status}`)
  return res.json()
}

// Money values come back as { amount: <integer cents>, currency: 'USD' }
function money(m) {
  if (m == null) return null
  if (typeof m === 'number') return m / 100
  if (typeof m.amount === 'number') return m.amount / 100
  return null
}

async function fetchFromApi() {
  // 1. Find the property (single-property account → take the first)
  const props = await apiGet('/properties')
  const property = props?.data?.[0]
  if (!property?.id) throw new Error('No properties returned')

  // 2. Reservations: 3 months back → 12 months ahead, with financials
  const now   = new Date()
  const start = new Date(now); start.setMonth(start.getMonth() - 3)
  const end   = new Date(now); end.setMonth(end.getMonth() + 12)
  const d = dt => dt.toISOString().slice(0, 10)

  const params = new URLSearchParams({
    'start_date': d(start),
    'end_date':   d(end),
    'per_page':   '100',
    'include':    'financials,guest',
  })
  params.append('properties[]', property.id)

  const resv = await apiGet(`/reservations?${params}`)

  const events = (resv?.data ?? [])
    // Only confirmed/active stays — exclude cancellations and declined requests
    .filter(r => ['accepted', 'confirmed', 'checked_in', 'checked_out'].includes(
      (r.reservation_status?.current?.category ?? r.status ?? '').toLowerCase()
    ) || r.status == null)
    .map(r => {
      const checkIn  = new Date(r.arrival_date ?? r.check_in)
      const checkOut = new Date(r.departure_date ?? r.check_out)
      if (isNaN(checkIn) || isNaN(checkOut)) return null

      const nights = r.nights ?? Math.round((checkOut - checkIn) / 86400000)
      const guest  = r.guest ?? {}
      const name   = [guest.first_name, guest.last_name].filter(Boolean).join(' ')
                  || r.guest_name || 'Guest'

      // Host revenue = what actually lands in your pocket for the stay
      const fin     = r.financials ?? {}
      const revenue = money(fin.host?.revenue)
                   ?? money(fin.host?.accommodation)
                   ?? null

      return {
        name,
        firstName: name.split(' ')[0],
        checkIn, checkOut, nights,
        revenue,
        nightlyRate: revenue != null && nights > 0 ? revenue / nights : null,
        guests:   r.guests?.total ?? r.number_of_guests ?? null,
        platform: r.platform ?? null,
        code:     r.code ?? r.confirmation_code ?? null,
      }
    })
    .filter(Boolean)

  events.sort((a, b) => a.checkIn - b.checkIn)
  return events
}

// ── iCal fallback source ──────────────────────────────────────────────────────

// Parse "20260509T160000" in America/Denver (MDT = UTC-6, MST = UTC-7).
// We use a fixed -06:00 offset — close enough for check-in/out display purposes.
function parseIcalDate(str) {
  if (!str || str.length < 8) return null
  const y  = str.slice(0, 4)
  const mo = str.slice(4, 6)
  const d  = str.slice(6, 8)
  if (str.length === 8) {
    return new Date(`${y}-${mo}-${d}T00:00:00-06:00`)
  }
  const h  = str.slice(9, 11)
  const m  = str.slice(11, 13)
  return new Date(`${y}-${mo}-${d}T${h}:${m}:00-06:00`)
}

function parseIcalEvents(icalText) {
  const eventBlocks = icalText.split('BEGIN:VEVENT').slice(1)
  const events = []

  for (const block of eventBlocks) {
    const end = block.indexOf('END:VEVENT')
    const body = end > -1 ? block.slice(0, end) : block
    const unfolded = body.replace(/\r?\n[ \t]/g, '')

    const get = (key) => {
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

    const nights   = Math.round((checkOut - checkIn) / 86400000)
    const namePart = summary.replace(/\s*\([^)]+\)\s*$/, '').trim()

    events.push({
      name: namePart,
      firstName: namePart.split(' ')[0],
      checkIn, checkOut, nights,
    })
  }

  events.sort((a, b) => a.checkIn - b.checkIn)
  return events
}

async function fetchFromIcal() {
  if (!ICAL_URL) throw new Error('HOSPITABLE_ICAL_URL not configured')
  const response = await fetch(ICAL_URL)
  if (!response.ok) throw new Error(`iCal fetch failed: ${response.status}`)
  return parseIcalEvents(await response.text())
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  let events = null
  let source = null

  if (API_KEY) {
    try {
      events = await fetchFromApi()
      source = 'api'
    } catch (err) {
      console.error('[calendar] Hospitable API failed, falling back to iCal:', err?.message)
    }
  }

  if (!events) {
    try {
      events = await fetchFromIcal()
      source = 'ical'
    } catch (err) {
      console.error('[calendar] error:', err?.message)
      return res.status(500).json({ error: 'Failed to fetch calendar' })
    }
  }

  const now = new Date()

  const current  = events.find(e => e.checkIn <= now && now < e.checkOut) ?? null
  const upcoming = events.filter(e => e.checkIn > now)
  const next     = upcoming[0] ?? null

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const monthCount = events.filter(
    e => e.checkIn <= monthEnd && e.checkOut >= monthStart
  ).length

  const serialize = (e) => e ? {
    ...e,
    checkIn:  e.checkIn.toISOString(),
    checkOut: e.checkOut.toISOString(),
  } : null

  res.setHeader('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.json({
    current:    serialize(current),
    next:       serialize(next),
    all:        events.map(serialize),
    upcoming:   upcoming.map(serialize),
    monthCount,
    source,
    fetchedAt:  new Date().toISOString(),
  })
}
