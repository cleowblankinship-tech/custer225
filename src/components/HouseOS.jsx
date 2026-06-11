import { useState, useEffect } from 'react'
import HouseIcon from './HouseIcon'

// ── HouseOS ───────────────────────────────────────────────────────────────────
//
// The house IS the interface. The home screen is a conversation with the
// property: the house front and center, its speech beneath, an Ask-the-House
// input, and a minimal strip of vitals. Dashboards (calendar, money, ledger)
// are supporting tools the house opens when a question calls for them.
//
// Animation policy (deliberate restraint): chimney smoke + a slow idle float
// keep the house alive. HouseIcon receives a `vitals` prop so future
// state-based animations (window lights during stays, blooming flowers on
// strong revenue, mailbox flags on new bookings) can bind to real property
// data without restructuring this component.

const THEME_ICONS = { auto: '◐', day: '☀', evening: '◑', night: '☾' }

const SUGGESTIONS = [
  'How are we doing this month?',
  'Who checks in next?',
  'What bills need attention?',
  'How much cash flow do we have?',
]

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

export default function HouseOS({
  messages = [],
  mood,
  vitals = null,          // { occupancyPct, hasGuest, revenueAhead } — future animation hooks
  stats = [],             // [{ label, value, view }] minimal supporting info
  onAsk,                  // (question) => { answer, view, viewLabel, autoOpen }
  onNavigate,             // (view) => void
  themeMode, onThemeToggle,
  notifPermission, onEnableNotifications,
}) {
  const [cardIdx,  setCardIdx]  = useState(0)
  const [pressed,  setPressed]  = useState(false)
  const [question, setQuestion] = useState('')
  const [reply,    setReply]    = useState(null)

  const deck   = messages.length ? messages : ['']
  const speech = reply?.answer ?? deck[cardIdx % deck.length]

  const displayedText = useTypewriter(speech)
  const isTyping      = displayedText.length < (speech?.length ?? 0)

  // Tap the house: an answer yields back to the narration; otherwise deal
  // the next card from the deck
  function tapHouse() {
    setPressed(false)
    if (reply) { setReply(null); return }
    setCardIdx(i => i + 1)
  }

  function ask(text) {
    const trimmed = (text ?? question).trim()
    if (!trimmed || !onAsk) return
    const res = onAsk(trimmed)
    setQuestion('')
    if (res?.autoOpen && res.view) { onNavigate?.(res.view); return }
    setReply(res)
  }

  let wrapperAnimation = 'houseFloat 7s ease-in-out infinite'
  if (!pressed && mood === 'urgent') wrapperAnimation = 'houseShake 0.5s ease-in-out infinite'

  return (
    <div style={{
      maxWidth: 620, margin: '0 auto', width: '100%',
      padding: '40px 24px 24px', position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>

      {/* Theme toggle — mobile only (desktop has it in the top nav) */}
      <button
        className="mobile-only"
        onClick={onThemeToggle}
        title={`Theme: ${themeMode}`}
        style={{
          position: 'absolute', top: 16, right: 16,
          fontSize: 14, color: 'var(--text3)',
          padding: '4px 8px', background: 'var(--bg2)',
          borderRadius: 'var(--radius-sm)', lineHeight: 1,
        }}
      >
        {THEME_ICONS[themeMode]}
      </button>

      {/* ── The house — the interface itself ─────────────────────────────── */}
      <div style={{ animation: wrapperAnimation }}>
        <button
          onPointerDown={() => setPressed(true)}
          onPointerUp={tapHouse}
          onPointerLeave={() => setPressed(false)}
          aria-label="Talk to the house"
          style={{
            color: 'var(--accent)',
            padding: 0,
            transform: pressed ? 'scale(0.94)' : 'scale(1)',
            transition: pressed
              ? 'transform 65ms ease-in, filter 200ms ease'
              : 'transform 200ms ease-out, filter 350ms ease',
            filter: mood === 'urgent'
              ? 'drop-shadow(0 6px 22px rgba(192,85,56,0.45))'
              : 'drop-shadow(0 8px 26px rgba(92,52,26,0.22))',
          }}
        >
          <HouseIcon size={210} windowOpacity={1} mood={mood} vitals={vitals} />
        </button>
      </div>

      {/* ── Speech ────────────────────────────────────────────────────────── */}
      <div style={{ minHeight: 96, marginTop: 22, textAlign: 'center', width: '100%' }}>
        <p style={{
          fontSize: 18, fontWeight: 450, lineHeight: 1.6,
          letterSpacing: '-0.01em', color: 'var(--text)',
          maxWidth: 520, margin: '0 auto',
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

        {/* Supporting view affordance — appears once the answer lands */}
        {reply?.view && !isTyping && (
          <button
            onClick={() => onNavigate?.(reply.view)}
            style={{
              marginTop: 14, padding: '8px 18px',
              borderRadius: 999, background: 'var(--accent)',
              color: '#FFF6EA', fontSize: 13, fontWeight: 700,
            }}
          >
            {reply.viewLabel} →
          </button>
        )}
      </div>

      {/* ── Ask the House ─────────────────────────────────────────────────── */}
      <div style={{ width: '100%', maxWidth: 520, marginTop: 18 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ask()}
            placeholder="Ask the house…"
            style={{
              height: 48, borderRadius: 999, padding: '0 20px',
              fontSize: 15, background: 'var(--bubble-bg)',
              border: '1.5px solid var(--border-mid)',
            }}
          />
          <button
            onClick={() => ask()}
            disabled={!question.trim()}
            aria-label="Ask"
            style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: 'var(--accent)', color: '#FFF6EA',
              fontSize: 18, fontWeight: 700,
              opacity: question.trim() ? 1 : 0.5,
              transition: 'opacity 150ms ease',
            }}
          >
            ↑
          </button>
        </div>

        {/* Suggestion chips */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          justifyContent: 'center', marginTop: 12,
        }}>
          {SUGGESTIONS.map(sug => (
            <button
              key={sug}
              onClick={() => ask(sug)}
              style={{
                fontSize: 12, fontWeight: 600, color: 'var(--text2)',
                background: 'var(--bg2)', padding: '6px 12px',
                borderRadius: 999,
              }}
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* ── Minimal vitals strip ──────────────────────────────────────────── */}
      {stats.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          gap: 10, width: '100%', maxWidth: 520, marginTop: 26,
        }}>
          {stats.map(s => (
            <button
              key={s.label}
              onClick={() => s.view && onNavigate?.(s.view)}
              style={{
                background: 'var(--bubble-bg)',
                border: '1px solid var(--border)',
                borderRadius: 14, padding: '12px 10px',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: s.color ?? 'var(--text)' }}>
                {s.value}
              </p>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 2 }}>
                {s.label}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Notification prompt */}
      {notifPermission === 'default' && onEnableNotifications && (
        <button
          onClick={onEnableNotifications}
          style={{
            marginTop: 20, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--accent)', background: 'var(--bg2)',
            padding: '5px 10px', borderRadius: 'var(--radius-sm)',
          }}
        >
          Enable booking alerts
        </button>
      )}
    </div>
  )
}
