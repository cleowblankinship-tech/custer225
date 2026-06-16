// ── HouseArt ──────────────────────────────────────────────────────────────────
//
// Just the building — chimney, smoke, roof, body, windows, swinging door, and
// emergency flames. Returns a <g> in its own 40×42 coordinate space so it can
// be dropped into the wider HouseScene stage at any position. The ground,
// mailbox, garden, trees, and wildlife all live in HouseScene; the house stays
// the focal character and reacts to mood + vitals.
//
// House elements use currentColor so they follow the house's red coat. Smoke
// cadence follows vitals.hasGuest (the fire is lit when someone's staying).

export default function HouseArt({ mood = 'calm', vitals = null, windowOpacity = 1 }) {
  const hasGuest = !!vitals?.hasGuest

  // Brisk when urgent, a steady curl when the fire's lit for a guest, otherwise
  // slow, infrequent puffs from a cold flue.
  const smokeDur     = mood === 'urgent' ? 1.3 : hasGuest ? 3.2 : 6
  const doorAnimates = mood !== 'urgent'
  const doorDur      = mood === 'attention' ? '5.5s' : '11s'

  return (
    <g>
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
      <path d="M 15.5 37.5 L 15.5 30.5 Q 15.5 26 19.5 26 Q 23.5 26 23.5 30.5 L 23.5 37.5"
        fill="currentColor" stroke="none" opacity="0.12" />
      <path d="M 15.5 37.5 L 15.5 30.5 Q 15.5 26 19.5 26 Q 23.5 26 23.5 30.5 L 23.5 37.5" />
      <g style={{
        animation: doorAnimates ? `doorSwing ${doorDur} ease-in-out infinite` : 'none',
        transformBox: 'fill-box',
        transformOrigin: '0% 50%',
      }}>
        <path d="M 16.1 37.5 L 16.1 30.7 Q 16.1 26.6 19.5 26.6 Q 22.9 26.6 22.9 30.7 L 22.9 37.5"
          strokeWidth="1.6" opacity="0.85" />
        <circle cx="21.9" cy="33" r="0.7" fill="currentColor" stroke="none" opacity="0.85" />
      </g>

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
    </g>
  )
}
