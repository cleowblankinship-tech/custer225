import { useState, useEffect, useRef } from 'react'

// ── IntroSplash ───────────────────────────────────────────────────────────────
//
// Plays a one-time branded intro video on cold app load.
// Renders as a fixed, fully-opaque overlay above everything else.
//
// To swap the video: replace public/splash.mp4 with a new file and update
// the VIDEO_SRC constant below — that is the only reference.
//
// Props:
//   onComplete — called after the video ends and the fade-out finishes

const VIDEO_SRC    = '/splash.mp4'
const FADE_OUT_MS  = 500   // only the exit fade; no fade-in (prevents flash)

export default function IntroSplash({ onComplete }) {
  // fadingOut drives the only opacity transition — we never start at 0
  const [fadingOut, setFadingOut] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    // Skip entirely for users who prefer reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    setFadingOut(true)
    setTimeout(onComplete, FADE_OUT_MS)
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,

        // Fully opaque from the very first frame — no fade-in means no flash
        // of the underlying app. The overlay only fades when exiting.
        opacity: fadingOut ? 0 : 1,
        transition: fadingOut ? `opacity ${FADE_OUT_MS}ms ease` : 'none',

        // Background: pure white so the video's own background blends cleanly
        // regardless of its exact tone. Avoids the colored-card-on-a-page look.
        background: '#ffffff',

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        src={VIDEO_SRC}
        autoPlay
        muted
        playsInline
        onEnded={finish}
        style={{
          // Responsive: fills comfortably on phone, stays contained on desktop.
          // width  — 88% of viewport, never wider than 480 px
          // height — never taller than 78% of viewport
          // No borderRadius, no shadow — video sits directly on the white field.
          width: 'min(88vw, 480px)',
          maxHeight: '78vh',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  )
}
