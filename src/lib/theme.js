// ── theme.js — Dynamic color system ───────────────────────────────────────────
//
// Time-of-day → CSS variable map.
// Applied to document.documentElement so every var(--token) auto-updates.
//
// Time bands:
//   morning  5am – 10am   warm amber header, pale yellow background
//   day     10am –  5pm   bright yellow header, warm cream background
//   evening  5pm –  9pm   coral/pink header, deep purple background
//   night    9pm –  5am   deep navy, yellow accent
//
// Usage:
//   import { getTimeOfDay, getTheme, applyTheme } from './theme'
//   applyTheme(getTheme({ timeOfDay: getTimeOfDay() }))

export function getTimeOfDay() {
  const h = new Date().getHours()
  if (h >= 5  && h < 10) return 'morning'
  if (h >= 10 && h < 17) return 'day'
  if (h >= 17 && h < 21) return 'evening'
  return 'night'
}

// ── Base palettes ─────────────────────────────────────────────────────────────

const BASE = {
  // Pale dawn cream with a marigold header — the house waking up
  morning: {
    '--bg':             '#FAF6EC',
    '--bg2':            '#F4ECD8',
    '--text':           '#2E2A24',
    '--text2':          '#5C5040',
    '--text3':          '#A08F72',
    '--accent':         '#C05538',
    '--accent-light':   '#F6E2D6',
    '--border':         'rgba(92,62,34,0.09)',
    '--border-mid':     'rgba(92,62,34,0.16)',
    '--surface-strong': '#2E2A24',
    '--bubble-bg':      '#FFFCF2',
    '--bubble-border':  'rgba(92,62,34,0.10)',
    '--bubble-sub':     '#7A6F60',
    '--header-bg':      '#E3B23C',
    '--header-text':    '#3A2D10',
    '--header-sub':     'rgba(58,45,16,0.55)',
    '--plum':           '#8A6480',
    '--plum-bg':        '#EFE3EC',
    '--green':          '#5C7A4E',
    '--green-bg':       '#E9EFE0',
    '--blue':           '#6F4C66',
    '--blue-bg':        '#EFE3EC',
    '--gold':           '#9C7714',
    '--gold-bg':        '#F9EFD2',
    '--red':            '#BC4A31',
    '--red-bg':         '#F9E3DB',
  },
  // Warm cream daylight with the terracotta brand header
  day: {
    '--bg':             '#F8F4EC',
    '--bg2':            '#F1E9DB',
    '--text':           '#2E2A24',
    '--text2':          '#5C5347',
    '--text3':          '#9A8C76',
    '--accent':         '#C05538',
    '--accent-light':   '#F6E2D6',
    '--border':         'rgba(92,62,34,0.09)',
    '--border-mid':     'rgba(92,62,34,0.16)',
    '--surface-strong': '#2E2A24',
    '--bubble-bg':      '#FFFCF5',
    '--bubble-border':  'rgba(92,62,34,0.10)',
    '--bubble-sub':     '#7A6F60',
    '--header-bg':      '#C05538',
    '--header-text':    '#FFF6EA',
    '--header-sub':     'rgba(255,246,234,0.65)',
    '--plum':           '#8A6480',
    '--plum-bg':        '#EFE3EC',
    '--green':          '#5C7A4E',
    '--green-bg':       '#E9EFE0',
    '--blue':           '#6F4C66',
    '--blue-bg':        '#EFE3EC',
    '--gold':           '#9C7714',
    '--gold-bg':        '#F9EFD2',
    '--red':            '#BC4A31',
    '--red-bg':         '#F9E3DB',
  },
  // Dusty-plum dusk — muted, storybook twilight, never neon
  evening: {
    '--bg':             '#2E2433',
    '--bg2':            '#3B2F41',
    '--text':           '#F4ECE2',
    '--text2':          '#C9B8C2',
    '--text3':          '#93829A',
    '--accent':         '#D9806A',
    '--accent-light':   '#4A3340',
    '--border':         'rgba(244,236,226,0.10)',
    '--border-mid':     'rgba(244,236,226,0.18)',
    '--surface-strong': '#201826',
    '--bubble-bg':      '#F7EFE3',
    '--bubble-border':  'rgba(80,60,80,0.28)',
    '--bubble-sub':     '#75645F',
    '--header-bg':      '#6F4C66',
    '--header-text':    '#F7EFE3',
    '--header-sub':     'rgba(247,239,227,0.60)',
    '--plum':           '#C2A0B8',
    '--plum-bg':        '#41304A',
    '--green':          '#9BBA85',
    '--green-bg':       '#2C3A24',
    '--blue':           '#C2A0B8',
    '--blue-bg':        '#41304A',
    '--gold':           '#E3B23C',
    '--gold-bg':        '#423414',
    '--red':            '#E08A70',
    '--red-bg':         '#4A2A20',
  },
  // Warm charcoal night, lit by a marigold lantern glow
  night: {
    '--bg':             '#211C17',
    '--bg2':            '#2C2620',
    '--text':           '#F2EADC',
    '--text2':          '#BCAE98',
    '--text3':          '#847763',
    '--accent':         '#E3B23C',
    '--accent-light':   '#463816',
    '--border':         'rgba(242,234,220,0.10)',
    '--border-mid':     'rgba(242,234,220,0.18)',
    '--surface-strong': '#16120E',
    '--bubble-bg':      '#F2EADC',
    '--bubble-border':  'rgba(120,100,70,0.28)',
    '--bubble-sub':     '#6E6354',
    '--header-bg':      '#211C17',
    '--header-text':    '#E3B23C',
    '--header-sub':     'rgba(227,178,60,0.55)',
    '--plum':           '#C2A0B8',
    '--plum-bg':        '#382B36',
    '--green':          '#9BBA85',
    '--green-bg':       '#2A3520',
    '--blue':           '#C2A0B8',
    '--blue-bg':        '#382B36',
    '--gold':           '#E3B23C',
    '--gold-bg':        '#403310',
    '--red':            '#E08A70',
    '--red-bg':         '#44261C',
  },
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getTheme({ timeOfDay } = {}) {
  const tod = timeOfDay ?? getTimeOfDay()
  return { ...BASE[tod] ?? BASE.day }
}

export function applyTheme(theme) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(theme)) {
    root.style.setProperty(key, value)
  }
}
