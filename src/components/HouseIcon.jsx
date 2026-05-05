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

export default function HouseIcon({ size = 46, style }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {/*
        Roof — two slopes meeting at a slightly left-of-center peak.
        Left eave sits 0.5px lower than the right for subtle asymmetry.
      */}
      <path d="M 1 22 L 19.5 4.5 L 39 21.5" />

      {/*
        Body — four corners are intentionally not perfectly square.
        Left wall leans inward 0.5px; right wall leans outward 0.5px.
        Bottom rail runs 4.5→35.5 (not 5→35) to echo the lean.
      */}
      <path d="M 5 22 L 4.5 37.5 L 35.5 37.5 L 35 22" />

      {/*
        Door — arched top using two quadratic beziers.
        Peak at (19.5, 26). Straight sides from y=30.5 down to the floor.
      */}
      <path d="M 15.5 37.5 L 15.5 30.5 Q 15.5 26 19.5 26 Q 23.5 26 23.5 30.5 L 23.5 37.5" />

      {/*
        Windows — cross-shaped (two short lines).
        Minimal and hand-drawn; avoids the geometric-rectangle-inside-rectangle problem.
        Left at (10.5, 27), right at (29, 27).
      */}
      {/* Left window */}
      <path d="M 8.5 27 L 12.5 27 M 10.5 25 L 10.5 29" />

      {/* Right window */}
      <path d="M 27 27 L 31 27 M 29 25 L 29 29" />
    </svg>
  )
}
