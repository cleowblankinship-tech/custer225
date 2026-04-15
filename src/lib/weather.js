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

// ── Weather observation blurb ─────────────────────────────────────────────────
//
// A short observation shown in the speech bubble. Reads like a comment,
// not a data readout. Uses qualitative temp labels instead of raw numbers.

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Qualitative temperature label. */
function tempLabel(t) {
  if (t < 32) return 'freezing'
  if (t < 45) return 'cold'
  if (t < 58) return 'cool'
  if (t < 72) return 'mild'
  if (t < 85) return 'warm'
  return 'hot'
}

/** Time-of-day word for phrasing variety. */
function timeWord() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

const BLURB_TEMPLATES = {
  clear: [
    'Clear and {label} outside.',
    'Clear skies. {Label} {time}.',
    '{Label} and clear right now.',
    'Sunny and {label} at the property.',
  ],
  'mostly clear': [
    'Mostly clear. {Label} {time}.',
    'A few clouds, otherwise clear.',
    '{Label} with clear skies holding.',
  ],
  'partly cloudy': [
    'Partly cloudy and {label} outside.',
    '{Label} with some clouds today.',
    'Mixed skies. {Label} right now.',
  ],
  cloudy: [
    'Overcast and {label} outside.',
    '{Label} and grey today.',
    'Cloudy skies. {Label} out there.',
    'Overcast. {Label} {time}.',
  ],
  drizzly: [
    'Light drizzle outside. {Label}.',
    'Damp and {label} right now.',
    'A bit of drizzle. {Label} out there.',
  ],
  rainy: [
    'Rain outside. {Label} {time}.',
    'Wet and {label} at the property.',
    'Raining. {Label} conditions outside.',
  ],
  snowy: [
    'Snow outside. {Label} tonight.',
    'Winter conditions. {Label} right now.',
    'It is snowing. {Label} out there.',
  ],
  hazy: [
    'Hazy and {label} outside.',
    'Low visibility. {Label} {time}.',
    'Some haze. {Label} right now.',
  ],
}

function weatherConditionKey(id) {
  if (id === 800)            return 'clear'
  if (id === 801)            return 'mostly clear'
  if (id === 802)            return 'partly cloudy'
  if (id >= 803 && id < 900) return 'cloudy'
  if (id >= 300 && id < 400) return 'drizzly'
  if (id >= 500 && id < 600) return 'rainy'
  if (id >= 600 && id < 700) return 'snowy'
  if (id >= 700 && id < 800) return 'hazy'
  return null
}

function buildWeatherBlurb(w) {
  const temp = Math.round(w.main.temp)
  const id   = w.weather?.[0]?.id ?? 800
  const key  = weatherConditionKey(id)
  if (!key) return null

  const pool     = BLURB_TEMPLATES[key] ?? ['{Label} outside.']
  const template = pickRandom(pool)
  const label    = tempLabel(temp)
  const Label    = label.charAt(0).toUpperCase() + label.slice(1)
  const time     = timeWord()

  return template
    .replace('{label}', label)
    .replace('{Label}', Label)
    .replace('{time}',  time)
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
        title:    isHard
          ? pickRandom([
              'Hard freeze tonight. Sprinklers need attention.',
              'Freeze warning. Pipes would prefer preparation.',
              `Below ${low}°F tonight. Worth preparing for.`,
            ])
          : pickRandom([
              `Light freeze possible. ${low}°F tonight.`,
              'Cold enough to matter tonight.',
              `${low}°F low tonight. Worth a look outside.`,
            ]),
        detail:   isHard
          ? 'Drain the sprinkler lines and bring in porch plants before dark.'
          : 'Cover sensitive plants if you have them.',
      })
    }

    // ── High wind ─────────────────────────────────────────────────────────
    if (windMph >= WIND_BREEZY_MPH) {
      const isHigh = windMph >= WIND_HIGH_MPH
      alerts.push({
        id:       'owm-wind',
        type:     'alert',
        priority: isHigh ? 'high' : 'normal',
        title:    isHigh
          ? pickRandom([
              'High winds incoming. Secure anything loose outside.',
              `${windMph} mph winds. Check the patio.`,
              'Damaging wind possible. Handle the outdoor furniture.',
            ])
          : pickRandom([
              `Breezy today. ${windMph} mph.`,
              'Wind picking up. Nothing serious yet.',
              'A little breezy outside. Patio items may shift.',
            ]),
        detail:   isHigh
          ? 'Secure patio furniture and check the fence gate before it gets worse.'
          : 'Patio items may shift. A quick check is enough.',
      })
    }

    // ── Thunderstorm ──────────────────────────────────────────────────────
    const weatherId = w.weather?.[0]?.id ?? 0
    if (weatherId >= 200 && weatherId < 300) {
      alerts.push({
        id:       'owm-storm',
        type:     'alert',
        priority: 'high',
        title:    pickRandom([
          'Thunderstorm in the area.',
          'Storm nearby. Close the windows.',
          'Thunderstorm. Bring the patio furniture in.',
        ]),
        detail:   'Close windows, secure outdoor items, and avoid running irrigation.',
      })
    }

    // ── Heavy rain ────────────────────────────────────────────────────────
    if (weatherId >= 500 && weatherId < 502) {
      alerts.push({
        id:       'owm-rain',
        type:     'alert',
        priority: 'normal',
        title:    pickRandom([
          'Heavy rain today.',
          'Rain coming down. Gutters worth checking.',
          'Wet outside. Make sure the gate is latched.',
        ]),
        detail:   'Check the gutters and make sure the side gate is latched.',
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
