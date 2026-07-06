// ── HouseArt ──────────────────────────────────────────────────────────────────
//
// Keith Haring–inspired line drawing of the house.
// Bold outlines only — no fills except the background color behind each shape
// so overlapping forms read clearly. Stroke is currentColor so it follows
// the light/dark theme (black on white, white on dark).
//
// Natural animations only:
//   smoke       — chimney puffs, slow when cold, steady when a guest is in
//   door        — swings open then settles, more eager before a check-in
//   window glow — warm amber inside the glass only when a guest is staying
//
// Coordinate space: 40 × 42  (same as before, dropped into HouseScene)

const SW = 3.2   // stroke weight — the thick line that defines KH style

export default function HouseArt({ mood = 'calm', vitals = null, arrivingSoon = false }) {
  const hasGuest = !!vitals?.hasGuest
  const smokeDur = mood === 'urgent' ? 1.3 : hasGuest ? 3.0 : 6
  const doorDur  = arrivingSoon ? '8s' : '14s'

  return (
    <g strokeLinecap="round" strokeLinejoin="round">

      {/* ── Background fills — block whatever is behind so outlines read ───── */}
      {/* Drawn first (painter's base) so the outlines sit cleanly on top.     */}
      <rect x="23" y="7"  width="7"  height="15" fill="var(--bg)" stroke="none"/>
      <polygon points="0,22 20,1.5 40,22"         fill="var(--bg)" stroke="none"/>
      <rect x="3"  y="21" width="34" height="21"  fill="var(--bg)" stroke="none"/>

      {/* ── Chimney ──────────────────────────────────────────────────────────── */}
      <rect x="23" y="7" width="7" height="15"
        fill="none" stroke="currentColor" strokeWidth={SW}/>

      {/* ── Roof ─────────────────────────────────────────────────────────────── */}
      <polyline points="0,22 20,1.5 40,22"
        fill="none" stroke="currentColor" strokeWidth={SW}/>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <rect x="3" y="21" width="34" height="21"
        fill="none" stroke="currentColor" strokeWidth={SW}/>

      {/* ── Windows ──────────────────────────────────────────────────────────── */}
      {/* Amber warmth inside the glass when someone is home */}
      {hasGuest && (
        <g fill="#FFF2CC" stroke="none">
          <rect x="5.5"  y="24.5" width="9"   height="8"
            style={{ animation: 'windowGlow 4s ease-in-out infinite' }} opacity="0.85"/>
          <rect x="25.5" y="24.5" width="9"   height="8"
            style={{ animation: 'windowGlow 4s ease-in-out infinite 0.7s' }} opacity="0.85"/>
        </g>
      )}
      <rect x="5"  y="24" width="10" height="9"
        fill="none" stroke="currentColor" strokeWidth={SW}/>
      <rect x="25" y="24" width="10" height="9"
        fill="none" stroke="currentColor" strokeWidth={SW}/>

      {/* ── Door — arched frame stays fixed, panel swings on its left hinge ─── */}
      <path d="M 15,42 L 15,33.5 Q 15,28 20,28 Q 25,28 25,33.5 L 25,42"
        fill="none" stroke="currentColor" strokeWidth={SW}/>
      <g style={{
        animation: `doorSwing ${doorDur} ease-in-out infinite`,
        transformBox: 'fill-box',
        transformOrigin: '0% 50%',
      }}>
        <path d="M 15.8,42 L 15.8,33.8 Q 15.8,28.7 20,28.7 Q 24.2,28.7 24.2,33.8 L 24.2,42"
          fill="none" stroke="currentColor" strokeWidth="2" opacity="0.55"/>
        {/* Knob */}
        <circle cx="23" cy="35.5" r="0.9" fill="currentColor" stroke="none" opacity="0.45"/>
      </g>

      {/* ── Chimney smoke ─────────────────────────────────────────────────────── */}
      {/* Two offset curls: one rises while the other pauses, like a real flue. */}
      <g fill="none" stroke="currentColor" strokeWidth="1.6" opacity="0.35" strokeLinecap="round">
        <path d="M 26.5 7 Q 24.5 4.5 26.5 2 Q 28.5 -0.5 26.5 -3"
          style={{ animation: `smokePuff ${smokeDur}s ease-out infinite`, transformBox: 'fill-box', transformOrigin: 'bottom center' }}/>
        <path d="M 26.5 7 Q 25 4.5 26.5 2.5 Q 28 0.5 26.5 -2"
          style={{ animation: `smokePuff ${smokeDur}s ease-out infinite ${smokeDur / 2}s`, transformBox: 'fill-box', transformOrigin: 'bottom center' }}/>
      </g>

      {/* ── URGENT: fire at the left window ──────────────────────────────────── */}
      {mood === 'urgent' && (
        <g fill="currentColor" stroke="none">
          <path
            d="M 8 33 C 6.5 29.5 9 26.5 8.5 24.5 C 10 27 9.5 25 11.5 23.5 C 10.5 26 12.5 25 13 23 C 13 26 14.5 28.5 13.5 33 Z"
            style={{ animation: 'flameFlicker 0.28s ease-in-out infinite alternate', transformBox: 'fill-box', transformOrigin: 'bottom center' }}
            opacity="0.9"
          />
        </g>
      )}
    </g>
  )
}
