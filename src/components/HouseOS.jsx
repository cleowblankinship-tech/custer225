import { useState, useEffect, useRef } from 'react'
import HouseScene from './HouseScene'

// Where the running conversation lives between visits, so you can always see
// what you've been asking the house.
const CHAT_KEY = 'custer225_chat_v1'
const CHAT_MAX = 40

function loadChat() {
  try {
    const raw = localStorage.getItem(CHAT_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.slice(-CHAT_MAX) : []
  } catch {
    return []
  }
}

// ── HouseOS ───────────────────────────────────────────────────────────────────
//
// The house IS the interface. The home screen is a conversation with the
// property: the house front and center, its speech beneath, an Ask-the-House
// input, and a minimal strip of vitals. Dashboards (calendar, money, ledger)
// are supporting tools the house opens when a question calls for them.
//
// The house is alive: it floats gently, its chimney puffs, its door swings,
// birds pass and clouds drift, and its mailbox flag stands up when there's a
// notification. The world around it (trees, flowers, gardens, wildlife) grows
// as the property matures — see HouseScene, driven by the `scene` prop. The
// house's own beats are wired via `vitals` (hasGuest → steady smoke,
// hasMail → flag up).

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

// ── Transcript ────────────────────────────────────────────────────────────────
//
// The running record of the conversation, tucked into the space beside the
// house on wide screens and stacked below the input on phones. Your questions
// sit on the right in the house's warm accent; its replies answer back on the
// left. It scrolls to the newest exchange as you talk.
function Transcript({ items, onNavigate, onClear }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [items.length])

  if (!items.length) return null

  return (
    <div className="house-transcript" aria-label="Conversation with the house">
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10, padding: '0 2px',
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text3)',
        }}>
          Our conversation
        </span>
        <button
          onClick={onClear}
          title="Clear conversation"
          style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', padding: '2px 4px' }}
        >
          Clear
        </button>
      </div>

      <div className="house-transcript-scroll">
        {items.map(m => (
          <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {/* You asked */}
            <div style={{
              alignSelf: 'flex-end', maxWidth: '90%',
              background: 'var(--accent)', color: '#FFF5F7',
              fontSize: 13, lineHeight: 1.4, fontWeight: 500,
              padding: '8px 12px',
              borderRadius: '14px 14px 4px 14px',
            }}>
              {m.q}
            </div>

            {/* The house answered */}
            <div style={{
              alignSelf: 'flex-start', maxWidth: '92%',
              background: 'var(--bubble-bg)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 13, lineHeight: 1.45,
              padding: '8px 12px',
              borderRadius: '14px 14px 14px 4px',
            }}>
              {m.a}
              {m.view && (
                <button
                  onClick={() => onNavigate?.(m.view)}
                  style={{
                    display: 'block', marginTop: 6,
                    fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                  }}
                >
                  {m.viewLabel} →
                </button>
              )}
              {m.source === 'ai' && (
                <span title="Answered by the AI house" style={{
                  display: 'block', marginTop: 4, fontSize: 10, color: 'var(--text3)',
                }}>
                  ✦
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}

export default function HouseOS({
  messages = [],
  mood,
  vitals = null,          // { occupancyPct, hasGuest, hasMail } — drives house beats
  scene = null,           // { level, season, activity } — the evolving world
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
  const [thinking, setThinking] = useState(false)
  const [history,  setHistory]  = useState(loadChat)

  // Keep the conversation around between visits
  useEffect(() => {
    try { localStorage.setItem(CHAT_KEY, JSON.stringify(history.slice(-CHAT_MAX))) } catch { /* ignore */ }
  }, [history])

  const deck   = messages.length ? messages : ['']
  const speech = thinking ? 'Let me check my books…' : reply?.answer ?? deck[cardIdx % deck.length]

  const displayedText = useTypewriter(speech)
  const isTyping      = displayedText.length < (speech?.length ?? 0)

  // Tap the house: an answer yields back to the narration; otherwise deal
  // the next card from the deck
  function tapHouse() {
    setPressed(false)
    if (reply) { setReply(null); return }
    setCardIdx(i => i + 1)
  }

  // onAsk may be async (AI-backed) — show a brief "checking the books"
  // beat while the house thinks
  async function ask(text) {
    const trimmed = (text ?? question).trim()
    if (!trimmed || !onAsk || thinking) return
    setQuestion('')
    setThinking(true)
    try {
      const res = await onAsk(trimmed)
      // Record every exchange so the conversation stays visible beside the house
      if (res?.answer) {
        setHistory(h => [...h, {
          id:        Date.now() + '' + Math.random().toString(36).slice(2, 6),
          q:         trimmed,
          a:         res.answer,
          source:    res.source,
          view:      res.view,
          viewLabel: res.viewLabel,
        }].slice(-CHAT_MAX))
      }
      if (res?.autoOpen && res.view) { onNavigate?.(res.view); return }
      setReply(res)
    } finally {
      setThinking(false)
    }
  }

  // The scene holds still — only an urgent alert shakes it. (The house's own
  // small motions — smoke, door, wildlife — still play inside HouseScene.)
  const wrapperAnimation = (!pressed && mood === 'urgent') ? 'houseShake 0.5s ease-in-out infinite' : 'none'

  return (
    <div className="house-os">
    <div className="house-os__main" style={{
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
            // The house wears its own coat — bright storybook red, independent
            // of the marigold brand chrome around it
            color: '#D93425',
            padding: 0,
            transform: pressed ? 'scale(0.94)' : 'scale(1)',
            transition: pressed
              ? 'transform 65ms ease-in, filter 200ms ease'
              : 'transform 200ms ease-out, filter 350ms ease',
            filter: mood === 'urgent'
              ? 'drop-shadow(0 6px 22px rgba(224,106,78,0.50))'
              : 'drop-shadow(0 8px 26px rgba(92,52,26,0.22))',
          }}
        >
          <HouseScene size={250} mood={mood} vitals={vitals} scene={scene} />
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
        {reply?.view && !isTyping && !thinking && (
          <button
            onClick={() => onNavigate?.(reply.view)}
            style={{
              marginTop: 14, padding: '8px 18px',
              borderRadius: 999, background: 'var(--accent)',
              color: '#FFF5F7', fontSize: 13, fontWeight: 700,
            }}
          >
            {reply.viewLabel} →
          </button>
        )}

        {/* Tiny provenance mark — ✦ when Claude answered, quiet when the
            built-in rules did. Lets you verify the AI brain is connected. */}
        {reply && !isTyping && !thinking && (
          <p
            title={reply.source === 'ai' ? 'Answered by the AI house' : 'Answered by built-in rules'}
            style={{ marginTop: 10, fontSize: 11, color: 'var(--text3)', letterSpacing: '0.06em' }}
          >
            {reply.source === 'ai' ? '✦' : '· offline answer ·'}
          </p>
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
              background: 'var(--accent)', color: '#FFF5F7',
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

    {/* ── The conversation, beside the house (or below it on phones) ───────── */}
    <Transcript
      items={history}
      onNavigate={onNavigate}
      onClear={() => { setHistory([]); setReply(null) }}
    />
    </div>
  )
}
