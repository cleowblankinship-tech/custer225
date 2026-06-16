import HouseArt from './HouseArt'

// ── HouseScene ────────────────────────────────────────────────────────────────
//
// The storybook property: the house at center, with a world that grows around
// it as the property matures (see lib/propertyScene.js for how level/season/
// activity are derived from real data). Everything is hand-drawn line/blob art
// in the same family as the house. The house stays the focal point; nature is
// quieter, flanking, and lower-contrast.
//
//   level 1  bare ground + house
//   level 2  a small tree, a mailbox, a couple of flowers
//   level 3  a bigger tree, more flowers, a garden patch, the odd bird
//   level 4  a second tree, fuller beds, a butterfly, more wildlife
//   level 5  mature trees front and back, a rich garden, butterflies + birds
//
// New plants sprout up (grow from the ground) rather than popping in, so a
// maturing property feels tended. Season recolors the foliage and, in winter,
// bares the trees and tucks the flowers away under a dusting of snow.

const GY = 47.5  // ground line, in stage coordinates (matches the house's feet)

// Nature keeps its own earthy palette, independent of the house's red coat.
const BARK   = '#8A6A48'
const STEM   = '#6E8E54'
const CLOUD  = '#D8CEBE'
const BIRD   = '#9C8E7A'
const WING   = '#CE8AA8'
const SNOW   = '#EAF1F4'
const SOIL   = '#B79B79'
const FLOWER_HUES = ['#E3B23C', '#E0703F', '#8A6480', '#D6537C', '#EFE6D2']

const SEASON_CANOPY = {
  spring: { fill: '#A7C77E', edge: '#7FA255', blossom: '#F2B8C6' },
  summer: { fill: '#7FAE5A', edge: '#5C8842', blossom: null },
  autumn: { fill: '#D49A48', edge: '#B5702C', blossom: '#E0703F' },
  winter: { fill: null,      edge: '#9DAAB0', blossom: null },
}

// ── Nature primitives ─────────────────────────────────────────────────────────

function Tree({ x, h, season, delay = 0, back = false }) {
  const c       = SEASON_CANOPY[season]
  const trunkH  = h * 0.4
  const tw      = Math.max(h * 0.12, 1.4)
  const top     = GY - trunkH
  const cy      = top - h * 0.34
  const r       = h * 0.42

  return (
    <g style={{
      animation: `sproutIn 1s ease ${delay}s both`,
      transformBox: 'fill-box', transformOrigin: 'bottom center',
      opacity: back ? 0.7 : 1,
    }}>
      {/* trunk + two character branches */}
      <line x1={x} y1={GY} x2={x} y2={top} stroke={BARK} strokeWidth={tw} strokeLinecap="round" />
      {season === 'winter' ? (
        <g stroke={BARK} strokeWidth={Math.max(tw * 0.7, 1)} strokeLinecap="round" fill="none">
          <line x1={x} y1={top + 1} x2={x - r * 0.7} y2={top - r * 0.5} />
          <line x1={x} y1={top + 2} x2={x + r * 0.7} y2={top - r * 0.4} />
          <line x1={x} y1={top}     x2={x - r * 0.3} y2={top - r * 0.95} />
          <line x1={x} y1={top}     x2={x + r * 0.35} y2={top - r * 0.85} />
          {/* snow caps */}
          <circle cx={x - r * 0.7} cy={top - r * 0.5} r="0.9" fill={SNOW} stroke="none" />
          <circle cx={x + r * 0.7} cy={top - r * 0.4} r="0.9" fill={SNOW} stroke="none" />
          <circle cx={x}           cy={top - r * 0.95} r="1"  fill={SNOW} stroke="none" />
        </g>
      ) : (
        <g stroke={c.edge} strokeWidth="1" fill={c.fill}>
          <circle cx={x - r * 0.55} cy={cy + r * 0.25} r={r * 0.72} />
          <circle cx={x + r * 0.55} cy={cy + r * 0.25} r={r * 0.72} />
          <circle cx={x}            cy={cy}            r={r} />
          {c.blossom && (
            <g fill={c.blossom} stroke="none">
              <circle cx={x - r * 0.4} cy={cy - r * 0.1} r="0.7" />
              <circle cx={x + r * 0.45} cy={cy + r * 0.1} r="0.7" />
              <circle cx={x + r * 0.05} cy={cy - r * 0.5} r="0.6" />
              <circle cx={x - r * 0.1} cy={cy + r * 0.5} r="0.6" />
            </g>
          )}
        </g>
      )}
    </g>
  )
}

function Flower({ x, hue, h = 4, delay = 0 }) {
  return (
    <g style={{
      animation: `sproutIn 0.9s ease ${delay}s both`,
      transformBox: 'fill-box', transformOrigin: 'bottom center',
    }}>
      <line x1={x} y1={GY} x2={x} y2={GY - h} stroke={STEM} strokeWidth="1.1" strokeLinecap="round" />
      <circle cx={x - 1.1} cy={GY - h * 0.55} r="0.9" fill={STEM} stroke="none" opacity="0.85" />
      <circle cx={x} cy={GY - h} r="1.5" fill={hue} stroke="none" />
      <circle cx={x} cy={GY - h} r="0.55" fill="#FFFDF5" stroke="none" opacity="0.6" />
    </g>
  )
}

function GardenPatch({ x, w, delay = 0 }) {
  return (
    <g style={{
      animation: `sproutIn 0.9s ease ${delay}s both`,
      transformBox: 'fill-box', transformOrigin: 'bottom center',
    }}>
      <ellipse cx={x} cy={GY + 0.3} rx={w / 2} ry="1.5" fill={SOIL} stroke="none" opacity="0.5" />
      <g stroke={STEM} strokeWidth="0.9" strokeLinecap="round">
        {[-0.3, 0, 0.32].map((f, i) => (
          <line key={i} x1={x + f * w} y1={GY} x2={x + f * w} y2={GY - 2.2} />
        ))}
      </g>
    </g>
  )
}

function Mailbox({ x, hasMail, detailed }) {
  return (
    <g style={{ animation: 'sproutIn 0.9s ease 0.1s both', transformBox: 'fill-box', transformOrigin: 'bottom center' }}>
      <line x1={x} y1={GY} x2={x} y2={GY - 7.1} stroke="currentColor" strokeWidth="1.8" />
      <rect x={x - 1.8} y={GY - 10.2} width="4" height="3.2" rx="1.4" stroke="currentColor" strokeWidth="1.6" fill="none" />
      {detailed && <line x1={x - 1} y1={GY - 8.6} x2={x + 1} y2={GY - 8.6} stroke="currentColor" strokeWidth="0.8" opacity="0.6" />}
      {/* flag pivots at its base on the right of the box */}
      <g transform={`translate(${x + 2.2} ${GY - 7.9})`}>
        <g style={{
          transform: hasMail ? 'rotate(2deg)' : 'rotate(102deg)',
          transformBox: 'fill-box', transformOrigin: 'left bottom',
          transition: 'transform 650ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          <line x1="0" y1="0" x2="0" y2="-3" stroke="currentColor" strokeWidth="1.3" />
          <path d="M 0 -3 L 1.9 -2.5 L 0 -1.4 Z" fill="currentColor" stroke="none"
            style={{ opacity: hasMail ? 1 : 0.4, transition: 'opacity 400ms ease' }} />
        </g>
      </g>
    </g>
  )
}

function Butterfly({ x, y, hue = WING, dur = 6, delay = 0 }) {
  return (
    <g style={{ animation: `flutterPath ${dur}s ease-in-out ${delay}s infinite` }}>
      <g transform={`translate(${x} ${y})`}>
        <line x1="0" y1="-1.2" x2="0" y2="1.2" stroke="#5A4632" strokeWidth="0.5" />
        <ellipse cx="-1" cy="0" rx="1.2" ry="1.6" fill={hue} stroke="none" opacity="0.9"
          style={{ animation: 'wingFlap 0.32s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'right center' }} />
        <ellipse cx="1" cy="0" rx="1.2" ry="1.6" fill={hue} stroke="none" opacity="0.9"
          style={{ animation: 'wingFlap 0.32s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'left center' }} />
      </g>
    </g>
  )
}

function BirdFlock({ dur, delay = 0 }) {
  return (
    <g style={{ animation: `birdFly ${dur}s linear ${delay}s infinite` }} stroke={BIRD} strokeWidth="0.6" fill="none" strokeLinecap="round">
      <path d="M 0 9 Q 1 7.8 2 9 Q 3 7.8 4 9"
        style={{ animation: 'birdFlap 0.5s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'center' }} />
      <path d="M 5 11 Q 5.8 10 6.6 11 Q 7.4 10 8.2 11"
        style={{ animation: 'birdFlap 0.5s ease-in-out infinite 0.12s', transformBox: 'fill-box', transformOrigin: 'center' }} />
    </g>
  )
}

// ── The scene ─────────────────────────────────────────────────────────────────

export default function HouseScene({ size = 280, mood = 'calm', vitals = null, scene = null, style }) {
  const level    = scene?.level ?? 1
  const season   = scene?.season ?? 'summer'
  const activity = scene?.activity ?? 0
  const hasMail  = !!vitals?.hasMail
  const winter   = season === 'winter'

  const W = size * (68 / 40)
  const H = size * (54 / 40)

  // Flowers accumulate gently with level; hidden under snow in winter.
  const flowers = []
  if (!winter) {
    if (level >= 2) { flowers.push({ x: 12, hue: 0, h: 4 }, { x: 15, hue: 1, h: 3.4 }) }
    if (level >= 3) { flowers.push({ x: 10, hue: 2, h: 3.6 }, { x: 54, hue: 3, h: 4 }) }
    if (level >= 4) { flowers.push({ x: 56, hue: 0, h: 3.4 }, { x: 24, hue: 1, h: 3.2 }) }
    if (level >= 5) { flowers.push({ x: 8, hue: 3, h: 4.2 }, { x: 17, hue: 4, h: 3 }, { x: 45, hue: 2, h: 3.4 }, { x: 58, hue: 1, h: 3.8 }) }
  }
  const frontXs = new Set([24, 45]) // flowers that sit in front of the house

  // Wildlife frequency eases up with activity (a busier property feels livelier).
  const birdDur = 16 - activity * 5

  return (
    <svg
      viewBox="0 0 68 54"
      width={W}
      height={H}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, overflow: 'visible', ...style }}
      aria-hidden="true"
    >
      {/* ── Sky: clouds drift behind the rooftop ──────────────────────────── */}
      <g stroke="none" fill={CLOUD}>
        <g style={{ animation: 'cloudDrift 46s linear infinite', transformBox: 'fill-box', transformOrigin: 'center' }} opacity="0.5">
          <circle cx="16" cy="6" r="2.2" /><circle cx="19" cy="5.2" r="2.7" /><circle cx="22" cy="6.1" r="2" />
          <rect x="15.5" y="6" width="7.5" height="2.2" rx="1.1" />
        </g>
        {level >= 3 && (
          <g style={{ animation: 'cloudDrift 64s linear infinite 8s', transformBox: 'fill-box', transformOrigin: 'center' }} opacity="0.36">
            <circle cx="44" cy="3" r="1.7" /><circle cx="46.5" cy="2.3" r="2.1" /><circle cx="49" cy="3" r="1.6" />
            <rect x="43.8" y="3" width="5.6" height="1.8" rx="0.9" />
          </g>
        )}
      </g>

      {/* ── Birds pass through (level 3+) ─────────────────────────────────── */}
      {level >= 3 && !winter && <BirdFlock dur={birdDur} />}
      {level >= 5 && !winter && <BirdFlock dur={birdDur + 6} delay={7} />}

      {/* ── Ground ────────────────────────────────────────────────────────── */}
      {winter && <rect x="0" y={GY} width="68" height={54 - GY} fill={SNOW} stroke="none" opacity="0.45" />}
      <ellipse cx="34" cy={GY + 0.6} rx="21" ry="1.8" fill="#000" stroke="none" opacity="0.05" />
      <line x1="2" y1={GY} x2="66" y2={GY} stroke="currentColor" strokeWidth="1.4" opacity="0.18" />

      {/* ── Trees behind the house grow first at full maturity ────────────── */}
      {level >= 5 && <Tree x={50} h={16 + (season === 'summer' ? 1 : 0)} season={season} delay={0.05} back />}

      {/* ── Flanking trees ────────────────────────────────────────────────── */}
      {level >= 2 && <Tree x={9}  h={11 + (level - 2) * 2.2} season={season} delay={0.1} />}
      {level >= 4 && <Tree x={60} h={12 + (level - 4) * 2.5} season={season} delay={0.2} />}

      {/* ── Garden beds ───────────────────────────────────────────────────── */}
      {level >= 3 && !winter && <GardenPatch x={13} w={10} delay={0.25} />}
      {level >= 4 && !winter && <GardenPatch x={55} w={8} delay={0.3} />}

      {/* ── Side flowers (beside the house) ───────────────────────────────── */}
      {flowers.filter(f => !frontXs.has(f.x)).map((f, i) => (
        <Flower key={`fs${f.x}`} x={f.x} hue={FLOWER_HUES[f.hue]} h={f.h} delay={0.3 + i * 0.08} />
      ))}

      {/* ── Mailbox (level 2+) ────────────────────────────────────────────── */}
      {level >= 2 && <Mailbox x={53} hasMail={hasMail} detailed={level >= 3} />}

      {/* ── The house — the focal character ───────────────────────────────── */}
      <g transform="translate(14, 8)">
        <HouseArt mood={mood} vitals={vitals} windowOpacity={1} />
      </g>

      {/* ── Foreground flowers in front of the house base ─────────────────── */}
      {flowers.filter(f => frontXs.has(f.x)).map((f, i) => (
        <Flower key={`ff${f.x}`} x={f.x} hue={FLOWER_HUES[f.hue]} h={f.h} delay={0.5 + i * 0.1} />
      ))}

      {/* ── Butterflies near the beds (level 4+) ──────────────────────────── */}
      {level >= 4 && !winter && <Butterfly x={22} y={32} dur={6.5} />}
      {level >= 5 && !winter && <Butterfly x={48} y={28} hue="#E8B7C9" dur={7.5} delay={1.2} />}
    </svg>
  )
}
