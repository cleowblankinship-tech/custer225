// ── theme.js — Dynamic color system ───────────────────────────────────────────
//
// Time-of-day × weather condition → CSS variable map.
// Applied to document.documentElement so every var(--token) auto-updates.
//
// Time bands:
//   morning  5am – 10am   warm off-white, terracotta accent
//   day     10am –  5pm   neutral off-white (default / design-system baseline)
//   evening  5pm –  9pm   golden amber, slightly deeper accent
//   night    9pm –  5am   deep charcoal, cream text
//
// Weather modifiers are partial overrides merged over the base palette.
// Only tokens that actually change are listed — the rest inherit from base.
//
// Usage:
//   import { getTimeOfDay, getTheme, applyTheme } from './theme'
//   applyTheme(getTheme({ timeOfDay: getTimeOfDay(), weatherCondition }))

// ── Time bands ────────────────────────────────────────────────────────────────

export function getTimeOfDay() {
  const h = new Date().getHours()
  if (h >= 5  && h < 10) return 'morning'
  if (h >= 10 && h < 17) return 'day'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

// ── Base palettes ─────────────────────────────────────────────────────────────

const BASE = {
  morning: {
    '--bg':             '#F6EFE4',
    '--bg2':            '#EDE3D2',
    '--text':           '#1A1208',
    '--text2':          '#504030',
    '--text3':          '#857060',
    '--accent':         '#C84E18',
    '--accent-light':   '#F5E0D4',
    '--border':         'rgba(0,0,0,0.09)',
    '--border-mid':     'rgba(0,0,0,0.14)',
    '--surface-strong': '#2B1810',
    '--bubble-bg':      '#FDFAF5',          // near-white with warm tint
    '--bubble-border':  'rgba(0,0,0,0.10)',
    '--bubble-sub':     '#6E5840',          // readable warm brown on light bubble
  },
  day: {
    '--bg':             '#FAFAF8',
    '--bg2':            '#EEECEA',
    '--text':           '#1A1A1A',
    '--text2':          '#6E6E68',
    '--text3':          '#ABABAB',
    '--accent':         '#C05538',
    '--accent-light':   '#F5E8E4',
    '--border':         'rgba(0,0,0,0.09)',
    '--border-mid':     'rgba(0,0,0,0.13)',
    '--surface-strong': '#2B1F1A',
    '--bubble-bg':      '#FFFFFF',
    '--bubble-border':  'rgba(0,0,0,0.09)',
    '--bubble-sub':     '#888880',
  },
  evening: {
    '--bg':             '#EFE0C6',
    '--bg2':            '#E4D2B0',
    '--text':           '#1A1208',
    '--text2':          '#6A5030',
    '--text3':          '#A88060',
    '--accent':         '#B84C18',
    '--accent-light':   '#F0D8C8',
    '--border':         'rgba(0,0,0,0.11)',
    '--border-mid':     'rgba(0,0,0,0.16)',
    '--surface-strong': '#2A180E',
    '--bubble-bg':      '#FBF5EC',          // warm ivory
    '--bubble-border':  'rgba(0,0,0,0.11)',
    '--bubble-sub':     '#78603A',
  },
  night: {
    '--bg':             '#261A16',
    '--bg2':            '#3D2C25',
    '--text':           '#F7F0E5',
    '--text2':          '#C9A996',
    '--text3':          '#9A7060',
    '--accent':         '#E8622C',
    '--accent-light':   '#5C2E20',
    '--border':         'rgba(247,240,229,0.12)',
    '--border-mid':     'rgba(247,240,229,0.20)',
    '--surface-strong': '#150D09',
    '--bubble-bg':      '#E8E0D5',          // warm parchment — contrasts dark bg, not stark white
    '--bubble-border':  'rgba(160,138,118,0.32)',
    '--bubble-sub':     '#6A5848',          // dark warm brown — readable on parchment
    // Semantic data colors — lighter for readability on dark bg
    '--green':          '#7DC140',
    '--green-bg':       '#1C3010',
    '--blue':           '#68AAE0',
    '--blue-bg':        '#182840',
    '--gold':           '#D4A02A',
    '--gold-bg':        '#2E2010',
  },
}

// ── Weather overrides ─────────────────────────────────────────────────────────
//
// Partial objects — only tokens that change are listed.
// Merged over the base palette for the current time-of-day.

const WEATHER = {
  clear: {},

  cloudy: {
    morning: { '--bg': '#F2EDE4', '--bg2': '#E8E0D0' },
    day:     { '--bg': '#F4F4F0', '--bg2': '#EAEAE6' },
    evening: { '--bg': '#EAD8C0', '--bg2': '#DFD0AC' },
    night:   { '--bg': '#2D2220', '--bg2': '#3D2E28' },
  },

  rain: {
    morning: { '--bg': '#EDE8E2', '--bg2': '#E2DBD2' },
    day:     { '--bg': '#F3F2F0', '--bg2': '#EAEAE8' },
    evening: { '--bg': '#EAD8C2', '--bg2': '#DFCFAC' },
    night:   { '--bg': '#2A2020', '--bg2': '#382A24' },
  },

  snow: {
    morning: { '--bg': '#F2F2F4', '--bg2': '#E8E8EE', '--text2': '#686878', '--text3': '#9898A8' },
    day:     { '--bg': '#F6F6FA', '--bg2': '#EEEEF4', '--text2': '#78787E', '--text3': '#A0A0AA' },
    evening: { '--bg': '#EAE0D5', '--bg2': '#DED6CA', '--text2': '#7A6858' },
    night:   { '--bg': '#272330', '--bg2': '#332E3C' },
  },

  cold: {
    morning: { '--bg': '#F2EDE2', '--bg2': '#E8E0D0' },
    day:     { '--bg': '#F6F5F2', '--bg2': '#EEECE8' },
    evening: { '--bg': '#EAD8BC', '--bg2': '#DFCEA8' },
    night:   { '--bg': '#282020', '--bg2': '#382A28' },
  },

  storm: {
    morning: { '--bg': '#EAE2D8', '--bg2': '#DFDAD0' },
    day:     { '--bg': '#F1EEE8', '--bg2': '#E8E4DC' },
    evening: { '--bg': '#E0D0B4', '--bg2': '#D8C8A4', '--accent': '#A83C10' },
    night:   { '--bg': '#221A18', '--bg2': '#302420', '--accent': '#CC4818' },
  },
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns a complete CSS-variable map for the given time+weather combination.
 * @param {{ timeOfDay?: string, weatherCondition?: string }} options
 */
export function getTheme({ timeOfDay, weatherCondition = 'clear' } = {}) {
  const tod      = timeOfDay ?? getTimeOfDay()
  const base     = { ...BASE[tod] ?? BASE.day }
  const override = WEATHER[weatherCondition]?.[tod] ?? {}
  return { ...base, ...override }
}

/**
 * Stamps the theme onto document.documentElement as inline custom properties.
 * @property declarations in index.css enable CSS transitions between calls.
 */
export function applyTheme(theme) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(key, value)
  }
}
