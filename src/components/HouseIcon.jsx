// ── HouseIcon ─────────────────────────────────────────────────────────────────
//
// Monochrome, stroke-only house SVG. Replaces the colorful logo.png.
// Color is inherited via `currentColor` from the parent — set `color` on
// the wrapper to control it. The parent button in App.jsx passes
// `color: 'var(--text)'` so it is cream in night mode, dark brown in day.
//
// Hand-drawn feel comes from:
//   - Roof slightly asymmetric (peak at 19.5 instead of 20)
//   - Body walls very slightly angled (L 4.5 37 vs L 5 37)
//   - Arch door using quadratic beziers rather than a sharp corner
//   - strokeLinejoin="round" softens all joints
//   - strokeLinecap="round" softens all line ends
//
// viewBox: 0 0 40 40
// Display size: 46×46 px (slightly smaller than the 56px logo — less weight)
// strokeWidth bumped from 1.8 → 2.0 → 2.45 (progressively heavier for hero protagonist weight)

export default function HouseIcon({ size = 46, style, windowOpacity = 1 }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/* Chimney — left of peak, adds asymmetric personality */}
      <path d="M 26 15.5 L 26 9 L 30 9 L 30 13" />

      {/* Roof */}
      <path d="M 1 22 L 19.5 4.5 L 39 21.5" />

      {/* Body */}
      <path d="M 5 22 L 4.5 37.5 L 35.5 37.5 L 35 22" />

      {/* Windows — filled "eyes", blink via windowOpacity */}
      <rect x="7"  y="24.5" width="6.5" height="5.5" rx="1.2" fill="currentColor" stroke="none" opacity={windowOpacity} />
      <rect x="26.5" y="24.5" width="6.5" height="5.5" rx="1.2" fill="currentColor" stroke="none" opacity={windowOpacity} />

      {/* Door — arched */}
      <path d="M 15.5 37.5 L 15.5 30.5 Q 15.5 26 19.5 26 Q 23.5 26 23.5 30.5 L 23.5 37.5" />
    </svg>
  )
}

