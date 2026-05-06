import { useState, useRef } from 'react'
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
//   • y is the HORIZON fraction — icon base sits at pos.y (translate -86%)
//   • Avoid existing structures visible in each painting (documented inline)
//
// ── houseColor ────────────────────────────────────────────────────────────────
// Default color for the static position. Once the user drags the house,
// the adaptive color system takes over and picks from HOUSE_COLOR_CANDIDATES.
//
// ── Dev tool ─────────────────────────────────────────────────────────────────
// Drag the house to reposition. Release logs final { x, y } to the console.
// Paste into PAINTINGS[].pos to make the position permanent.

const PAINTINGS = [
  {
    id: 'monet-poppies',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Monet_Poppies.jpg?width=960',
    alt: 'Poppies near Argenteuil — Claude Monet, 1873',
    houseColor:     '#B85228',
    pos:            { x: 0.20, y: 0.40 },
    objectPosition: 'center 58%',
  },
  {
    id: 'constable-hay-wain',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/John_Constable_The_Hay_Wain.jpg?width=960',
    alt: 'The Hay Wain — John Constable, 1821',
    houseColor:     '#9FAF4A',
    pos:            { x: 0.22, y: 0.45 },
    objectPosition: 'center 42%',
  },
  {
    id: 'pissarro-harvest',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Camille_Pissarro_-_The_Harvest_-_Google_Art_Project.jpg?width=960',
    alt: 'The Harvest — Camille Pissarro, 1882',
    houseColor:     '#8A5228',
    pos:            { x: 0.74, y: 0.38 },
    objectPosition: 'center 48%',
  },
  {
    id: 'sisley-terrace-spring',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Alfred_Sisley_-_The_Terrace_at_Saint-Germain,_Spring_-_Google_Art_Project.jpg?width=960',
    alt: 'The Terrace at Saint-Germain, Spring — Alfred Sisley, c.1875',
    houseColor:     '#9A6A34',
    pos:            { x: 0.18, y: 0.47 },
    objectPosition: 'center 30%',
  },
  {
    id: 'monet-haystacks-summer',
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Claude_Monet_-_Haystacks%2C_end_of_Summer_-_Google_Art_Project.jpg?width=960',
    alt: 'Haystacks, End of Summer — Claude Monet, 1891',
    houseColor:     '#CC4A2C',
    pos:            { x: 0.16, y: 0.48 },
    objectPosition: 'center 55%',
  },
]

// ── Adaptive color palette ────────────────────────────────────────────────────
//
// When the house is dragged, the local painting color is sampled and the best
// candidate is chosen by WCAG contrast + hue-harmony scoring.
// No random colors. No raw sampled color. No neon.

const HOUSE_COLOR_CANDIDATES = [
  { name: 'dusty chartreuse', hex: '#9FAF4A' },
  { name: 'deeper olive',     hex: '#8C9A3C' },
  { name: 'warm terracotta',  hex: '#C05538' },
  { name: 'soft gold',        hex: '#C4A068' },
  { name: 'warm cream',       hex: '#E8D7B3' },
  { name: 'deep bark',        hex: '#7A5030' },
]

// ── Color math helpers ────────────────────────────────────────────────────────

function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
    case g: h = ((b - r) / d + 2) / 6;               break
    case b: h = ((r - g) / d + 4) / 6;               break
  }
  return [h * 360, s, l]
}

function relativeLuminance(r, g, b) {
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(...rgb1)
  const l2 = relativeLuminance(...rgb2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

// Approximate the CSS filters applied to the painting image:
//   saturate(0.45) + contrast(0.88)
// Blur doesn't affect averaged color, so it's skipped.
function applyCssFilters(r, g, b) {
  // saturate(0.45) — pull toward grayscale
  const gray = 0.299 * r + 0.587 * g + 0.114 * b
  r = Math.round(gray + (r - gray) * 0.45)
  g = Math.round(gray + (g - gray) * 0.45)
  b = Math.round(gray + (b - gray) * 0.45)
  // contrast(0.88) — pull toward mid-gray
  const c = (v) => Math.round(Math.max(0, Math.min(255, (v / 255 - 0.5) * 0.88 + 0.5) * 255))
  return [c(r), c(g), c(b)]
}

// Pick the best palette candidate for a given background RGB.
// Scoring: 70% WCAG contrast + 30% hue-harmony bias.
function pickBestHouseColor(bgRgb) {
  const [bgH, bgS, bgL] = rgbToHsl(...bgRgb)

  const scored = HOUSE_COLOR_CANDIDATES.map((candidate) => {
    const rgb      = hexToRgb(candidate.hex)
    const contrast = contrastRatio(bgRgb, rgb)
    const [, , cL] = rgbToHsl(...rgb)

    // Contrast score: 0–1, saturating at 5:1
    const contrastScore = Math.min(contrast / 5, 1)

    // Hue-harmony bias — rules derived from painting palette analysis
    let bias = 0
    if (bgL < 0.28) {
      // Dark bg → prefer lighter candidates that will show up
      if (cL > 0.55) bias += 0.30
      if (candidate.name === 'warm cream' || candidate.name === 'dusty chartreuse' || candidate.name === 'soft gold') bias += 0.15
    } else if (bgL > 0.68) {
      // Pale/bright bg → prefer darker candidates
      if (cL < 0.45) bias += 0.30
      if (candidate.name === 'deep bark' || candidate.name === 'deeper olive') bias += 0.15
    } else if (bgS < 0.10) {
      // Gray/foggy (desaturated) → pop with chartreuse or terracotta
      if (candidate.name === 'dusty chartreuse' || candidate.name === 'warm terracotta') bias += 0.30
    } else if (bgH >= 80 && bgH <= 160) {
      // Green-heavy bg → warm colors read as contrast
      if (candidate.name === 'soft gold' || candidate.name === 'warm cream' || candidate.name === 'warm terracotta') bias += 0.28
    } else if (bgH >= 20 && bgH < 80) {
      // Yellow/ochre bg → cool or dark reads better
      if (candidate.name === 'deep bark' || candidate.name === 'warm terracotta') bias += 0.22
    } else if (bgH >= 180 && bgH <= 260) {
      // Blue/cool bg → warm tones for harmony
      if (candidate.name === 'warm terracotta' || candidate.name === 'soft gold') bias += 0.25
    }

    const score = 0.70 * contrastScore + 0.30 * (0.5 + bias)
    return { ...candidate, contrast, score }
  })

  scored.sort((a, b) => b.score - a.score)

  if (import.meta.env.DEV) {
    console.log(`[225 color] bg hsl(${bgH.toFixed(0)}° ${(bgS*100).toFixed(0)}% ${(bgL*100).toFixed(0)}%)`)
    scored.forEach(c => console.log(`  ${c.name.padEnd(20)} contrast:${c.contrast.toFixed(2)}  score:${c.score.toFixed(3)}`))
    console.log(`  → ${scored[0].name} ${scored[0].hex}`)
  }

  return scored[0].hex
}

// ── Deterministic daily rotation ───────────────────────────────────────────────
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

  // ── Adaptive color state ──────────────────────────────────────────────
  // Null = use painting.houseColor (the hand-tuned default).
  // Set to a palette hex after canvas sampling on drag.
  // Scoped by painting id so color doesn't bleed across daily rotations.
  const [adaptiveColorState, setAdaptiveColorState] = useState({ id: '', hex: null })
  const adaptiveColor = adaptiveColorState.id === painting.id ? adaptiveColorState.hex : null

  // ── Drag system ───────────────────────────────────────────────────────
  //
  // Immediate drag — no long-press required.
  // setPointerCapture routes all pointer events to the button even when
  // the pointer leaves it, so drag tracks freely across the whole hero.
  //
  // Tap vs drag: distinguished by a 4px movement threshold.
  //   • Moved < 4px before release → tap → toggle bubble
  //   • Moved ≥ 4px              → drag → reposition house, adapt color
  //
  const heroRef        = useRef(null)
  const imgRef         = useRef(null)
  const dragStartRef   = useRef(null)   // { x, y } screen coords on pointerdown
  const hasDraggedRef  = useRef(false)
  const dragPosRef     = useRef(null)   // latest pos, for the release log
  const lastSampleTime = useRef(0)      // throttle canvas sampling to 150ms
  const [dragMode,    setDragMode]    = useState(false)
  const [overridePos, setOverridePos] = useState(null)

  // ── Derived positioning ───────────────────────────────────────────────
  const effectivePos = overridePos ?? painting.pos
  const perspectives = getPerspectives(setupStats, totalRevenue)
  const overlayColor = getOverlay(themeMode)
  const isNight      = themeMode === 'night'
  const bubbleOnLeft = effectivePos.x > 0.5
  const bubbleTopPct = Math.round(effectivePos.y * 100 * 0.40)

  // ── Canvas color sampling ─────────────────────────────────────────────
  //
  // Draws the painting into an offscreen canvas (replicating objectFit:cover
  // + objectPosition), samples a 40×40px region around the house base, applies
  // the same CSS filters (saturate 0.45, contrast 0.88) used on the img, then
  // picks the best palette candidate by contrast + harmony scoring.
  //
  // Requires crossOrigin="anonymous" on the img; Wikimedia CDN supports CORS.
  // Falls back silently on canvas taint or image-not-loaded errors.
  //
  function sampleAdaptiveColor(pos) {
    const img  = imgRef.current
    const hero = heroRef.current
    if (!img?.complete || img.naturalWidth === 0 || !hero) return

    try {
      const W    = hero.clientWidth
      const H    = hero.clientHeight
      const imgW = img.naturalWidth
      const imgH = img.naturalHeight

      // Replicate objectFit: cover
      const scale   = Math.max(W / imgW, H / imgH)
      const scaledW = imgW * scale
      const scaledH = imgH * scale

      // Parse "center 58%" → vertical fraction
      const match  = painting.objectPosition.match(/(\d+(?:\.\d+)?)%/)
      const posYPct = match ? parseFloat(match[1]) / 100 : 0.5
      const offsetX = -(scaledW - W) / 2
      const offsetY = -(posYPct * (scaledH - H))

      const canvas  = document.createElement('canvas')
      canvas.width  = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH)

      // Sample 40×40px around the house base (pos.y is the horizon)
      const hx = Math.round(pos.x * W)
      const hy = Math.round(pos.y * H)
      const r  = 20
      const x1 = Math.max(0, hx - r), y1 = Math.max(0, hy - r)
      const x2 = Math.min(W, hx + r), y2 = Math.min(H, hy + r)
      const px = ctx.getImageData(x1, y1, x2 - x1, y2 - y1).data

      let sr = 0, sg = 0, sb = 0, count = 0
      for (let i = 0; i < px.length; i += 4) { sr += px[i]; sg += px[i+1]; sb += px[i+2]; count++ }
      const raw = [Math.round(sr / count), Math.round(sg / count), Math.round(sb / count)]

      // Apply the same filters the img element uses
      const filtered = applyCssFilters(...raw)

      const best = pickBestHouseColor(filtered)
      setAdaptiveColorState({ id: painting.id, hex: best })
    } catch {
      // Canvas tainted or image error — silently keep current color
    }
  }

  // ── House pointer handlers ────────────────────────────────────────────
  const handleHousePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStartRef.current  = { x: e.clientX, y: e.clientY }
    hasDraggedRef.current = false
    dragPosRef.current    = null
    setPressed(true)
  }

  const handleHousePointerMove = (e) => {
    if (!dragStartRef.current || !heroRef.current) return
    const dx    = e.clientX - dragStartRef.current.x
    const dy    = e.clientY - dragStartRef.current.y
    const moved = Math.sqrt(dx * dx + dy * dy) >= 4
    if (!moved) return

    if (!hasDraggedRef.current) {
      hasDraggedRef.current = true
      setDragMode(true)
      setVisible(false)
      setPressed(false)
    }

    const rect = heroRef.current.getBoundingClientRect()
    const x = parseFloat(Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width)).toFixed(3))
    const y = parseFloat(Math.max(0.05, Math.min(0.95, (e.clientY - rect.top)  / rect.height)).toFixed(3))
    dragPosRef.current = { x, y }
    setOverridePos({ x, y })

    // Throttled color sample — every 150ms while dragging
    const now = Date.now()
    if (now - lastSampleTime.current >= 150) {
      lastSampleTime.current = now
      sampleAdaptiveColor({ x, y })
    }
  }

  const handleHousePointerUp = () => {
    setPressed(false)
    dragStartRef.current = null

    if (!hasDraggedRef.current) {
      setVisible(v => !v)
    } else {
      setDragMode(false)
      const pos = dragPosRef.current
      if (pos) {
        sampleAdaptiveColor(pos)   // final authoritative sample on release
        console.log(`[225 hero] ── Final position for "${painting.id}" ──`)
        console.log(`  pos: { x: ${pos.x}, y: ${pos.y} }`)
        console.log(`  → Paste into PAINTINGS[].pos in HeroSection.jsx`)
      }
    }
  }

  const handleHousePointerCancel = () => {
    setPressed(false)
    setDragMode(false)
    dragStartRef.current  = null
    hasDraggedRef.current = false
  }

  // ── Resolved house color ──────────────────────────────────────────────
  const houseColor = adaptiveColor ?? painting.houseColor

  return (
    <div
      ref={heroRef}
      style={{
        position:    'relative',
        height:      'min(260px, 31vh)',
        minHeight:   180,
        overflow:    'hidden',
        background:  '#CDC3B0',
        touchAction: dragMode ? 'none' : 'auto',
      }}
    >
      {/* ── Landscape painting ──────────────────────────────────────────── */}
      {/*
        crossOrigin="anonymous": required for canvas CORS sampling.
        Wikimedia CDN (upload.wikimedia.org) sends Access-Control-Allow-Origin: *.
        scale(1.04): prevents blur filter from exposing white edges.
        saturate(0.45): ~55% vibrancy reduction — painting becomes atmosphere.
        contrast(0.88): gentle pull-back so it recedes behind the UI.
        blur(1.2px): overall softening pass.
      */}
      <img
        ref={imgRef}
        crossOrigin="anonymous"
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
        pos.y is the HORIZON fraction (0–1). translate(-50%, -86%) places the
        icon BASE exactly at pos.y.

        Color: houseColor = adaptiveColor ?? painting.houseColor
          adaptiveColor is sampled from the painting canvas on drag.
          painting.houseColor is the hand-tuned default for the static position.
          A 300ms color transition smooths the palette switch while dragging.
      */}
      <div
        style={{
          position:  'absolute',
          left:      `${effectivePos.x * 100}%`,
          top:       `${effectivePos.y * 100}%`,
          transform: 'translate(-50%, -86%)',
          zIndex:    5,
          cursor:    dragMode ? 'grabbing' : 'pointer',
        }}
      >
        {/* Ground shadow */}
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
          onPointerMove={handleHousePointerMove}
          onPointerUp={handleHousePointerUp}
          onPointerCancel={handleHousePointerCancel}
          aria-label="Show house status"
          style={{
            position:   'relative',
            padding:    6,
            color:      houseColor,
            transform:  pressed
              ? 'scale(0.86)'
              : dragMode
                ? 'scale(1.12)'
                : visible
                  ? 'scale(1.06) translateY(-1.5px)'
                  : 'scale(1)',
            transition: pressed
              ? 'transform 70ms ease-in, color 300ms ease'
              : 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), color 300ms ease',
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
