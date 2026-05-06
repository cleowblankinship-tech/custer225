import { useState, useRef, useEffect } from 'react'
import HouseIcon from './HouseIcon'

// ── Painting collection ────────────────────────────────────────────────────────
//
// 5 public-domain impressionist landscapes (all pre-1928 → US public domain).
// Served via Wikimedia Commons Special:FilePath → upload.wikimedia.org CDN.
// ?width=960 returns a thumbnail sized for mobile 2× retina (480px display).
//
// ── pos: { x, y } — normalized 0–1 coordinates ───────────────────────────────
//   x: 0.0 = left edge   →  1.0 = right edge
//   y: 0.0 = top edge    →  1.0 = bottom edge
//
// Placement rules:
//   • Left or right third (x < 0.35 or x > 0.65) — never centered
//   • y ≈ 0.42–0.48 — base sits at or just above the compositional horizon
//   • Avoid existing structures visible in each painting (documented inline)
//
// ── House color ───────────────────────────────────────────────────────────────
// Sampled from the placement zone, then:
//   1. Increased contrast vs. local background
//   2. Slightly boosted saturation / warmth
//   3. Biased toward: terracotta #CC4A2C · bark #8A5228 · ochre #C48C38
// House should feel harmonious with the painting but a step more vivid.
//
// ── Dev tool ─────────────────────────────────────────────────────────────────
// Long-press the house icon (600ms) to enter drag mode. Drag to position.
// Release logs final { x, y } to console. Copy into pos: {} below.

const PAINTINGS = [
  {
    id: 'monet-poppies',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Monet_Poppies.jpg?width=960',
    alt: 'Poppies near Argenteuil — Claude Monet, 1873',
    // No existing structures. Left field edge near the tree cluster.
    // Sampled: warm mid-green + earth shadow → vivid red-brown.
    houseColor:     '#B85228',
    pos:            { x: 0.20, y: 0.47 },
    objectPosition: 'center 58%',
  },
  {
    id: 'constable-hay-wain',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/John_Constable_The_Hay_Wain.jpg?width=960',
    alt: 'The Hay Wain — John Constable, 1821',
    // Existing cottage/mill visible right-of-center (~70–80% x).
    // Icon on LEFT bank (tall tree / water's edge) to avoid that structure.
    // Sampled: deep green bank + warm dappled light → richer ochre-gold.
    houseColor:     '#C48C38',
    pos:            { x: 0.22, y: 0.47 },
    objectPosition: 'center 42%',
  },
  {
    id: 'pissarro-harvest',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Camille_Pissarro_-_The_Harvest_-_Google_Art_Project.jpg?width=960',
    alt: 'The Harvest — Camille Pissarro, 1882',
    // No prominent structures. Right side near the distant tree line.
    // Sampled: golden wheat + warm shadow → deeper saturated bark.
    houseColor:     '#8A5228',
    pos:            { x: 0.74, y: 0.42 },
    objectPosition: 'center 48%',
  },
  {
    id: 'sisley-terrace-spring',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Alfred_Sisley_-_The_Terrace_at_Saint-Germain,_Spring_-_Google_Art_Project.jpg?width=960',
    alt: 'The Terrace at Saint-Germain, Spring — Alfred Sisley, c.1875',
    // objectPosition 30% avoids the stone railing prominent at 52%.
    // Icon far-left in the atmospheric haze / tree edge.
    // Sampled: cool blue-green + pale diffused sky → warmer, more saturated tan.
    houseColor:     '#9A6A34',
    pos:            { x: 0.18, y: 0.46 },
    objectPosition: 'center 30%',
  },
  {
    id: 'monet-haystacks-summer',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Claude_Monet_-_Haystacks%2C_end_of_Summer_-_Google_Art_Project.jpg?width=960',
    alt: 'Haystacks, End of Summer — Claude Monet, 1891',
    // Haystacks sit right-of-center (~55–75% x). Icon in open left field
    // where the painting is misty and unoccupied.
    // App terracotta reads cleanly against warm haze — brightened slightly.
    houseColor:     '#CC4A2C',
    pos:            { x: 0.16, y: 0.46 },
    objectPosition: 'center 55%',
  },
]

// ── Deterministic daily rotation ───────────────────────────────────────────────
// Same painting all day; changes at midnight. No useState or randomness.
function getTodaysPainting() {
  const d         = new Date()
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86_400_000)
  return PAINTINGS[dayOfYear % PAINTINGS.length]
}

// ── ↑ / ↓ perspectives — dry, context-aware ───────────────────────────────────
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

// ── Theme-sensitive overlay ────────────────────────────────────────────────────
function getOverlay(themeMode) {
  if (themeMode === 'night')   return 'rgba(20, 10, 5, 0.52)'
  if (themeMode === 'evening') return 'rgba(240, 195, 140, 0.30)'
  if (themeMode === 'morning') return 'rgba(255, 238, 215, 0.28)'
  return 'rgba(255, 248, 235, 0.28)'
}

// ── Theme toggle config ────────────────────────────────────────────────────────
const THEME_CYCLE  = ['auto', 'day', 'evening', 'night']
const THEME_ICONS  = { auto: '◐', day: '☀', evening: '◑', night: '☾' }
const THEME_LABELS = {
  auto:    'Theme: Auto. Tap to switch.',
  day:     'Theme: Day. Tap to switch.',
  evening: 'Theme: Evening. Tap to switch.',
  night:   'Theme: Night. Tap to switch.',
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
  const painting = getTodaysPainting()

  // ── Visual state ──────────────────────────────────────────────────────
  const [loaded,  setLoaded]  = useState(false)
  const [visible, setVisible] = useState(false)
  const [pressed, setPressed] = useState(false)

  // ── Drag-to-position dev tool ─────────────────────────────────────────
  //
  // Usage:
  //   1. Long-press the house icon (600ms) → drag mode activates
  //   2. Drag anywhere in the hero → house follows, coords log to console
  //   3. Release → final { x, y } logged with copy instruction
  //   4. Paste into PAINTINGS[].pos in this file
  //
  // Drag ends on pointerup (anywhere on page, including outside the app).
  // Override persists for the session so you can verify bubble placement.
  //
  const heroRef        = useRef(null)
  const longPressTimer = useRef(null)
  const dragPosRef     = useRef(null)   // stable ref for closure in listeners
  const [dragMode,    setDragMode]    = useState(false)
  const [overridePos, setOverridePos] = useState(null)

  // Close bubble when drag mode activates
  useEffect(() => { if (dragMode) setVisible(false) }, [dragMode])

  // Window-level pointer listeners during drag — fires regardless of which
  // element currently has pointer capture, and handles off-screen releases.
  useEffect(() => {
    if (!dragMode) return

    const handleMove = (e) => {
      if (!heroRef.current) return
      const rect = heroRef.current.getBoundingClientRect()
      const x = parseFloat(Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width)).toFixed(3))
      const y = parseFloat(Math.max(0.05, Math.min(0.95, (e.clientY - rect.top)  / rect.height)).toFixed(3))
      dragPosRef.current = { x, y }
      setOverridePos({ x, y })
      console.log(`[225 hero] pos: { x: ${x}, y: ${y} }`)
    }

    const handleUp = () => {
      setDragMode(false)
      const pos = dragPosRef.current
      if (pos) {
        console.log(`[225 hero] ── Final position for "${painting.id}" ──────────`)
        console.log(`  pos: { x: ${pos.x}, y: ${pos.y} }`)
        console.log(`  → Copy into PAINTINGS[].pos in HeroSection.jsx`)
      }
    }

    // passive: false allows preventDefault to suppress scroll during drag
    window.addEventListener('pointermove', handleMove, { passive: false })
    window.addEventListener('pointerup',   handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup',   handleUp)
    }
  }, [dragMode, painting.id])

  // ── Derived positioning ───────────────────────────────────────────────
  const effectivePos  = overridePos ?? painting.pos
  const perspectives  = getPerspectives(setupStats, totalRevenue)
  const overlayColor  = getOverlay(themeMode)
  const isNight       = themeMode === 'night'
  const bubbleOnLeft  = effectivePos.x > 0.5
  // Bubble Y: ~40% of house Y — above the horizon, contextually anchored
  const bubbleTopPct  = Math.round(effectivePos.y * 100 * 0.40)

  // ── House pointer handlers ────────────────────────────────────────────
  const handleHousePointerDown = () => {
    setPressed(true)
    longPressTimer.current = setTimeout(() => {
      setDragMode(true)
      setPressed(false)
      dragPosRef.current = null
      console.log(`[225 hero] Drag mode ON — painting: "${painting.id}"`)
      console.log(`[225 hero] Current pos: { x: ${painting.pos.x}, y: ${painting.pos.y} }`)
    }, 600)
  }

  const handleHousePointerUp = () => {
    clearTimeout(longPressTimer.current)
    setPressed(false)
    // Only toggle bubble on normal tap — not when ending a drag
    if (!dragMode) setVisible(v => !v)
  }

  const handleHousePointerLeave = () => {
    clearTimeout(longPressTimer.current)
    setPressed(false)
    // Intentionally do NOT clear dragMode here —
    // drag continues across the hero after pointer leaves the button.
  }

  return (
    <div
      ref={heroRef}
      style={{
        position:    'relative',
        height:      'min(260px, 31vh)',
        minHeight:   180,
        overflow:    'hidden',
        background:  '#CDC3B0',
        // Disable scroll during drag so touch events move the house, not the page
        touchAction: dragMode ? 'none' : 'auto',
      }}
    >
      {/* ── Landscape painting ──────────────────────────────────────────── */}
      {/*
        scale(1.04): prevents blur filter from exposing white edges.
        saturate(0.45): ~55% vibrancy reduction — painting becomes atmosphere.
        contrast(0.88): gentle pull-back so it recedes behind the UI.
        blur(1.2px): overall softening pass.
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

      {/* ── Extra bottom blur ─────────────────────────────────────────────── */}
      {/*
        Adds extra softness to the lower 32% of the hero — the zone where the
        card overlaps. backdrop-filter blurs the painting and overlay behind it.
        No z-index: renders above painting/overlay (DOM order) but below the
        gradient (z:1). Result: painting is slightly softer at the overlap edge,
        making the card emergence feel natural rather than abrupt.
      */}
      <div
        style={{
          position:             'absolute',
          bottom:               0,
          left:                 0,
          right:                0,
          height:               '32%',
          backdropFilter:       'blur(2.5px)',
          WebkitBackdropFilter: 'blur(2.5px)',
          pointerEvents:        'none',
        }}
      />

      {/* ── Bottom gradient fade ─────────────────────────────────────────── */}
      {/*
        Extended to 65% height with a flat-start multi-stop curve:
        transparent → transparent (8%) → var(--bg) (100%).
        The flat zone prevents the very top of the fade from looking washed out.

        var(--bg) is a typed @property <color>, so this gradient endpoint
        cross-fades smoothly when the theme changes.
        zIndex: 1 — above painting/blur (no z), below house (z:5) and bubble (z:10).
      */}
      <div
        style={{
          position:      'absolute',
          bottom:        0,
          left:          0,
          right:         0,
          height:        '65%',
          background:    'linear-gradient(to bottom, transparent 0%, transparent 8%, var(--bg) 100%)',
          zIndex:        1,
          pointerEvents: 'none',
          transition:    '--bg 350ms ease',
        }}
      />

      {/* ── Speech bubble (appears on house tap) ────────────────────────── */}
      {/*
        Y anchor: bubbleTopPct = houseY × 40% — contextually tied to house,
        not pinned to the very top. X: opposite side from the house.
      */}
      {visible && (
        <div
          style={{
            position:  'absolute',
            top:       `max(calc(env(safe-area-inset-top, 0px) + 8px), ${bubbleTopPct}%)`,
            left:      bubbleOnLeft ? 14    : 'auto',
            right:     bubbleOnLeft ? 'auto': 14,
            maxWidth:  '68%',
            zIndex:    10,
            animation: 'heroBubbleIn 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
          }}
        >
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
            {perspectives && (
              <span style={{ display: 'block' }}>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--bubble-sub)', lineHeight: 1.55 }}>↑ {perspectives.up}</span>
                <span style={{ display: 'block', fontSize: 11, color: 'var(--bubble-sub)', lineHeight: 1.55 }}>↓ {perspectives.down}</span>
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
              <span style={{ display: 'block', fontSize: 11, color: moodStyle.moreColor, marginTop: 5 }}>
                +{extraCount} more
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── House icon ────────────────────────────────────────────────────── */}
      {/*
        Positioned at effectivePos.{x,y} (0–1). translate(-50%,-50%) centers
        the icon on the exact coordinate point.

        During normal use: effectivePos = painting.pos (from PAINTINGS[]).
        During/after drag: effectivePos = overridePos (live-updated by drag).

        Tap animation: scale(1.06) + translateY(-1.5px) lifts the house
        slightly when the bubble is visible — subtle but intentional.
        Long press → drag mode → scale 1.12 (affordance).

        Grounding:
          • Dual drop-shadow: contact shadow (1px, 2px blur) + main shadow (5px, 8px blur)
          • Soft oval ground shadow div at the icon's base
          • Radial veil behind icon clears local painting noise (Option B)
      */}
      <div
        style={{
          position:  'absolute',
          left:      `${effectivePos.x * 100}%`,
          top:       `${effectivePos.y * 100}%`,
          transform: 'translate(-50%, -50%)',
          zIndex:    5,
          cursor:    dragMode ? 'grabbing' : 'pointer',
        }}
      >
        {/* Radial veil — clears local painting noise, improves legibility.
            Slightly enlarged (inset -26, transparent at 72%) vs. previous
            (-20 / 68%) for a gentler clearing radius. */}
        <div
          style={{
            position:      'absolute',
            inset:         -26,
            borderRadius:  '50%',
            background:    isNight
              ? 'radial-gradient(circle, rgba(0,0,0,0.35) 0%, transparent 72%)'
              : 'radial-gradient(circle, rgba(255,255,255,0.30) 0%, transparent 72%)',
            pointerEvents: 'none',
          }}
        />

        {/* Ground shadow — soft oval at icon base anchors house to landscape.
            Nearly invisible (0.20 opacity, 5px blur). */}
        <div
          style={{
            position:      'absolute',
            bottom:        7,
            left:          '50%',
            transform:     'translateX(-50%)',
            width:         36,
            height:        7,
            background:    'rgba(0,0,0,0.20)',
            borderRadius:  '50%',
            filter:        'blur(5px)',
            pointerEvents: 'none',
          }}
        />

        <button
          onPointerDown={handleHousePointerDown}
          onPointerUp={handleHousePointerUp}
          onPointerLeave={handleHousePointerLeave}
          aria-label="Show house status"
          style={{
            position:   'relative',
            padding:    6,
            color:      painting.houseColor,
            transform:  pressed
              ? 'scale(0.86)'
              : dragMode
                ? 'scale(1.12)'
                : visible
                  ? 'scale(1.06) translateY(-1.5px)'
                  : 'scale(1)',
            transition: pressed
              ? 'transform 70ms ease-in'
              : 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            // Dual shadow: tight contact shadow + diffused main shadow
            filter:     'drop-shadow(0 1px 2px rgba(0,0,0,0.28)) drop-shadow(0 5px 8px rgba(0,0,0,0.36))',
          }}
        >
          <HouseIcon size={58} />
        </button>
      </div>

      {/* ── Theme toggle ─────────────────────────────────────────────────── */}
      <button
        onClick={onThemeToggle}
        aria-label={THEME_LABELS[themeMode]}
        title={`Theme: ${themeMode}`}
        style={{
          position:             'absolute',
          top:                  'calc(env(safe-area-inset-top, 0px) + 10px)',
          right:                12,
          zIndex:               10,
          fontSize:             15,
          color:                isNight ? 'rgba(247,240,229,0.65)' : 'rgba(26,10,4,0.45)',
          padding:              '7px 10px',
          lineHeight:           1,
          minWidth:             36,
          minHeight:            36,
          display:              'flex',
          alignItems:           'center',
          justifyContent:       'center',
          background:           isNight ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.22)',
          borderRadius:         'var(--radius-sm)',
          backdropFilter:       'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          border:               isNight
            ? '0.5px solid rgba(255,255,255,0.10)'
            : '0.5px solid rgba(0,0,0,0.10)',
        }}
      >
        {THEME_ICONS[themeMode]}
      </button>
    </div>
  )
}
