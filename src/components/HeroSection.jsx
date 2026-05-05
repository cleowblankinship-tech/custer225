import { useState } from 'react'
import HouseIcon from './HouseIcon'

// ── Painting collection ────────────────────────────────────────────────────────
//
// 5 public-domain impressionist landscapes (all pre-1928 → US public domain).
// Served via Wikimedia Commons Special:FilePath redirect → upload.wikimedia.org.
// ?width=960 returns a WebP/JPEG thumbnail sized for mobile 2× retina (480px).
//
// ── House color derivation ────────────────────────────────────────────────────
// For each painting, the house color was derived by:
//   1. Visually sampling the dominant tones in the house placement zone
//   2. Adjusting: lighten or darken to ensure clear separation from background
//   3. Biasing toward app palette: terracotta (#C05538), bark (#8B6348),
//      warm stone (#C4A068), muted olive (#788C50)
// Result: house reads as belonging to the scene but is always clearly visible.
//
// ── House placement ───────────────────────────────────────────────────────────
// houseX / houseY: percentage coordinates within the hero div.
// All placements are in the lower-left or lower-right third (never centered).
// Y ≈ 40–50%: near the horizon or just below it — where structures belong.
// Varies per painting to honor each composition.
//
// ── Object position ──────────────────────────────────────────────────────────
// object-fit: cover on a 2:1 hero crops most paintings (which are 3:2 or 4:3).
// objectPosition biases the crop toward the most useful part of the composition.

const PAINTINGS = [
  {
    id: 'monet-poppies',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Monet_Poppies.jpg?width=960',
    alt: 'Poppies near Argenteuil — Claude Monet, 1873',
    // Placement zone: left tree cluster and field edge.
    // Sampled tones: mid-green + dark earth. → Darkened + shifted terracotta.
    houseColor: '#A0502A',
    houseX: 20,   // left third
    houseY: 50,   // just below horizon (~40%)
    objectPosition: 'center 58%',
  },
  {
    id: 'constable-hay-wain',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/John_Constable_The_Hay_Wain.jpg?width=960',
    alt: 'The Hay Wain — John Constable, 1821',
    // Placement zone: right bank, where the mill/cottage already sits.
    // Sampled tones: deep green trees + brown earth. → Warm stone, lightened.
    houseColor: '#C4A068',
    houseX: 74,   // right third
    houseY: 44,
    objectPosition: 'center 42%',
  },
  {
    id: 'pissarro-harvest',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Camille_Pissarro_-_The_Harvest_-_Google_Art_Project.jpg?width=960',
    alt: 'The Harvest — Camille Pissarro, 1882',
    // Placement zone: upper right edge of the field, near tree line.
    // Sampled tones: golden wheat + warm shadow. → Deepened bark brown.
    houseColor: '#7A5030',
    houseX: 74,
    houseY: 40,
    objectPosition: 'center 48%',
  },
  {
    id: 'sisley-terrace-spring',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Alfred_Sisley_-_The_Terrace_at_Saint-Germain,_Spring_-_Google_Art_Project.jpg?width=960',
    alt: 'The Terrace at Saint-Germain, Spring — Alfred Sisley, c.1875',
    // Placement zone: left path edge, under the spring canopy.
    // Sampled tones: cool blue-green + pale sky. → Muted warm olive-tan.
    houseColor: '#8C7048',
    houseX: 18,
    houseY: 46,
    objectPosition: 'center 52%',
  },
  {
    id: 'pissarro-hay-eragny',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Hay_Harvest_at_%C3%89ragny,_1901,_Camille_Pissarro.jpg?width=960',
    alt: 'Hay Harvest at Éragny — Camille Pissarro, 1901',
    // Placement zone: left field boundary, near the working figures.
    // Sampled tones: bright straw + warm green. → App terracotta; stands out.
    houseColor: '#C05538',
    houseX: 16,
    houseY: 44,
    objectPosition: 'center 50%',
  },
]

// ── Deterministic daily rotation ───────────────────────────────────────────────
// Same painting all day; rotates at midnight. No useState / randomness needed.
function getTodaysPainting() {
  const d          = new Date()
  const dayOfYear  = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86_400_000)
  return PAINTINGS[dayOfYear % PAINTINGS.length]
}

// ── ↑ / ↓ perspectives — dry, context-aware ───────────────────────────────────
// One short sentence per line. No labels. Never feels like roleplay.
function getPerspectives(setupStats, totalRevenue) {
  if (!setupStats) return null
  if (setupStats.pct < 100) {
    const pct = setupStats.pct
    if (pct === 0)  return { up: 'A fresh start.',       down: 'A long way to go.'   }
    if (pct < 50)   return { up: 'Progress is real.',    down: 'Still not listed.'    }
    return                 { up: 'Almost ready.',        down: 'Not there yet.'       }
  }
  if (totalRevenue === 0) return { up: 'First booking ahead.', down: 'Calendar is empty.' }
  return                         { up: 'Money coming in.',     down: 'Expenses are too.'  }
}

// ── Theme-sensitive overlay ────────────────────────────────────────────────────
// Sits above the painting. Mutes it further and shifts it toward the app palette.
// Night mode: dark warm veil. Light modes: soft warm wash.
function getOverlay(themeMode) {
  if (themeMode === 'night')   return 'rgba(20, 10, 5, 0.52)'
  if (themeMode === 'evening') return 'rgba(240, 195, 140, 0.30)'
  if (themeMode === 'morning') return 'rgba(255, 238, 215, 0.28)'
  return 'rgba(255, 248, 235, 0.28)'   // day / auto
}

// ── Theme toggle cycle (mirrors App.jsx) ──────────────────────────────────────
const THEME_CYCLE  = ['auto', 'day', 'evening', 'night']
const THEME_ICONS  = { auto: '◐', day: '☀', evening: '◑', night: '☾' }
const THEME_LABELS = {
  auto:    'Theme: Auto (follows time of day). Tap to switch.',
  day:     'Theme: Day mode. Tap to switch.',
  evening: 'Theme: Evening mode. Tap to switch.',
  night:   'Theme: Night mode. Tap to switch.',
}

// ─────────────────────────────────────────────────────────────────────────────

export default function HeroSection({
  moodStyle,
  message,
  extraCount,
  onOpen,           // opens HouseToday panel
  weatherBlurb,
  setupStats,
  totalRevenue,
  themeMode,
  onThemeToggle,
}) {
  const painting      = getTodaysPainting()
  const [loaded,  setLoaded]  = useState(false)
  const [visible, setVisible] = useState(false)   // speech bubble
  const [pressed, setPressed] = useState(false)   // house press state

  const perspectives   = getPerspectives(setupStats, totalRevenue)
  const overlayColor   = getOverlay(themeMode)
  const isNight        = themeMode === 'night'
  const nextTheme      = THEME_CYCLE[(THEME_CYCLE.indexOf(themeMode) + 1) % THEME_CYCLE.length]

  // Bubble appears opposite the house: if house is left → bubble right, and vice versa
  const bubbleOnLeft = painting.houseX > 50

  return (
    <div
      style={{
        position:   'relative',
        height:     'min(260px, 31vh)',
        minHeight:  180,
        overflow:   'hidden',
        // Warm neutral placeholder while image loads
        background: '#CDC3B0',
        // No borderBottom — the gradient fade handles the visual separation
        // between hero and dashboard. The card overlap reinforces the join.
      }}
    >
      {/* ── Landscape painting ──────────────────────────────────────────── */}
      {/*
        scale(1.04): prevents the blur filter from exposing white edges.
        saturate(0.45): reduces vibrancy by ~55% — painting becomes atmosphere.
        contrast(0.88): gently lowers contrast so it recedes behind the UI.
        blur(1.2px): subtle softening — reinforces that this is backdrop, not content.
      */}
      <img
        src={painting.src}
        alt={painting.alt}
        onLoad={() => setLoaded(true)}
        style={{
          position:       'absolute',
          inset:          0,
          width:          '100%',
          height:         '100%',
          objectFit:      'cover',
          objectPosition: painting.objectPosition,
          filter:         'saturate(0.45) contrast(0.88) blur(1.2px)',
          transform:      'scale(1.04)',
          transition:     'opacity 0.55s ease',
          opacity:        loaded ? 1 : 0,
          userSelect:     'none',
          pointerEvents:  'none',
        }}
      />

      {/* ── Theme-sensitive color wash ───────────────────────────────────── */}
      <div
        style={{
          position:      'absolute',
          inset:         0,
          background:    overlayColor,
          transition:    'background 0.35s ease',
          pointerEvents: 'none',
        }}
      />

      {/* ── Bottom gradient fade ─────────────────────────────────────────── */}
      {/*
        Fades the painting into the page background color at the bottom edge.
        This creates a seamless visual join between hero and dashboard, and
        makes the card-overlap effect feel natural rather than abrupt.

        Height: 55% of hero — a very gradual fade starting near mid-hero.
        zIndex: 1 — above painting/overlay (z:0), below house (z:5).

        Gradient target is var(--bg): typed @property, so it transitions
        smoothly when the theme changes, matching the background color exactly
        in all modes (cream → tan → deep brown).
      */}
      <div
        style={{
          position:      'absolute',
          bottom:        0,
          left:          0,
          right:         0,
          height:        '55%',
          background:    'linear-gradient(to bottom, transparent, var(--bg))',
          zIndex:        1,
          pointerEvents: 'none',
          // Transition the gradient itself when theme switches.
          // Works because --bg is a typed @property <color>.
          transition:    '--bg 350ms ease',
        }}
      />

      {/* ── Speech bubble (appears on house tap) ────────────────────────── */}
      {/*
        Positioned relative to the house (not the hero top) so it feels
        anchored to the scene. bubbleTopPct = houseY * 0.40 places the
        bubble at ~40% of the house's Y offset — in the upper portion of
        the hero but clearly above the horizon/house rather than pinned
        to the very top edge.

        CSS max() ensures the bubble clears the iOS notch/island when the
        percentage resolves smaller than the safe-area inset.
      */}
      {visible && (() => {
        const bubbleTopPct = Math.round(painting.houseY * 0.40)
        return (
        <div
          style={{
            position:  'absolute',
            top:       `max(calc(env(safe-area-inset-top, 0px) + 8px), ${bubbleTopPct}%)`,
            left:      bubbleOnLeft ? 14  : 'auto',
            right:     bubbleOnLeft ? 'auto' : 14,
            maxWidth:  '68%',
            zIndex:    10,
            animation: 'heroBubbleIn 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
          {/*
            Tapping the bubble opens the full HouseToday panel (same as before).
            The bubble itself is display-only — the panel has the detail.
          */}
          <button
            onClick={onOpen}
            style={{
              width:        '100%',
              textAlign:    'left',
              background:   'var(--bubble-bg)',
              border:       '1px solid var(--bubble-border)',
              borderRadius: 'var(--radius)',
              padding:      '12px 14px',
              boxShadow:    '0 4px 20px rgba(0,0,0,0.20), 0 1px 4px rgba(0,0,0,0.10)',
            }}
          >
            {/* Main message */}
            <span style={{
              display:      'block',
              fontSize:     13,
              fontWeight:   moodStyle.textWeight,
              color:        'var(--text)',
              lineHeight:   1.35,
              marginBottom: perspectives ? 8 : 0,
            }}>
              {message}
            </span>

            {/* ↑/↓ dual-perspective lines */}
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

            {/* Weather blurb — only if present, separated by a hairline */}
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

            {/* "+N more" — subtle, same as main bubble */}
            {extraCount > 0 && (
              <span style={{
                display:   'block',
                fontSize:  11,
                color:     moodStyle.moreColor,
                marginTop: 5,
              }}>
                +{extraCount} more
              </span>
            )}
          </button>
        </div>
        )
      })()}

      {/* ── House icon + contrast assist ─────────────────────────────────── */}
      {/*
        Positioned at (houseX%, houseY%) relative to hero.
        translate(-50%, -50%) centers the icon on that point.
        Contrast assist: radial gradient behind the icon — nearly invisible,
        just enough to keep it readable against complex painting textures.
        House opacity: always 100% (per spec). Color: presampled per painting.
      */}
      <div
        style={{
          position:  'absolute',
          left:      `${painting.houseX}%`,
          top:       `${painting.houseY}%`,
          transform: 'translate(-50%, -50%)',
          zIndex:    5,
        }}
      >
        {/* Contrast assist — radial veil, barely perceptible */}
        <div
          style={{
            position:     'absolute',
            inset:        -20,
            borderRadius: '50%',
            background:   isNight
              ? 'radial-gradient(circle, rgba(0,0,0,0.30) 0%, transparent 68%)'
              : 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 68%)',
            pointerEvents: 'none',
          }}
        />

        {/* The house — main character of the hero */}
        <button
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => {
            setPressed(false)
            setVisible(v => !v)
          }}
          onPointerLeave={() => setPressed(false)}
          aria-label="Show house status"
          style={{
            position:   'relative',
            padding:    6,
            color:      painting.houseColor,
            // Scale: pressed → squeeze; bubble open → slight lift; default → rest
            transform:  pressed
              ? 'scale(0.86)'
              : visible ? 'scale(1.07)' : 'scale(1)',
            transition: pressed
              ? 'transform 70ms ease-in'
              : 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            // drop-shadow lifts the icon off the painting without the contrast assist
            filter:     'drop-shadow(0 2px 5px rgba(0,0,0,0.32))',
          }}
        >
          <HouseIcon size={54} />
        </button>
      </div>

      {/* ── Theme toggle ─────────────────────────────────────────────────── */}
      {/*
        Sits top-right, above the safe area inset (accounts for iOS notch/island).
        Uses a frosted-glass style (backdrop-filter blur) so it reads against
        any painting without a hard background.
      */}
      <button
        onClick={onThemeToggle}
        aria-label={THEME_LABELS[themeMode]}
        title={`Theme: ${themeMode}`}
        style={{
          position:           'absolute',
          top:                'calc(env(safe-area-inset-top, 0px) + 10px)',
          right:              12,
          zIndex:             10,
          fontSize:           15,
          color:              isNight ? 'rgba(247,240,229,0.65)' : 'rgba(26,10,4,0.45)',
          padding:            '7px 10px',
          lineHeight:         1,
          minWidth:           36,
          minHeight:          36,
          display:            'flex',
          alignItems:         'center',
          justifyContent:     'center',
          background:         isNight ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.22)',
          borderRadius:       'var(--radius-sm)',
          backdropFilter:     'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border:             isNight
            ? '0.5px solid rgba(255,255,255,0.10)'
            : '0.5px solid rgba(0,0,0,0.10)',
        }}
      >
        {THEME_ICONS[themeMode]}
      </button>
    </div>
  )
}
