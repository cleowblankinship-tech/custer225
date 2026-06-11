import { useState, useEffect } from 'react'
import HouseIcon from './HouseIcon'

const THEME_ICONS = { auto: '◐', day: '☀', evening: '◑', night: '☾' }

function useTypewriter(target, msPerChar = 14) {
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

export default function HouseAnchor({ messages = [], mood, themeMode, onThemeToggle, notifPermission, onEnableNotifications }) {
  // The house is the dashboard narrator. It holds a deck of cards — one
  // focused thought each — and every tap on the house deals the next one,
  // wrapping back to the first.
  const [cardIdx, setCardIdx] = useState(0)
  const [pressed, setPressed] = useState(false)

  const deck    = messages.length ? messages : ['']
  const message = deck[cardIdx % deck.length]

  const displayedText = useTypewriter(message)
  const isTyping      = displayedText.length < (message?.length ?? 0)

  function dealNext() {
    setPressed(false)
    setCardIdx(i => i + 1)
  }

  // Wrapper animation: urgent shake takes priority; otherwise the house
  // idles with a slow float — it's the personality of the dashboard,
  // while the financial panels around it stay still.
  let wrapperAnimation = 'houseFloat 7s ease-in-out infinite'
  if (!pressed && mood === 'urgent') {
    wrapperAnimation = 'houseShake 0.5s ease-in-out infinite'
  }

  return (
    <div className="house-anchor" style={{
      padding:    '32px 20px 12px',
      display:    'flex',
      alignItems: 'flex-start',
      gap:        18,
      position:   'relative',
    }}>

      {/* Theme toggle — mobile only */}
      <button
        className="mobile-only"
        onClick={onThemeToggle}
        title={`Theme: ${themeMode}`}
        style={{
          position: 'absolute', top: 20, right: 20,
          fontSize: 14, color: 'var(--text3)',
          padding: '4px 8px', background: 'var(--bg2)',
          borderRadius: 'var(--radius-sm)', lineHeight: 1,
        }}
      >
        {THEME_ICONS[themeMode]}
      </button>

      {/* Idle animation wrapper — keeps keyframe transforms separate from press/open */}
      <div style={{ flexShrink: 0, animation: wrapperAnimation }}>
        <button
          onPointerDown={() => setPressed(true)}
          onPointerUp={dealNext}
          onPointerLeave={() => setPressed(false)}
          aria-label="Next house update"
          style={{
            color:   'var(--accent)',
            padding: 0,
            // Pressed: slight squash only. Open/rest: no movement.
            transform: pressed ? 'scale(0.93)' : 'scale(1)',
            transition: pressed
              ? 'transform 65ms ease-in, filter 200ms ease'
              : 'transform 200ms ease-out, filter 350ms ease',
            filter: mood === 'urgent'
              ? 'drop-shadow(0 4px 18px rgba(192,85,56,0.45))'
              : 'drop-shadow(0 6px 20px rgba(74,52,30,0.22))',
          }}
        >
          <HouseIcon size={169} windowOpacity={1} mood={mood} />
        </button>
      </div>

      {/* Inline message */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 8 }}>
          <p style={{
            fontSize: 17, fontWeight: 400, lineHeight: 1.6,
            letterSpacing: '-0.01em', color: 'var(--text)',
          }}>
            {displayedText}
            {isTyping && (
              <span aria-hidden="true" style={{
                display: 'inline-block', width: 2, height: '0.82em',
                background: 'var(--accent)', marginLeft: 3,
                verticalAlign: 'middle', borderRadius: 1,
                animation: 'cursorBlink 0.65s step-end infinite',
              }} />
            )}
          </p>

          {/* Notification prompt — once typing finishes, if not yet enabled */}
          {!isTyping && notifPermission === 'default' && onEnableNotifications && (
            <button
              onClick={onEnableNotifications}
              style={{
                display: 'block', marginTop: 18,
                fontSize: 10, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--accent)', background: 'var(--bg2)',
                padding: '4px 8px', borderRadius: 'var(--radius-sm)',
              }}
            >
              Enable booking alerts
            </button>
        )}
      </div>
    </div>
  )
}
