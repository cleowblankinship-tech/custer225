// ── Weather — OpenWeatherMap (Layer 3) ────────────────────────────────────────
//
// Requires two things to activate:
//   1. VITE_OWM_KEY in your .env file  (free at openweathermap.org/api)
//   2. VITE_PROPERTY_LAT and VITE_PROPERTY_LON in your .env file
//
// While those vars are missing this module returns [] silently — the home
// screen never breaks, it just shows the mock updates from houseUpdates.js.
//
// Refresh cadence: App.jsx polls this every 30 minutes.

const LAT = import.meta.env.VITE_PROPERTY_LAT
const LON = import.meta.env.VITE_PROPERTY_LON
const KEY = import.meta.env.VITE_OWM_KEY

function isConfigured() {
  return !!(LAT && LON && KEY)
}

// ── Thresholds ────────────────────────────────────────────────────────────────

const FREEZE_HARD_F  = 28   // hard freeze  → high priority
const FREEZE_LIGHT_F = 36   // light freeze → normal priority
const WIND_HIGH_MPH  = 40   // damaging wind → high priority
const WIND_BREEZY_MPH = 25  // breezy → normal priority

// ── Fetcher ───────────────────────────────────────────────────────────────────

export async function fetchWeatherConditions() {
  if (!isConfigured()) return []

  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${LAT}&lon=${LON}&units=imperial&appid=${KEY}`

  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const w = await res.json()

    const updates = []
    const low     = Math.round(w.main.temp_min)
    const windMph = Math.round(w.wind.speed)

    // ── Freeze warning ────────────────────────────────────────────────────
    if (low <= FREEZE_LIGHT_F) {
      const isHard = low <= FREEZE_HARD_F
      updates.push({
        id:       'owm-freeze',
        type:     'alert',
        priority: isHard ? 'high' : 'normal',
        title:    `Low of ${low}°F tonight`,
        detail:   isHard
          ? 'Hard freeze expected. Drain sprinkler lines and bring in porch plants before dark.'
          : 'Light freeze possible tonight. Consider covering sensitive plants.',
      })
    }

    // ── High wind ─────────────────────────────────────────────────────────
    if (windMph >= WIND_BREEZY_MPH) {
      const isHigh = windMph >= WIND_HIGH_MPH
      updates.push({
        id:       'owm-wind',
        type:     'alert',
        priority: isHigh ? 'high' : 'normal',
        title:    `${isHigh ? 'High winds' : 'Breezy'} — ${windMph} mph`,
        detail:   isHigh
          ? 'Secure patio furniture and check the fence gate before it gets worse.'
          : 'Patio items may shift. Quick check recommended.',
      })
    }

    // ── Thunderstorm ──────────────────────────────────────────────────────
    const weatherId = w.weather?.[0]?.id ?? 0
    if (weatherId >= 200 && weatherId < 300) {
      updates.push({
        id:       'owm-storm',
        type:     'alert',
        priority: 'high',
        title:    'Thunderstorm in the area',
        detail:   'Close windows, bring in patio items, and avoid running irrigation.',
      })
    }

    // ── Heavy rain ────────────────────────────────────────────────────────
    if (weatherId >= 500 && weatherId < 502) {
      updates.push({
        id:       'owm-rain',
        type:     'alert',
        priority: 'normal',
        title:    'Heavy rain today',
        detail:   'Check gutters and make sure the side gate is latched.',
      })
    }

    return updates
  } catch (err) {
    console.warn('[weather] fetch failed silently:', err.message)
    return []
  }
}
