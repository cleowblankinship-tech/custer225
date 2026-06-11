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
  morning: {
    '--bg':             '#FAF7F0',
    '--bg2':            '#F0EAD8',
    '--text':           '#0F0A00',
    '--text2':          '#5A4620',
    '--text3':          '#9A8460',
    '--accent':         '#C05538',
    '--accent-light':   '#F8E4D7',
    '--border':         'rgba(15,10,0,0.09)',
    '--border-mid':     'rgba(15,10,0,0.16)',
    '--surface-strong': '#1A0C00',
    '--bubble-bg':      '#FFFDF0',
    '--bubble-border':  'rgba(15,10,0,0.10)',
    '--bubble-sub':     '#7A6040',
    '--header-bg':      '#F5A020',
    '--header-text':    '#0F0A00',
    '--header-sub':     'rgba(15,10,0,0.52)',
    '--green':          '#3A7A18',
    '--green-bg':       '#EAF5D8',
    '--blue':           '#1A68B8',
    '--blue-bg':        '#E4F0FA',
    '--gold':           '#B87C00',
    '--gold-bg':        '#FEF3C8',
    '--red':            '#C43030',
    '--red-bg':         '#FDEAEA',
  },
  day: {
    '--bg':             '#F8F3EA',
    '--bg2':            '#F0E8DA',
    '--text':           '#1A140C',
    '--text2':          '#4C4435',
    '--text3':          '#94876E',
    '--accent':         '#C05538',
    '--accent-light':   '#F8E4D7',
    '--border':         'rgba(74,52,30,0.10)',
    '--border-mid':     'rgba(74,52,30,0.17)',
    '--surface-strong': '#1F180E',
    '--bubble-bg':      '#FFFDF8',
    '--bubble-border':  'rgba(74,52,30,0.10)',
    '--bubble-sub':     '#75695A',
    '--header-bg':      '#F5D800',
    '--header-text':    '#0A0A08',
    '--header-sub':     'rgba(10,10,8,0.48)',
    '--green':          '#2E7A10',
    '--green-bg':       '#E6F5D6',
    '--blue':           '#1660B0',
    '--blue-bg':        '#E2EEF8',
    '--gold':           '#A87000',
    '--gold-bg':        '#FEF2C0',
    '--red':            '#C22828',
    '--red-bg':         '#FCEAEA',
  },
  evening: {
    '--bg':             '#18082A',
    '--bg2':            '#261040',
    '--text':           '#F0E8FF',
    '--text2':          '#C0A8D8',
    '--text3':          '#907898',
    '--accent':         '#F040A0',
    '--accent-light':   '#4A0830',
    '--border':         'rgba(240,232,255,0.10)',
    '--border-mid':     'rgba(240,232,255,0.18)',
    '--surface-strong': '#0A0218',
    '--bubble-bg':      '#EEE0FF',
    '--bubble-border':  'rgba(180,140,200,0.30)',
    '--bubble-sub':     '#705880',
    '--header-bg':      '#F040A0',
    '--header-text':    '#FFF0F8',
    '--header-sub':     'rgba(255,240,248,0.55)',
    '--green':          '#7DC140',
    '--green-bg':       '#1C3010',
    '--blue':           '#68AAE0',
    '--blue-bg':        '#182840',
    '--gold':           '#D4A02A',
    '--gold-bg':        '#2E2010',
    '--red':            '#E05050',
    '--red-bg':         '#3A1010',
  },
  night: {
    '--bg':             '#0D1117',
    '--bg2':            '#161C2A',
    '--text':           '#F0ECD8',
    '--text2':          '#A09880',
    '--text3':          '#605848',
    '--accent':         '#F5D800',
    '--accent-light':   '#353000',
    '--border':         'rgba(240,236,216,0.10)',
    '--border-mid':     'rgba(240,236,216,0.18)',
    '--surface-strong': '#06080E',
    '--bubble-bg':      '#F0ECD8',
    '--bubble-border':  'rgba(180,160,120,0.28)',
    '--bubble-sub':     '#6A6050',
    '--header-bg':      '#0D1117',
    '--header-text':    '#F5D800',
    '--header-sub':     'rgba(245,216,0,0.52)',
    '--green':          '#7DC140',
    '--green-bg':       '#1A3010',
    '--blue':           '#68AAE0',
    '--blue-bg':        '#162840',
    '--gold':           '#F5D800',
    '--gold-bg':        '#2A2200',
    '--red':            '#E05050',
    '--red-bg':         '#3A1010',
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
