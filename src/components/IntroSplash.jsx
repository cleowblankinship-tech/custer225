import { useState, useEffect, useRef } from 'react'

// ── IntroSplash ───────────────────────────────────────────────────────────────
//
// Plays a one-time branded intro video on cold app load.
// Renders as a fixed overlay above everything else.
//
// To swap the video: replace public/splash.mp4 with a new file.
// The src reference below points to /splash.mp4 (served from public/).
//
// Props:
//   onComplete — called after the video ends and the fade-out finishes

const VIDEO_SRC = '/splash.mp4'
const FADE_MS   = 500   // duration of both the fade-in and fade-out

export default function IntroSplash({ onComplete }) {
  const [opacity, setOpacity] = useState(0)
  const videoRef  = useRef(null)
  const doneRef   = useRef(false) // guard against double-fire

  // Reduced-motion: skip the video entirely and go straight to the app
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onComplete()
      return
    }

    // Fade in — two rAFs ensure the initial opacity:0 has been painted
    // before we start the transition to opacity:1
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setOpacity(1))
    )
    return () => cancelAnimationFrame(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    setOpacity(0)
    setTimeout(onComplete, FADE_MS)
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: '#FFF8EF',          // warm cream — matches app palette
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        opacity,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: 'none',          // don't block interactions behind it
      }}
    >
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        autoPlay
        muted
        playsInline
        onEnded={finish}
        style={{
          maxWidth: '100%',
          maxHeight: '80vh',
          objectFit: 'contain',
          borderRadius: 16,
          display: 'block',
        }}
      />
    </div>
  )
}
