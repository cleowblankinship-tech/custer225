import { useState, useEffect } from 'react'

// ── SpeechBubble ──────────────────────────────────────────────────────────────
//
// The house's voice on the home screen. Mounts fresh each time the home view
// is entered, which re-triggers the fade + slide animation automatically.
//
// Tail:
//   A rotated square with border only on the two visible sides (top + left).
//   This produces a softer, more organic shape than the classic CSS triangle,
//   which is too sharp for this aesthetic. The bubble sits on top of the
//   lower half of the diamond via z-index, hiding those edges cleanly.
//
//   Positioning math (12×12 square, rotated 45°):
//   - CSS top/left places the square's top-left corner
//   - After rotation the original top-left corner (the tip) appears at
//     roughly (left + W, top - W) where W = side/√2 ≈ 8.5px
//   - To centre the tip over the house icon (icon centre = 24px from
//     bubble left edge): left = 18 → tip x = 18 + 6 = 24 ✓
//   - top: -6 → tip y ≈ -6 - 2.5 = -8.5px above the bubble ✓

export default function SpeechBubble({ moodStyle, mood, message, extraCount, onOpen, weatherBlurb }) {
  const [visible, setVisible] = useState(false)

  // Tiny delay lets the initial CSS value commit before the transition fires,
  // guaranteeing the animation plays on every mount (= every home visit).
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  return (
    // Wrapper animates both tail + bubble as a single unit
    <div style={{
      position: 'relative',
      marginTop: -18,
      opacity:   visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.98)',
      transition: 'opacity 260ms ease, transform 260ms ease',
    }}>

      {/* ── Tail — rotated diamond ─────────────────────────────────────── */}
      {/* 18×18 square rotated 45°: tip appears at (x=24, y≈-10)        */}
      {/* left:15 → center x = 15+9 = 24 = house icon centre            */}
      {/* top:-8  → tip y ≈ -8 - (9*√2 - 9) ≈ -11px above bubble        */}
      <div style={{
        position:    'absolute',
        top:         -8,
        left:        15,
        width:       18,
        height:      18,
        background:  moodStyle.tailFill,
        borderTop:   moodStyle.tailBorder,
        borderLeft:  moodStyle.tailBorder,
        transform:   'rotate(45deg)',
        borderRadius: '3px 0 0 0',  // softened tip
        zIndex:      2,
      }} />

      {/* ── Bubble ─────────────────────────────────────────────────────── */}
      <button
        onClick={onOpen}
        style={{
          position:     'relative',
          zIndex:       3,
          width:        '100%',
          textAlign:    'left',
          background:   moodStyle.bg,
          border:       moodStyle.border,
          borderLeft:   moodStyle.borderLeft,
          borderRadius: moodStyle.borderRadius,
          padding:      moodStyle.padding,
          boxShadow:    moodStyle.boxShadow,
          display:      'flex',
          alignItems:   'center',
          gap:          10,
        }}
      >
        {/* Main content — message + optional weather subtitle */}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display:    'block',
            fontSize:   15,
            fontWeight: moodStyle.textWeight,
            color:      moodStyle.textColor,
            lineHeight: 1.35,
          }}>
            {message}
          </span>

          {/* Weather blurb — shows as a subtle second line whenever weather
              data is available, regardless of mood or active reminders       */}
          {weatherBlurb && (
            <span style={{
              display:    'block',
              fontSize:   11,
              color:      'var(--text3)',
              marginTop:  3,
              lineHeight: 1.3,
            }}>
              {weatherBlurb}
            </span>
          )}
        </span>

        {extraCount > 0 && (
          <span style={{
            fontSize:    11,
            color:       moodStyle.moreColor,
            whiteSpace:  'nowrap',
            flexShrink:  0,
          }}>
            +{extraCount} more
          </span>
        )}

        <span style={{ fontSize: 13, color: 'var(--text3)', flexShrink: 0 }}>→</span>
      </button>
    </div>
  )
}
