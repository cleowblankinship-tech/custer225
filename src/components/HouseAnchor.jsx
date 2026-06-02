import { useState, useEffect } from 'react'
import HouseIcon from './HouseIcon'

// ── Theme toggle config ────────────────────────────────────────────────────────
const THEME_ICONS = { auto: '◐', day: '☀', evening: '◑', night: '☾' }

// ── Typewriter hook ────────────────────────────────────────────────────────────
// Reveals `target` one character at a time. Returns '' when target is null.
// Restarts from '' whenever target changes.
function useTypewriter(target, msPerChar = 22) {
  const [output, setOutput] = useState('')

  useEffect(() => {
    if (!target) { setOutput(''); return }
    setOutput('')
    let i = 0
    const id = setInterval(() => {
      i++
      setOutput(target.slice(0, i))
      if (i >= target.length) clearInterval(id)
    }, msPerChar)
    return () => clearInterval(id)
  }, [target, msPerChar])

  return output
}

// ─────────────────────────────────────────────────────────────────────────────
//
// HouseAnchor — the house as a free-standing illustration.
//
// Not a card. Not a widget. The house floats at the top of the layout,
// large, anchoring the composition. When tapped, it speaks: a single
// message appears inline beside it with a typewriter animation. Tap again
// to close. No modal. No sheet. The house is the voice of the property.
//
// Design notes:
//   — house is colored var(--accent) so it adapts to the active theme:
//     yellow at night, red in day, hot pink in evening, coral in morning.
//   — message text is uncontained — it lives directly on the page bg.
//   — the blinking cursor is the only animation artifact; remove it post-type.
//   — theme toggle is present for mobile (desktop uses the nav toggle).
//
// ─────────────────────────────────────────────────────────────────────────────

export default function HouseAnchor({ message, mood, themeMode, onThemeToggle }) {
  const [open,    setOpen]    = useState(false)
  const [pressed, setPressed] = useState(false)

  const displayedText = useTypewriter(open ? message : null)
  const isTyping      = open && displayedText.length < (message?.length ?? 0)

  function toggle() {
    setPressed(false)
    setOpen(o => !o)
  }

  return (
    <div style={{
      padding:    '32px 20px 12px',
      display:    'flex',
      alignItems: 'flex-start',
      gap:        20,
      position:   'relative',
    }}>

      {/* Theme toggle — top right; mobile only (desktop uses the nav) ────── */}
      <button
        className="mobile-only"
        onClick={onThemeToggle}
        title={`Theme: ${themeMode}`}
        style={{
          position:     'absolute',
          top:          20,
          right:        20,
          fontSize:     14,
          color:        'var(--text3)',
          padding:      '4px 8px',
          background:   'var(--bg2)',
          borderRadius: 'var(--radius-sm)',
          lineHeight:   1,
        }}
      >
        {THEME_ICONS[themeMode]}
      </button>

      {/* ── House — the primary object ──────────────────────────────────── */}
      <button
        onPointerDown={() => setPressed(true)}
        onPointerUp={toggle}
        onPointerLeave={() => setPressed(false)}
        aria-label={open ? 'Close house message' : 'Open house status'}
        style={{
          color:      'var(--accent)',
          padding:    0,
          flexShrink: 0,
          // Pressed: squash. Open: lift and enlarge. Rest: natural.
          transform: pressed
            ? 'scale(0.88)'
            : open
            ? 'scale(1.06) translateY(-6px)'
            : 'scale(1)',
          transition: pressed
            ? 'transform 70ms ease-in, color 350ms ease, filter 350ms ease'
            : 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1), color 350ms ease, filter 350ms ease',
          filter: open
            ? 'drop-shadow(0 10px 28px rgba(0,0,0,0.40))'
            : 'drop-shadow(0 4px 16px rgba(0,0,0,0.24))',
        }}
      >
        <HouseIcon size={130} />
      </button>

      {/* ── Inline message — no container, lives on the page ───────────── */}
      {open ? (
        <div style={{ flex: 1, minWidth: 0, paddingTop: 8 }}>
          <p style={{
            fontSize:      17,
            fontWeight:    400,
            lineHeight:    1.6,
            letterSpacing: '-0.01em',
            color:         'var(--text)',
          }}>
            {displayedText}

            {/* Blinking cursor — only while typing */}
            {isTyping && (
              <span
                aria-hidden="true"
                style={{
                  display:       'inline-block',
                  width:         2,
                  height:        '0.82em',
                  background:    'var(--accent)',
                  marginLeft:    3,
                  verticalAlign: 'middle',
                  borderRadius:  1,
                  animation:     'cursorBlink 0.65s step-end infinite',
                }}
              />
            )}
          </p>

          {/* Dismiss affordance — appears once typing finishes */}
          {!isTyping && (
            <button
              onClick={() => setOpen(false)}
              style={{
                display:       'block',
                marginTop:     18,
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color:         'var(--text3)',
              }}
            >
              — close
            </button>
          )}
        </div>
      ) : (
        // Very quiet affordance when closed — the house speaks for itself
        <p style={{
          paddingTop:    52,
          fontSize:      10,
          fontWeight:    600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color:         mood === 'urgent' ? 'var(--accent)' : 'var(--text3)',
          opacity:       0.6,
        }}>
          {mood === 'urgent' ? '! tap' : 'tap →'}
        </p>
      )}
    </div>
  )
}
