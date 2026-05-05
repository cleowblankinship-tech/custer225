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
    '--bg':             '#F7F0E6',
    '--bg2':            '#EEE5D4',
    '--text':           '#1A1208',
    '--text2':          '#6B5C48',
    '--text3':          '#A89880',
    '--accent':         '#CF541C',
    '--accent-light':   '#FAEDE9',
    '--border':         'rgba(0,0,0,0.08)',
    '--border-mid':     'rgba(0,0,0,0.13)',
    '--surface-strong': '#2B1810',
  },
  day: {
    '--bg':             '#FAFAF8',
    '--bg2':            '#F2F0EC',
    '--text':           '#1A1A1A',
    '--text2':          '#888880',
    '--text3':          '#BBBBBB',
    '--accent':         '#C05538',
    '--accent-light':   '#FAEDE9',
    '--border':         'rgba(0,0,0,0.08)',
    '--border-mid':     'rgba(0,0,0,0.12)',
    '--surface-strong': '#2B1F1A',
  },
  evening: {
    '--bg':             '#F0E0C8',
    '--bg2':            '#E6D4B8',
    '--text':           '#1A1208',
    '--text2':          '#7A5E40',
    '--text3':          '#B09070',
    '--accent':         '#B84C18',
    '--accent-light':   '#F7E0D0',
    '--border':         'rgba(0,0,0,0.10)',
    '--border-mid':     'rgba(0,0,0,0.15)',
    '--surface-strong': '#2B1810',
  },
  night: {
    '--bg':             '#2B1F1A',
    '--bg2':            '#352820',
    '--text':           '#F2EDBD',
    '--text2':          '#C4A078',
    '--text3':          '#8A6850',
    '--accent':         '#C85030',
    '--accent-light':   '#4A2520',
    '--border':         'rgba(255,255,255,0.08)',
    '--border-mid':     'rgba(255,255,255,0.13)',
    '--surface-strong': '#1A1208',
  },
}

// ── Weather overrides ─────────────────────────────────────────────────────────
//
// Partial objects — only tokens that change are listed.
// Merged over the base palette for the current time-of-day.

const WEATHER = {
  clear: {},   // no overrides; pure base palette

  cloudy: {
    morning: { '--bg': '#F0ECE4', '--bg2': '#E6E0D4' },
    day:     { '--bg': '#F4F4F0', '--bg2': '#EBEBEA' },
    evening: { '--bg': '#ECE0C8', '--bg2': '#E0D4B4' },
    night:   { '--bg': '#272020', '--bg2': '#322822' },
  },

  rain: {
    morning: { '--bg': '#EEE8E2', '--bg2': '#E4DCD4', '--text2': '#6A5C50' },
    day:     { '--bg': '#F2F0EE', '--bg2': '#EAEAE6' },
    evening: { '--bg': '#E8D8C8', '--bg2': '#DED0B8' },
    night:   { '--bg': '#261E1C', '--bg2': '#302520' },
  },

  snow: {
    morning: { '--bg': '#F2F2F4', '--bg2': '#EAEAEE', '--text2': '#707080', '--text3': '#A0A0B0' },
    day:     { '--bg': '#F8F8FC', '--bg2': '#F0F0F8', '--text2': '#888898', '--text3': '#AAAABB' },
    evening: { '--bg': '#E8E0D8', '--bg2': '#DDD8D0', '--text2': '#807068' },
    night:   { '--bg': '#242430', '--bg2': '#2E2C3A' },
  },

  cold: {
    morning: { '--bg': '#F2ECE4', '--bg2': '#E8E0D4', '--accent': '#B84820' },
    day:     { '--bg': '#F6F4F0', '--bg2': '#EEECEA' },
    evening: { '--bg': '#EAD8C0', '--bg2': '#E0CCB0' },
    night:   { '--bg': '#252020', '--bg2': '#302828' },
  },

  storm: {
    morning: { '--bg': '#E8E0D8', '--bg2': '#DDD8D0', '--text2': '#6A5C50' },
    day:     { '--bg': '#F0EDE8', '--bg2': '#E6E2DA' },
    evening: { '--bg': '#DED0B8', '--bg2': '#D4C8A8', '--accent': '#A04010' },
    night:   { '--bg': '#201818', '--bg2': '#2A2020', '--accent': '#B84020' },
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
