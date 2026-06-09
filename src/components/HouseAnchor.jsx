import { useState, useEffect, useRef } from 'react'
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
  const [open,       setOpen]       = useState(false)
  const [pressed,    setPressed]    = useState(false)
  const [nudging,    setNudging]    = useState(false)
  const [winOpacity, setWinOpacity] = useState(1)
  const nudgeTimer  = useRef(null)
  const blinkTimer  = useRef(null)

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

  // Window blink: house "eyes" flutter shut every 4–11 seconds
  useEffect(() => {
    let id
    function scheduleBlink() {
      const delay = 4000 + Math.random() * 7000
      id = setTimeout(() => {
        setWinOpacity(0.06)
        setTimeout(() => { setWinOpacity(1); scheduleBlink() }, 130)
      }, delay)
    }
    scheduleBlink()
    return () => clearTimeout(id)
  }, [])

  // Idle animation: wrapper div carries it so press/open transforms on the
  // button layer compose cleanly on top without fighting the animation.
  let wrapperAnimation = ''
  if (!open && !pressed) {
    if (nudging)                  wrapperAnimation = 'houseNudge 0.55s ease-in-out'
    else if (mood === 'urgent')   wrapperAnimation = 'houseShake 0.5s ease-in-out infinite'
    else if (mood === 'attention') wrapperAnimation = 'housePulse 2.2s ease-in-out infinite'
    else                          wrapperAnimation = 'houseFloat 3.8s ease-in-out infinite'
  }

  return (
    <div style={{
      padding:    '32px 20px 12px',
      display:    'flex',
      alignItems: 'flex-start',
      gap:        20,
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
            // Pressed: squash + tilt. Open: lift + lean forward. Rest: natural.
            transform: pressed
              ? 'scale(0.86) rotate(-3deg)'
              : open
              ? 'scale(1.07) translateY(-10px) rotate(2deg)'
              : 'scale(1)',
            transition: pressed
              ? 'transform 65ms ease-in, filter 200ms ease'
              : 'transform 430ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 350ms ease',
            filter: open
              ? 'drop-shadow(0 14px 36px rgba(0,0,0,0.42))'
              : mood === 'urgent'
              ? 'drop-shadow(0 4px 18px rgba(192,85,56,0.45))'
              : 'drop-shadow(0 4px 16px rgba(0,0,0,0.20))',
          }}
        >
          <HouseIcon size={130} windowOpacity={winOpacity} />
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
