import { useState, useEffect, useRef } from 'react'
// blinkTimer removed — window opacity is now fixed
import HouseIcon from './HouseIcon'

const THEME_ICONS = { auto: '◐', day: '☀', evening: '◑', night: '☾' }

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

export default function HouseAnchor({ message, mood, themeMode, onThemeToggle, notifPermission, onEnableNotifications }) {
  // The house is the dashboard narrator — its bubble is open by default and
  // retells the current message; tapping the house toggles it off/on.
  const [open,    setOpen]    = useState(true)
  const [pressed, setPressed] = useState(false)
  const [nudging, setNudging] = useState(false)
  const nudgeTimer = useRef(null)

  const displayedText = useTypewriter(open ? message : null)
  const isTyping      = open && displayedText.length < (message?.length ?? 0)

  function toggle() {
    setPressed(false)
    setNudging(false)
    setOpen(o => !o)
  }

  // Attention-nudge: wiggle once after 8s of unread message, then every 20s
  useEffect(() => {
    clearTimeout(nudgeTimer.current)
    clearInterval(nudgeTimer.current)
    if (open || !message) return

    nudgeTimer.current = setTimeout(() => {
      const fire = () => {
        setNudging(true)
        setTimeout(() => setNudging(false), 550)
      }
      fire()
      nudgeTimer.current = setInterval(fire, 20000)
    }, 8000)

    return () => { clearTimeout(nudgeTimer.current); clearInterval(nudgeTimer.current) }
  }, [open, message])

  // Wrapper animation: urgent shake and nudge take priority; otherwise the
  // house idles with a slow float — it's the personality of the dashboard,
  // while the financial panels around it stay still.
  let wrapperAnimation = 'houseFloat 7s ease-in-out infinite'
  if (!pressed) {
    if (nudging && !open)       wrapperAnimation = 'houseNudge 0.55s ease-in-out'
    else if (mood === 'urgent') wrapperAnimation = 'houseShake 0.5s ease-in-out infinite'
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
          onPointerUp={toggle}
          onPointerLeave={() => setPressed(false)}
          aria-label={open ? 'Close house message' : 'Open house status'}
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
      {open && (
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
      )}
    </div>
  )
}
