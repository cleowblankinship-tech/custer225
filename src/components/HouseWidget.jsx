import { useState } from 'react'
import HouseIcon from './HouseIcon'

// ── Theme toggle config ────────────────────────────────────────────────────────
const THEME_CYCLE  = ['auto', 'day', 'evening', 'night']
const THEME_ICONS  = { auto: '◐', day: '☀', evening: '◑', night: '☾' }
const THEME_LABELS = {
  auto:    'Theme: Auto',
  day:     'Theme: Day',
  evening: 'Theme: Evening',
  night:   'Theme: Night',
}

// ─────────────────────────────────────────────────────────────────────────────
//
// HouseWidget — the house as a primary dashboard object.
//
// Not a hero banner. Not a logo. A functional panel that anchors the
// left column, communicates property status, and invites interaction.
// The house icon IS the brand mark of 225 Custer; its color is drawn
// from var(--accent) so it adapts to the active theme.
//
// ─────────────────────────────────────────────────────────────────────────────

export default function HouseWidget({
  message,
  moodStyle,
  extraCount,
  onOpen,
  themeMode,
  onThemeToggle,
}) {
  const [pressed, setPressed] = useState(false)

  return (
    <div style={{ padding: '0 20px 4px' }}>
      <div style={{
        background:   'var(--bg2)',
        borderRadius: 'var(--radius)',
        overflow:     'hidden',
      }}>

        {/* ── House + identity ─────────────────────────────────────────── */}
        <div style={{
          padding:    '22px 20px 18px',
          display:    'flex',
          alignItems: 'flex-start',
          gap:        18,
        }}>

          {/* House icon — the interactive anchor */}
          <button
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => { setPressed(false); onOpen?.() }}
            onPointerLeave={() => setPressed(false)}
            aria-label="Open house status"
            style={{
              color:      'var(--accent)',
              flexShrink: 0,
              padding:    0,
              transform:  pressed ? 'scale(0.88)' : 'scale(1)',
              transition: pressed
                ? 'transform 60ms ease-in, color 350ms ease'
                : 'transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1), color 350ms ease',
              filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.22))',
            }}
          >
            <HouseIcon size={88} />
          </button>

          {/* Property identity + theme toggle */}
          <div style={{ flex: 1, paddingTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <p style={{
                  fontSize:      22,
                  fontWeight:    800,
                  letterSpacing: '-0.03em',
                  lineHeight:    1,
                  color:         'var(--text)',
                }}>
                  225 Custer
                </p>
                <p style={{
                  fontSize:      10,
                  fontWeight:    700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color:         'var(--text3)',
                  marginTop:     6,
                }}>
                  Colorado Springs · STR
                </p>
              </div>

              {/* Theme toggle */}
              <button
                onClick={onThemeToggle}
                aria-label={THEME_LABELS[themeMode]}
                title={THEME_LABELS[themeMode]}
                style={{
                  fontSize:     14,
                  color:        'var(--text3)',
                  padding:      '4px 9px',
                  background:   'var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  lineHeight:   1,
                  flexShrink:   0,
                  transition:   'color 250ms ease',
                }}
              >
                {THEME_ICONS[themeMode]}
              </button>
            </div>
          </div>
        </div>

        {/* ── Status message — tap to open full panel ───────────────────── */}
        {message && (
          <button
            onClick={() => onOpen?.()}
            style={{
              display:    'block',
              width:      '100%',
              textAlign:  'left',
              padding:    '14px 20px 18px',
              borderTop:  '1px solid var(--border)',
            }}
          >
            <p style={{
              fontSize:   14,
              fontWeight: moodStyle?.textWeight ?? 400,
              color:      'var(--text)',
              lineHeight: 1.45,
            }}>
              {message}
            </p>

            {extraCount > 0 && (
              <p style={{
                fontSize:  11,
                color:     'var(--text3)',
                marginTop: 4,
              }}>
                +{extraCount} more update{extraCount > 1 ? 's' : ''}
              </p>
            )}

            <p style={{
              fontSize:   11,
              fontWeight: 700,
              color:      'var(--accent)',
              marginTop:  10,
              letterSpacing: '0.02em',
            }}>
              View full status →
            </p>
          </button>
        )}
      </div>
    </div>
  )
}
