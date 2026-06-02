import { useState } from 'react'
import HouseIcon from './HouseIcon'
import { getTimeOfDay } from '../lib/theme'

// ── Theme toggle config ────────────────────────────────────────────────────────
const THEME_CYCLE  = ['auto', 'day', 'evening', 'night']
const THEME_ICONS  = { auto: '◐', day: '☀', evening: '◑', night: '☾' }
const THEME_LABELS = {
  auto:    'Theme: Auto. Tap to switch.',
  day:     'Theme: Day. Tap to switch.',
  evening: 'Theme: Evening. Tap to switch.',
  night:   'Theme: Night. Tap to switch.',
}

// ── Perspective lines for speech bubble ───────────────────────────────────────
function getPerspectives(setupStats, totalRevenue) {
  if (!setupStats) return null
  if (setupStats.pct < 100) {
    const pct = setupStats.pct
    if (pct === 0)  return { up: 'A fresh start.',    down: 'A long way to go.' }
    if (pct < 50)   return { up: 'Progress is real.', down: 'Still not listed.'  }
    return                 { up: 'Almost ready.',     down: 'Not there yet.'     }
  }
  if (totalRevenue === 0) return { up: 'First booking ahead.', down: 'Calendar is empty.' }
  return                         { up: 'Money coming in.',     down: 'Expenses are too.'  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function HeroSection({
  moodStyle,
  message,
  extraCount,
  onOpen,
  weatherBlurb,
  setupStats,
  totalRevenue,
  themeMode,
  onThemeToggle,
}) {
  const [visible, setVisible] = useState(false)
  const [pressed, setPressed] = useState(false)

  const perspectives = getPerspectives(setupStats, totalRevenue)

  // Resolve 'auto' to a concrete mode for styling
  const resolvedMode = themeMode === 'auto' ? getTimeOfDay() : themeMode

  return (
    <div style={{
      position:   'relative',
      background: 'var(--header-bg)',
      transition: 'background 350ms ease',
      padding:    `calc(env(safe-area-inset-top, 0px) + 16px) 20px 22px`,
    }}>

      {/* ── Top row: theme toggle ────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button
          onClick={onThemeToggle}
          aria-label={THEME_LABELS[themeMode]}
          title={`Theme: ${themeMode}`}
          style={{
            fontSize:      14,
            color:         'var(--header-sub)',
            padding:       '5px 11px',
            background:    'rgba(128,128,128,0.14)',
            borderRadius:  'var(--radius-sm)',
            lineHeight:    1,
            letterSpacing: '0.02em',
            transition:    'color 250ms ease',
          }}
        >
          {THEME_ICONS[themeMode]}
        </button>
      </div>

      {/* ── Main row: house icon + property name ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

        {/* House — tappable mascot/brand mark */}
        <button
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => { setPressed(false); setVisible(v => !v) }}
          onPointerLeave={() => setPressed(false)}
          aria-label="Show house status"
          style={{
            color:      'var(--header-text)',
            padding:    0,
            flexShrink: 0,
            transform:  pressed
              ? 'scale(0.88)'
              : visible
                ? 'scale(1.06) translateY(-2px)'
                : 'scale(1)',
            transition: pressed
              ? 'transform 70ms ease-in, color 350ms ease'
              : 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), color 350ms ease',
            filter:     'drop-shadow(0 2px 8px rgba(0,0,0,0.18))',
          }}
        >
          <HouseIcon size={62} />
        </button>

        {/* Property identity */}
        <div>
          <p style={{
            fontSize:      28,
            fontWeight:    800,
            letterSpacing: '-0.03em',
            lineHeight:    1,
            color:         'var(--header-text)',
            transition:    'color 350ms ease',
          }}>
            225 Custer
          </p>
          <p style={{
            fontSize:      11,
            fontWeight:    600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color:         'var(--header-sub)',
            marginTop:     5,
            transition:    'color 250ms ease',
          }}>
            Colorado Springs · STR
          </p>
        </div>
      </div>

      {/* ── Speech bubble ────────────────────────────────────────────────── */}
      {/*
        Floats below the header, above the card content (z:20).
        Tap the house again or tap the bubble to open the full panel.
      */}
      {visible && (
        <div style={{
          position:  'absolute',
          top:       '100%',
          left:      20,
          marginTop: 10,
          maxWidth:  'calc(100% - 40px)',
          zIndex:    20,
          animation: 'heroBubbleIn 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
        }}>
          <button
            onClick={() => { setVisible(false); onOpen?.() }}
            style={{
              width:        '100%',
              textAlign:    'left',
              background:   'var(--bubble-bg)',
              border:       '1px solid var(--bubble-border)',
              borderRadius: 'var(--radius)',
              padding:      '13px 15px',
              boxShadow:    '0 4px 24px rgba(0,0,0,0.20), 0 1px 4px rgba(0,0,0,0.10)',
            }}
          >
            <span style={{
              display:      'block',
              fontSize:     13,
              fontWeight:   moodStyle?.textWeight ?? 400,
              color:        'var(--text)',
              lineHeight:   1.35,
              marginBottom: perspectives ? 8 : 0,
            }}>
              {message}
            </span>

            {perspectives && (
              <span style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--bubble-sub)', lineHeight: 1.55 }}>
                  ↑ {perspectives.up}
                </span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--bubble-sub)', lineHeight: 1.55 }}>
                  ↓ {perspectives.down}
                </span>
              </span>
            )}

            {weatherBlurb && (
              <span style={{
                display:    'block',
                fontSize:   11,
                color:      'var(--bubble-sub)',
                marginTop:  7,
                paddingTop: 7,
                borderTop:  '0.5px solid var(--border)',
                lineHeight: 1.35,
              }}>
                {weatherBlurb}
              </span>
            )}

            {extraCount > 0 && (
              <span style={{
                display:   'block',
                fontSize:  11,
                color:     moodStyle?.moreColor ?? 'var(--accent)',
                marginTop: 5,
              }}>
                +{extraCount} more
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
