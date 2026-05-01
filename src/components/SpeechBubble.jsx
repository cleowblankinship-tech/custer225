import { useState, useEffect } from 'react'

// ── SpeechBubble ──────────────────────────────────────────────────────────────
//
// The house's voice. Sits to the RIGHT of the house icon in a flex row.
// Mounts fresh each time the home view is entered, re-triggering the animation.
//
// Layout:
//   [🏠]  [  bubble content  →  ]
//          ↑
//     left-pointing tail
//
// Tail geometry (16×16 square, rotated 45°):
//   After rotation the four corners point: up, right, down, LEFT.
//   The LEFT corner is the tip pointing toward the house icon.
//   That corner is the original bottom-left corner of the square.
//   The two edges meeting there are borderLeft + borderBottom — those
//   are the only sides we draw; borderTop and borderRight stay invisible.
//   The bubble (zIndex 3) covers the right half of the diamond,
//   hiding those inner edges cleanly.
//
//   Positioning:
//     left: -8  → half the diamond protrudes from the bubble's left edge
//     top: 50%, marginTop: -8  → vertically centred on the bubble
//
//   borderRadius: '0 0 0 3px' softens the tip corner (pre-rotation
//   bottom-left becomes the post-rotation left-pointing tip).

export default function SpeechBubble({ moodStyle, mood, message, extraCount, onOpen, weatherBlurb }) {
  const [visible, setVisible] = useState(false)

  // Tiny delay so the initial CSS value commits before the transition fires,
  // guaranteeing the animation plays on every mount (= every home visit).
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  return (
    // Wrapper animates tail + bubble as a single unit.
    // Slides in from the left — reinforces the "character speaking" read.
    <div style={{
      position:   'relative',
      opacity:    visible ? 1 : 0,
      transform:  visible ? 'translateX(0) scale(1)' : 'translateX(-8px) scale(0.97)',
      transition: 'opacity 280ms ease, transform 280ms ease',
    }}>

      {/* ── Tail — left-pointing diamond ───────────────────────────────── */}
      {/* 16×16 square rotated 45°. Only borderLeft + borderBottom drawn.  */}
      {/* The left corner becomes the tip pointing toward the house.        */}
      <div style={{
        position:     'absolute',
        left:         -8,
        top:          '50%',
        marginTop:    -8,
        width:        16,
        height:       16,
        background:   moodStyle.tailFill,
        borderLeft:   moodStyle.tailBorder,
        borderBottom: moodStyle.tailBorder,
        transform:    'rotate(45deg)',
        borderRadius: '0 0 0 3px',   // softens the left-pointing tip
        zIndex:       2,
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
          gap:          8,
        }}
      >
        {/* Main content — message + optional weather subtitle */}
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display:    'block',
            fontSize:   14,
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
            fontSize:   11,
            color:      moodStyle.moreColor,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            +{extraCount} more
          </span>
        )}

        <span style={{ fontSize: 13, color: 'var(--text3)', flexShrink: 0 }}>→</span>
      </button>
    </div>
  )
}
