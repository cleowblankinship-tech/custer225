// ── HouseIcon ─────────────────────────────────────────────────────────────────
//
// A little living house. The base structure is constant; everything else
// reacts to mood and to real property data passed in `vitals`:
//
//   mood 'calm'      → flowers at the base, lazy door, occasional smoke puffs
//   mood 'attention' → warm window glow, door swings more often (welcoming)
//   mood 'urgent'    → flames at the left window, fast billowing smoke, door shut
//
//   vitals.hasGuest  → chimney smoke puffs steadily (the fire is lit)
//   vitals.hasMail   → the mailbox flag stands up (a notification is waiting)
//
// Ambient sky life — drifting clouds and the odd passing flock of birds —
// runs always, independent of the house's color (they're "sky", not "house").
//
// All house elements use currentColor so they follow the house's coat. Sky
// elements use fixed soft neutrals so they read on any background or theme.
// transform-box: fill-box makes transform-origin resolve against each
// element's own box rather than the SVG viewport.

const CLOUD   = '#D8CEBE'   // soft warm cloud
const BIRD    = '#9C8E7A'   // muted feather grey

export default function HouseIcon({ size = 46, style, windowOpacity = 1, mood = 'calm', vitals = null }) {
  const hasMail  = !!vitals?.hasMail
  const hasGuest = !!vitals?.hasGuest

  // Smoke cadence: brisk when there's an emergency, a steady curl when the
  // fire is lit for a guest, otherwise slow, infrequent puffs from a cold flue.
  const smokeDur = mood === 'urgent' ? 1.3 : hasGuest ? 3.2 : 6
  // Door swings on a relaxed loop, more eagerly when a guest is expected; it
  // stays shut during an emergency.
  const doorAnimates = mood !== 'urgent'
  const doorDur      = mood === 'attention' ? '5.5s' : '11s'

  return (
    <svg
      viewBox="0 0 40 42"
      width={size}
      height={size * (42 / 40)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, overflow: 'visible', ...style }}
      aria-hidden="true"
    >
      {/* ── Sky: clouds drifting behind the roof ──────────────────────────── */}
      <g stroke="none" fill={CLOUD}>
        <g style={{ animation: 'cloudDrift 46s linear infinite', transformBox: 'fill-box', transformOrigin: 'center' }} opacity="0.5">
          <circle cx="6"  cy="2"   r="2.2" />
          <circle cx="9"  cy="1.2" r="2.7" />
          <circle cx="12" cy="2.1" r="2.0" />
          <rect x="5.5" y="2" width="7.5" height="2.2" rx="1.1" />
        </g>
        <g style={{ animation: 'cloudDrift 64s linear infinite 8s', transformBox: 'fill-box', transformOrigin: 'center' }} opacity="0.38">
          <circle cx="26" cy="-1"  r="1.7" />
          <circle cx="28.5" cy="-1.7" r="2.1" />
          <circle cx="31" cy="-1"  r="1.6" />
          <rect x="25.8" y="-1" width="5.6" height="1.8" rx="0.9" />
        </g>
      </g>

      {/* ── Sky: an occasional passing flock ──────────────────────────────── */}
      <g style={{ animation: 'birdFly 15s linear infinite' }} stroke={BIRD} strokeWidth="0.65" fill="none" strokeLinecap="round">
        <path d="M 0 7 Q 1 5.8 2 7 Q 3 5.8 4 7"
          style={{ animation: 'birdFlap 0.5s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'center' }} />
        <path d="M 5 9 Q 5.8 8 6.6 9 Q 7.4 8 8.2 9"
          style={{ animation: 'birdFlap 0.5s ease-in-out infinite 0.12s', transformBox: 'fill-box', transformOrigin: 'center' }} />
      </g>

      {/* ── Chimney ────────────────────────────────────────────────────────── */}
      <path d="M 26 15.5 L 26 9 L 30 9 L 30 13" />

      {/* ── Smoke — puffs that rise then pause; two offset curls ───────────── */}
      <g opacity="0.45" strokeWidth="1.4" fill="none">
        <path d="M 28 9 Q 26 6.5 28 4 Q 30 1.5 28 -1"
          style={{ animation: `smokePuff ${smokeDur}s ease-out infinite`, transformBox: 'fill-box', transformOrigin: 'bottom center' }} />
        <path d="M 28 9 Q 26.5 6.5 28 4.5 Q 29.5 2 28 0"
          style={{ animation: `smokePuff ${smokeDur}s ease-out infinite ${smokeDur / 2}s`, transformBox: 'fill-box', transformOrigin: 'bottom center' }} />
      </g>

      {/* ── Roof ──────────────────────────────────────────────────────────── */}
      <path d="M 1 22 L 19.5 4.5 L 39 21.5" />

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <path d="M 5 22 L 4.5 37.5 L 35.5 37.5 L 35 22" />

      {/* ── Windows ───────────────────────────────────────────────────────── */}
      {(mood === 'attention' || mood === 'urgent') && (
        <>
          <rect x="7"    y="24.5" width="6.5" height="5.5" rx="1.2" fill="currentColor" stroke="none" opacity={0.22} />
          <rect x="26.5" y="24.5" width="6.5" height="5.5" rx="1.2" fill="currentColor" stroke="none" opacity={0.22} />
        </>
      )}
      <rect x="7"    y="24.5" width="6.5" height="5.5" rx="1.2" fill="currentColor" stroke="none" opacity={windowOpacity} />
      <rect x="26.5" y="24.5" width="6.5" height="5.5" rx="1.2" fill="currentColor" stroke="none" opacity={windowOpacity} />

      {/* ── Door — frame stays put; the panel swings open on its left hinge ── */}
      {/* recessed doorway, visible as the panel foreshortens away */}
      <path d="M 15.5 37.5 L 15.5 30.5 Q 15.5 26 19.5 26 Q 23.5 26 23.5 30.5 L 23.5 37.5"
        fill="currentColor" stroke="none" opacity="0.12" />
      {/* doorframe */}
      <path d="M 15.5 37.5 L 15.5 30.5 Q 15.5 26 19.5 26 Q 23.5 26 23.5 30.5 L 23.5 37.5" />
      {/* swinging panel + knob */}
      <g style={{
        animation: doorAnimates ? `doorSwing ${doorDur} ease-in-out infinite` : 'none',
        transformBox: 'fill-box',
        transformOrigin: '0% 50%',
      }}>
        <path d="M 16.1 37.5 L 16.1 30.7 Q 16.1 26.6 19.5 26.6 Q 22.9 26.6 22.9 30.7 L 22.9 37.5"
          strokeWidth="1.6" opacity="0.85" />
        <circle cx="21.9" cy="33" r="0.7" fill="currentColor" stroke="none" opacity="0.85" />
      </g>

      {/* ── Ground line ───────────────────────────────────────────────────── */}
      <line x1="0" y1="39.5" x2="40" y2="39.5" strokeWidth="1.4" opacity="0.18" />

      {/* ── Mailbox — flag up when a notification is waiting ───────────────── */}
      <g>
        {/* post */}
        <line x1="39.4" y1="39.5" x2="39.4" y2="32.4" strokeWidth="1.8" />
        {/* box */}
        <rect x="37.6" y="29.3" width="4" height="3.2" rx="1.4" strokeWidth="1.6" />
        {/* flag — pivots at its base on the right of the box */}
        <g transform="translate(41.6 31.6)">
          <g style={{
            transform: hasMail ? 'rotate(2deg)' : 'rotate(102deg)',
            transformBox: 'fill-box',
            transformOrigin: 'left bottom',
            transition: 'transform 650ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}>
            <line x1="0" y1="0" x2="0" y2="-3" strokeWidth="1.3" />
            <path d="M 0 -3 L 1.9 -2.5 L 0 -1.4 Z"
              fill="currentColor" stroke="none"
              style={{ opacity: hasMail ? 1 : 0.4, transition: 'opacity 400ms ease' }} />
          </g>
        </g>
      </g>

      {/* ── CALM: flowers at the base ─────────────────────────────────────── */}
      {mood === 'calm' && (
        <g strokeWidth="1.3">
          <g style={{ animation: 'flowerSway 2.2s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'bottom center' }}>
            <line x1="2.5" y1="39.5" x2="2.5" y2="35.5" />
            <circle cx="2.5" cy="34.5" r="1.8" fill="currentColor" stroke="none" opacity="0.85" />
          </g>
          <g style={{ animation: 'flowerSway 2.8s ease-in-out infinite 0.4s', transformBox: 'fill-box', transformOrigin: 'bottom center' }}>
            <line x1="5"   y1="39.5" x2="4.5" y2="36.5" />
            <circle cx="4.5" cy="35.5" r="1.4" fill="currentColor" stroke="none" opacity="0.7" />
          </g>
        </g>
      )}

      {/* ── URGENT: flames at the left window ─────────────────────────────── */}
      {mood === 'urgent' && (
        <g fill="currentColor" stroke="none">
          <path
            d="M 8 30 C 6.5 26.5 9 23.5 8.5 21.5 C 10 24 9.5 22 11.5 20.5 C 10.5 23 12.5 22 13 20 C 13 23 14.5 25.5 13.5 30 Z"
            style={{ animation: 'flameFlicker 0.28s ease-in-out infinite alternate', transformBox: 'fill-box', transformOrigin: 'bottom center' }}
            opacity="0.95"
          />
          <path
            d="M 7 30 C 6 28 7.5 26 7 24.5 C 8 26 8 25 9 24 C 8.5 26 9.5 27.5 9 30 Z"
            style={{ animation: 'flameFlicker 0.22s ease-in-out infinite alternate-reverse', transformBox: 'fill-box', transformOrigin: 'bottom center' }}
            opacity="0.7"
          />
        </g>
      )}
    </svg>
  )
}
