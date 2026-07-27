// ── Hospitable login proof-of-concept ────────────────────────────────────────
//
// Goal: confirm a headless browser can log into your RESTRICTED Hospitable user
// account and reach the data — before we invest in building the full scheduled
// sync. It logs in, then tries to open Reservations, taking a screenshot at
// every step so we can see exactly where it succeeds or gets stopped.
//
// This does NOT export or store any data yet. It only proves the door opens.
//
// Your credentials are read from a local `.env` file (see .env.example) and are
// never printed, committed, or sent anywhere except to Hospitable's own login.
//
// Run it:  see README.md in this folder.

import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const SHOTS = join(HERE, 'screenshots')
mkdirSync(SHOTS, { recursive: true })

// ── Tiny .env reader (no dependency) ─────────────────────────────────────────
function loadEnv() {
  const out = {}
  try {
    for (const line of readFileSync(join(HERE, '.env'), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    console.error('✗ No .env file found in scripts/hospitable/. Copy .env.example → .env and fill it in.')
    process.exit(1)
  }
  return out
}

const env = loadEnv()
const EMAIL = env.HOSPITABLE_EMAIL
const PASSWORD = env.HOSPITABLE_PASSWORD
const LOGIN_URL = env.HOSPITABLE_LOGIN_URL || 'https://my.hospitable.com/login'
const HEADLESS = env.HEADLESS === 'true' // default: show the window so you can watch

if (!EMAIL || !PASSWORD) {
  console.error('✗ HOSPITABLE_EMAIL and HOSPITABLE_PASSWORD must be set in scripts/hospitable/.env')
  process.exit(1)
}

let step = 0
async function shot(page, label) {
  step++
  const file = join(SHOTS, `${String(step).padStart(2, '0')}-${label}.png`)
  await page.screenshot({ path: file, fullPage: false }).catch(() => {})
  console.log(`  📸 ${label} → screenshots/${String(step).padStart(2, '0')}-${label}.png`)
}

// Try a list of selectors, return the first one actually present & visible.
async function firstVisible(page, selectors, timeout = 8000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    for (const sel of selectors) {
      const el = page.locator(sel).first()
      if (await el.isVisible().catch(() => false)) return el
    }
    await page.waitForTimeout(250)
  }
  return null
}

const EMAIL_SELECTORS = [
  'input[type="email"]',
  'input[name="email"]',
  'input[autocomplete="username"]',
  '#email',
]
const PASSWORD_SELECTORS = [
  'input[type="password"]',
  'input[name="password"]',
  'input[autocomplete="current-password"]',
  '#password',
]
const SUBMIT_SELECTORS = [
  'button[type="submit"]',
  'button:has-text("Log in")',
  'button:has-text("Sign in")',
  'button:has-text("Continue")',
  'button:has-text("Log In")',
]
// Signs that we got past login into the actual app
const LOGGED_IN_SELECTORS = [
  'a[href*="reservations"]',
  'a[href*="inbox"]',
  'nav',
  '[data-testid="sidebar"]',
  'text=Reservations',
]
// Signs that Hospitable threw a checkpoint we can't pass unattended
const CHECKPOINT_HINTS = [
  'text=verify',
  'text=verification code',
  'text=two-factor',
  'text=2FA',
  'iframe[src*="recaptcha"]',
  'iframe[src*="captcha"]',
  'text=are you human',
]

async function looksLoggedIn(page) {
  if (!/login|signin|auth/i.test(page.url())) {
    // URL moved off the login page — strong signal
    if (await firstVisible(page, LOGGED_IN_SELECTORS, 4000)) return true
  }
  return !!(await firstVisible(page, LOGGED_IN_SELECTORS, 1500))
}

async function hitCheckpoint(page) {
  for (const sel of CHECKPOINT_HINTS) {
    if (await page.locator(sel).first().isVisible().catch(() => false)) return sel
  }
  return null
}

// ── Run ──────────────────────────────────────────────────────────────────────
console.log('\n🏠 Hospitable login proof-of-concept\n')
console.log(`  Login URL: ${LOGIN_URL}`)
console.log(`  Account:   ${EMAIL.replace(/(.).+(@.+)/, '$1•••$2')}`)
console.log(`  Mode:      ${HEADLESS ? 'headless' : 'visible window'}\n`)

const browser = await chromium.launch({ headless: HEADLESS, slowMo: HEADLESS ? 0 : 350 })
const context = await browser.newContext({ viewport: { width: 1360, height: 900 } })
const page = await context.newPage()

let verdict = 'UNKNOWN'
try {
  console.log('→ Opening login page…')
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(2500)
  await shot(page, 'login-page')

  // Step 1: email (some flows ask for email first, then reveal password)
  const emailField = await firstVisible(page, EMAIL_SELECTORS, 10000)
  if (!emailField) throw new Error('Could not find the email field — Hospitable may have changed its login page. Check 01-login-page.png.')
  console.log('→ Typing email…')
  await emailField.fill(EMAIL)

  // If password isn't visible yet, this is a two-step form: click Continue.
  let passwordField = await firstVisible(page, PASSWORD_SELECTORS, 2000)
  if (!passwordField) {
    console.log('→ Two-step form detected, clicking Continue…')
    const cont = await firstVisible(page, SUBMIT_SELECTORS, 4000)
    if (cont) { await cont.click().catch(() => {}); await page.waitForTimeout(2000) }
    await shot(page, 'after-email')
    passwordField = await firstVisible(page, PASSWORD_SELECTORS, 8000)
  }
  if (!passwordField) throw new Error('Could not find the password field. Check the latest screenshot.')

  console.log('→ Typing password…')
  await passwordField.fill(PASSWORD)
  await shot(page, 'ready-to-submit')

  console.log('→ Submitting…')
  const submit = await firstVisible(page, SUBMIT_SELECTORS, 5000)
  if (submit) await submit.click().catch(() => {})
  else await passwordField.press('Enter')

  // Wait for the result to settle
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(3000)
  await shot(page, 'after-submit')

  const checkpoint = await hitCheckpoint(page)
  if (checkpoint) {
    verdict = 'CHECKPOINT'
    console.log(`\n⚠  Login hit a checkpoint (${checkpoint}).`)
  } else if (await looksLoggedIn(page)) {
    verdict = 'PASS'
    // Bonus: try to reach reservations, where the money data lives
    console.log('→ Logged in. Trying to open Reservations…')
    const resLink = await firstVisible(page, ['a[href*="reservations"]', 'text=Reservations'], 5000)
    if (resLink) {
      await resLink.click().catch(() => {})
      await page.waitForTimeout(3000)
      await shot(page, 'reservations')
    }
  } else {
    verdict = 'FAIL'
  }
} catch (err) {
  verdict = 'ERROR'
  console.error(`\n✗ ${err.message}`)
  await shot(page, 'error-state')
} finally {
  await page.waitForTimeout(1000)
  await browser.close()
}

console.log('\n────────────────────────────────────────')
const summary = {
  PASS:       '✅ PASS — the bot logged in and reached the app. We can build the full sync.',
  CHECKPOINT: '⚠  CHECKPOINT — login works but Hospitable asked for extra verification/captcha. Send me the screenshots and we\'ll plan around it.',
  FAIL:       '❌ FAIL — submitted but did not land in the app. Check after-submit.png (wrong password? unexpected page?).',
  ERROR:      '❌ ERROR — the script hit a problem (see message above + screenshots).',
  UNKNOWN:    '❓ UNKNOWN — inconclusive; check the screenshots.',
}[verdict]
console.log(summary)
console.log('Screenshots are in scripts/hospitable/screenshots/ — send them to me.')
console.log('────────────────────────────────────────\n')
process.exit(verdict === 'PASS' ? 0 : 1)
