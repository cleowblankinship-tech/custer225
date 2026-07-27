# Hospitable sync — Step 1: login proof-of-concept

Before building the full automated sync, we prove one thing: **can a browser bot
log into your restricted Hospitable account and reach your data?** If yes, we
build the rest. If Hospitable blocks it, we found out in 10 minutes instead of a
day.

This script logs in and takes a screenshot at every step. It does **not** export
or save any data yet.

## What you need

- Node.js (you already have it — it's what runs the app)
- Your restricted-user Hospitable email + password (the login Josh set up)

## Run it (one time, on your own computer)

From the project root:

```bash
cd scripts/hospitable

# 1. Install the browser automation tool (only into this folder)
npm install playwright
npx playwright install chromium

# 2. Create your .env from the template and fill in your password
cp .env.example .env
#   → open .env and set HOSPITABLE_PASSWORD (email is pre-filled)

# 3. Run the proof-of-concept
node poc-login.mjs
```

A Chrome window will open and you'll watch it type your email/password and try to
reach Reservations. When it finishes it prints one of:

- **✅ PASS** — it got in. We're clear to build the full sync.
- **⚠ CHECKPOINT** — login works but Hospitable asked for a captcha / extra code.
  We'll plan around it.
- **❌ FAIL / ERROR** — something stopped it. The screenshots tell us what.

## Then

Send me the screenshots from `scripts/hospitable/screenshots/` (or just tell me
the PASS/CHECKPOINT/FAIL result). That decides the next step.

## Safety notes

- Your password lives only in `scripts/hospitable/.env`, which is **gitignored** —
  it is never committed or shared.
- The screenshots are also gitignored (they'd show your account).
- This logs in exactly once, like a normal person would. The account-suspension
  risk we discussed applies to the *scheduled, every-day* version — loop Josh in
  before we turn that on.
