// ── HouseIcon ─────────────────────────────────────────────────────────────────
//
// Mood-aware house SVG. The base structure stays constant; contextual scene
// elements animate in based on the mood prop:
//
//   calm      → flowers at the base, smoke from chimney
//   attention → door ajar (panel swung open), warm window glow
//   urgent    → flames at the left window, smoke billowing
//
// All elements use currentColor so they adapt to the theme accent.
// transform-box: fill-box on animated SVG elements makes transform-origin
// work relative to each element rather than the SVG viewport origin.

export default function HouseIcon({ size = 46, style, windowOpacity = 1, mood = 'calm' }) {
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
      {/* ── Chimney ────────────────────────────────────────────────────────── */}
      <path d="M 26 15.5 L 26 9 L 30 9 L 30 13" />

      {/* ── Smoke from chimney — always present, livelier when urgent ──────── */}
      <g opacity="0.45" strokeWidth="1.4" fill="none">
        <path
          d="M 28 9 Q 26 6.5 28 4 Q 30 1.5 28 -1"
          style={{
            animation: mood === 'urgent'
              ? 'smokeRise 0.9s ease-out infinite'
              : 'smokeRise 2.4s ease-out infinite',
            transformBox: 'fill-box',
            transformOrigin: 'bottom center',
          }}
        />
      </g>

      {/* ── Roof ──────────────────────────────────────────────────────────── */}
      <path d="M 1 22 L 19.5 4.5 L 39 21.5" />

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <path d="M 5 22 L 4.5 37.5 L 35.5 37.5 L 35 22" />

      {/* ── Windows ───────────────────────────────────────────────────────── */}
      {/* Warm glow fill behind windows when attention/urgent */}
      {(mood === 'attention' || mood === 'urgent') && (
        <>
          <rect x="7"    y="24.5" width="6.5" height="5.5" rx="1.2"
            fill="currentColor" stroke="none" opacity={0.22} />
          <rect x="26.5" y="24.5" width="6.5" height="5.5" rx="1.2"
            fill="currentColor" stroke="none" opacity={0.22} />
        </>
      )}
      {/* Window frames — blink via windowOpacity */}
      <rect x="7"    y="24.5" width="6.5" height="5.5" rx="1.2"
        fill="currentColor" stroke="none" opacity={windowOpacity} />
      <rect x="26.5" y="24.5" width="6.5" height="5.5" rx="1.2"
        fill="currentColor" stroke="none" opacity={windowOpacity} />

      {/* ── Door — closed (calm/urgent) or ajar (attention) ───────────────── */}
      {mood === 'attention' ? (
        <>
          {/* Doorframe only */}
          <path d="M 15.5 37.5 L 15.5 30.5 Q 15.5 26 19.5 26 Q 23.5 26 23.5 30.5 L 23.5 37.5" />
          {/* Door panel swung open to the left — a simple parallelogram */}
          <path d="M 15.5 30.5 L 11.5 31.5 L 11.5 37.5 L 15.5 37.5"
            strokeWidth="1.8" strokeDasharray="none" opacity="0.7" />
          {/* Knob hint */}
          <circle cx="14" cy="34.2" r="0.8" fill="currentColor" stroke="none" opacity="0.7" />
        </>
      ) : (
        <path d="M 15.5 37.5 L 15.5 30.5 Q 15.5 26 19.5 26 Q 23.5 26 23.5 30.5 L 23.5 37.5" />
      )}

      {/* ── Ground line ───────────────────────────────────────────────────── */}
      <line x1="0" y1="39.5" x2="40" y2="39.5" strokeWidth="1.4" opacity="0.18" />

      {/* ── CALM: flowers at the base ─────────────────────────────────────── */}
      {mood === 'calm' && (
        <g strokeWidth="1.3">
          {/* Left cluster */}
          <g style={{ animation: 'flowerSway 2.2s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'bottom center' }}>
            <line x1="2.5" y1="39.5" x2="2.5" y2="35.5" />
            <circle cx="2.5" cy="34.5" r="1.8" fill="currentColor" stroke="none" opacity="0.85" />
          </g>
          <g style={{ animation: 'flowerSway 2.8s ease-in-out infinite 0.4s', transformBox: 'fill-box', transformOrigin: 'bottom center' }}>
            <line x1="5"   y1="39.5" x2="4.5" y2="36.5" />
            <circle cx="4.5" cy="35.5" r="1.4" fill="currentColor" stroke="none" opacity="0.7" />
          </g>
          {/* Right cluster */}
          <g style={{ animation: 'flowerSway 2.5s ease-in-out infinite 0.8s', transformBox: 'fill-box', transformOrigin: 'bottom center' }}>
            <line x1="37.5" y1="39.5" x2="37.5" y2="35" />
            <circle cx="37.5" cy="34" r="1.9" fill="currentColor" stroke="none" opacity="0.85" />
          </g>
          <g style={{ animation: 'flowerSway 2.1s ease-in-out infinite 1.2s', transformBox: 'fill-box', transformOrigin: 'bottom center' }}>
            <line x1="35"   y1="39.5" x2="35.5" y2="36.5" />
            <circle cx="35.5" cy="35.5" r="1.3" fill="currentColor" stroke="none" opacity="0.65" />
          </g>
        </g>
      )}

      {/* ── URGENT: flames at the left window ─────────────────────────────── */}
      {mood === 'urgent' && (
        <g fill="currentColor" stroke="none">
          {/* Main flame */}
          <path
            d="M 8 30 C 6.5 26.5 9 23.5 8.5 21.5 C 10 24 9.5 22 11.5 20.5 C 10.5 23 12.5 22 13 20 C 13 23 14.5 25.5 13.5 30 Z"
            style={{
              animation: 'flameFlicker 0.28s ease-in-out infinite alternate',
              transformBox: 'fill-box',
              transformOrigin: 'bottom center',
            }}
            opacity="0.95"
          />
          {/* Smaller side flame */}
          <path
            d="M 7 30 C 6 28 7.5 26 7 24.5 C 8 26 8 25 9 24 C 8.5 26 9.5 27.5 9 30 Z"
            style={{
              animation: 'flameFlicker 0.22s ease-in-out infinite alternate-reverse',
              transformBox: 'fill-box',
              transformOrigin: 'bottom center',
            }}
            opacity="0.7"
          />
        </g>
      )}
    </svg>
  )
}
