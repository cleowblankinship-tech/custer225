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

// ── Casual weather blurb ──────────────────────────────────────────────────────
//
// Short, friendly sentence shown in the speech bubble when conditions are normal.
// Phrasing varies so it doesn't feel like a readout.

const BLURB_TEMPLATES = {
  clear:          [`Sunny and {t}° at the property.`, `It's {t}° and clear outside.`, `Clear skies and {t}° right now.`],
  'mostly clear': [`Mostly clear and {t}° outside.`, `It's {t}° with just a few clouds.`, `Mostly sunny at {t}°.`],
  'partly cloudy':[`Partly cloudy and {t}° at the property.`, `It's {t}° and partly cloudy out there.`, `{t}° with some clouds rolling through.`],
  cloudy:         [`Overcast and {t}° outside.`, `It's {t}° and cloudy at the property.`, `Cloudy skies, {t}° right now.`],
  drizzly:        [`A bit drizzly — {t}° out there.`, `Light drizzle and {t}° outside.`],
  rainy:          [`Rainy and {t}° at the property.`, `It's {t}° with rain coming down.`],
  snowy:          [`It's snowing outside — {t}°.`, `Snow coming down, {t}° at the property.`],
  hazy:           [`Hazy and {t}° this morning.`, `It's {t}° with some haze outside.`],
}

function weatherConditionKey(id) {
  if (id === 800)                   return 'clear'
  if (id === 801)                   return 'mostly clear'
  if (id === 802)                   return 'partly cloudy'
  if (id >= 803 && id < 900)        return 'cloudy'
  if (id >= 300 && id < 400)        return 'drizzly'
  if (id >= 500 && id < 600)        return 'rainy'
  if (id >= 600 && id < 700)        return 'snowy'
  if (id >= 700 && id < 800)        return 'hazy'
  return null // storms etc. are already alerts — no casual blurb
}

function buildWeatherBlurb(w) {
  const temp = Math.round(w.main.temp)
  const id   = w.weather?.[0]?.id ?? 800
  const key  = weatherConditionKey(id)
  if (!key) return null

  const pool     = BLURB_TEMPLATES[key] ?? [`It's {t}° outside.`]
  const template = pool[Math.floor(Math.random() * pool.length)]
  return template.replace('{t}', temp)
}

// ── Fetcher ───────────────────────────────────────────────────────────────────
//
// Returns { alerts: Array, blurb: string|null }
//   alerts — same update items as before (freeze, wind, storm, rain)
//   blurb  — casual one-liner for the speech bubble ("Sunny and 72° outside.")
//            null when weather is unavailable or a storm alert is active

export async function fetchWeather() {
  if (!isConfigured()) return { alerts: [], blurb: null }

  const url =
    `https://api.openweathermap.org/data/2.5/weather` +
    `?lat=${LAT}&lon=${LON}&units=imperial&appid=${KEY}`

  try {
    const res = await fetch(url)
    if (!res.ok) return { alerts: [], blurb: null }
    const w = await res.json()

    const alerts  = []
    const low     = Math.round(w.main.temp_min)
    const windMph = Math.round(w.wind.speed)

    // ── Freeze warning ────────────────────────────────────────────────────
    if (low <= FREEZE_LIGHT_F) {
      const isHard = low <= FREEZE_HARD_F
      alerts.push({
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
      alerts.push({
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
      alerts.push({
        id:       'owm-storm',
        type:     'alert',
        priority: 'high',
        title:    'Thunderstorm in the area',
        detail:   'Close windows, bring in patio items, and avoid running irrigation.',
      })
    }

    // ── Heavy rain ────────────────────────────────────────────────────────
    if (weatherId >= 500 && weatherId < 502) {
      alerts.push({
        id:       'owm-rain',
        type:     'alert',
        priority: 'normal',
        title:    'Heavy rain today',
        detail:   'Check gutters and make sure the side gate is latched.',
      })
    }

    // ── Casual blurb — skip if a storm alert is active (redundant) ────────
    const hasStormAlert = alerts.some(a => a.id === 'owm-storm')
    const blurb = hasStormAlert ? null : buildWeatherBlurb(w)

    return { alerts, blurb }
  } catch (err) {
    console.warn('[weather] fetch failed silently:', err.message)
    return { alerts: [], blurb: null }
  }
}

// Keep legacy export name working during any cached imports
export const fetchWeatherConditions = async () => (await fetchWeather()).alerts
