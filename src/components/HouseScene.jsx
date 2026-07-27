import HouseArt from './HouseArt'

// ── HouseScene ────────────────────────────────────────────────────────────────
//
// The storybook property: a little house sitting in its own yard. The house is
// the focal character; the land and everything growing on it frame it with
// breathing room rather than touching it.
//
// The world is a visual record of the property's history (lib/propertyScene.js):
//   listed       → the mailbox goes up
//   each booking → plants a flower (alternating sides, accumulating outward)
//   established  → the first tree takes root (left)
//   consistent   → garden beds appear
//   longTerm     → a second tree (right), a tree behind, butterflies, more birds
//
// The land itself — a soft lawn and a couple of stones resting in the grass —
// is always there: even a brand-new listing is rooted somewhere. New plants
// sprout up from the ground rather than popping in. Season recolors the
// foliage and, in winter, bares the trees and lays snow over the beds.
//
// Nature keeps its own earthy palette so the house's red coat stays the focus.

const GY = 47   // ground line in stage coords; the house's feet rest here
const CX = 42   // horizontal center of the stage (and the house)

const BARK  = '#8A6A48'
const STEM  = '#6E8E54'
const GRASS = '#B4D192'
const STONE = '#B9B2A6'
const CLOUD = '#D8CEBE'
const BIRD  = '#9C8E7A'
const SNOW  = '#EAF1F4'
const SOIL  = '#A98C68'
const FLOWER_HUES = ['#E3B23C', '#E0703F', '#8A6480', '#D6537C', '#EFE6D2']

const SEASON_CANOPY = {
  spring: { fill: '#A7C77E', edge: '#7FA255', blossom: '#F2B8C6' },
  summer: { fill: '#7FAE5A', edge: '#5C8842', blossom: null },
  autumn: { fill: '#D49A48', edge: '#B5702C', blossom: '#E0703F' },
  winter: { fill: null,      edge: '#9DAAB0', blossom: null },
}

// ── Ground: the land the house is rooted in (always present) ────────────────
function Ground({ winter }) {
  const grass     = winter ? '#DCE6E2' : GRASS
  const grassDeep = winter ? '#CBD9D4' : '#9DBE7C'
  // An irregular, gently-rolling lawn edge — not a clean ellipse — so the land
  // reads as organic ground rather than a shape.
  const lawn = `M 0 ${GY + 1}
    C 9 ${GY - 1.8} 17 ${GY - 0.6} 25 ${GY - 2.2}
    C 34 ${GY - 3.4} 42 ${GY - 1.6} 50 ${GY - 2.6}
    C 60 ${GY - 3.6} 70 ${GY - 1.4} 78 ${GY - 2.4}
    C 81 ${GY - 2.8} 83 ${GY - 1.6} 84 ${GY - 1}
    L 84 58 L 0 58 Z`
  return (
    <g>
      {/* lawn — a darker base with a lighter rolling top for soft dimension */}
      <path d={lawn} fill={grassDeep} stroke="none" opacity={winter ? 0.7 : 0.55} />
      <path d={`M 4 ${GY - 0.5}
        C 16 ${GY - 2.4} 30 ${GY - 1.4} 42 ${GY - 2.6}
        C 56 ${GY - 3.8} 68 ${GY - 1.8} 80 ${GY - 2.2}
        L 80 ${GY + 3} L 4 ${GY + 3} Z`}
        fill={grass} stroke="none" opacity={winter ? 0.6 : 0.5} />

      {winter && <rect x="0" y={GY} width="84" height={58 - GY} fill={SNOW} stroke="none" opacity="0.4" />}

      {/* a couple of stones resting in the grass */}
      <ellipse cx={26} cy={GY + 1.6} rx="1.7" ry="0.8" fill={STONE} stroke="#9A9388" strokeWidth="0.3" />
      <ellipse cx={59} cy={GY + 2}   rx="2.1" ry="0.9" fill={STONE} stroke="#9A9388" strokeWidth="0.3" />

      {!winter && (
        <g stroke={STEM} strokeWidth="0.7" strokeLinecap="round" opacity="0.7">
          {[14, 21, 29, 62, 69, 76].map((gx, i) => (
            <g key={i} style={{
              animation: `breezeSway ${5 + (i % 3)}s ease-in-out infinite ${(i % 4) * 0.4}s`,
              transformBox: 'fill-box', transformOrigin: 'bottom center',
            }}>
              <line x1={gx} y1={GY} x2={gx - 0.8} y2={GY - 1.7} />
              <line x1={gx} y1={GY} x2={gx + 0.9} y2={GY - 1.6} />
            </g>
          ))}
        </g>
      )}
    </g>
  )
}

function Tree({ x, h, season, delay = 0, back = false }) {
  const c      = SEASON_CANOPY[season]
  const trunkH = h * 0.4
  const tw     = Math.max(h * 0.12, 1.4)
  const top    = GY - trunkH
  const cy     = top - h * 0.34
  const r      = h * 0.42
  const swayDur = 6 + (x % 5) * 0.5   // deterministic per-tree breeze phase

  return (
    <g style={{
      animation: `sproutIn 1s ease ${delay}s both`,
      transformBox: 'fill-box', transformOrigin: 'bottom center',
      opacity: back ? 0.68 : 1,
    }}>
      {/* whole tree leans gently in the breeze, hinged at its base */}
      <g style={{
        animation: `canopySway ${swayDur}s ease-in-out infinite ${(x % 7) * 0.3}s`,
        transformBox: 'fill-box', transformOrigin: 'bottom center',
      }}>
        <line x1={x} y1={GY} x2={x} y2={top} stroke={BARK} strokeWidth={tw} strokeLinecap="round" />
        {season === 'winter' ? (
          <g stroke={BARK} strokeWidth={Math.max(tw * 0.7, 1)} strokeLinecap="round" fill="none">
            <line x1={x} y1={top + 1} x2={x - r * 0.7} y2={top - r * 0.5} />
            <line x1={x} y1={top + 2} x2={x + r * 0.7} y2={top - r * 0.4} />
            <line x1={x} y1={top}     x2={x - r * 0.3} y2={top - r * 0.95} />
            <line x1={x} y1={top}     x2={x + r * 0.35} y2={top - r * 0.85} />
            <circle cx={x - r * 0.7} cy={top - r * 0.5} r="0.9" fill={SNOW} stroke="none" />
            <circle cx={x + r * 0.7} cy={top - r * 0.4} r="0.9" fill={SNOW} stroke="none" />
            <circle cx={x}           cy={top - r * 0.95} r="1" fill={SNOW} stroke="none" />
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

      {/* autumn: a leaf lets go now and then and drifts down */}
      {season === 'autumn' && (
        <g fill={c.edge} stroke="none">
          <ellipse cx={x + r * 0.4} cy={cy} rx="0.8" ry="0.5"
            style={{ animation: `leafFall 6s ease-in infinite ${(x % 4)}s`, transformBox: 'fill-box', transformOrigin: 'center' }} />
          <ellipse cx={x - r * 0.5} cy={cy + r * 0.3} rx="0.7" ry="0.45"
            style={{ animation: `leafFall 7s ease-in infinite ${3 + (x % 3)}s`, transformBox: 'fill-box', transformOrigin: 'center' }} />
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
      {/* nods in the breeze, hinged at the soil */}
      <g style={{
        animation: `breezeSway ${4.5 + (x % 4) * 0.6}s ease-in-out infinite ${(x % 5) * 0.5}s`,
        transformBox: 'fill-box', transformOrigin: 'bottom center',
      }}>
        <line x1={x} y1={GY} x2={x} y2={GY - h} stroke={STEM} strokeWidth="1.1" strokeLinecap="round" />
        <circle cx={x - 1.1} cy={GY - h * 0.55} r="0.9" fill={STEM} stroke="none" opacity="0.85" />
        <circle cx={x} cy={GY - h} r="1.5" fill={hue} stroke="none" />
        <circle cx={x} cy={GY - h} r="0.55" fill="#FFFDF5" stroke="none" opacity="0.6" />
      </g>
    </g>
  )
}

function GardenPatch({ x, w, delay = 0 }) {
  return (
    <g style={{
      animation: `sproutIn 0.9s ease ${delay}s both`,
      transformBox: 'fill-box', transformOrigin: 'bottom center',
    }}>
      <ellipse cx={x} cy={GY + 0.4} rx={w / 2} ry="1.6" fill={SOIL} stroke="none" opacity="0.45" />
      <g stroke={STEM} strokeWidth="0.9" strokeLinecap="round">
        {[-0.3, 0, 0.32].map((f, i) => (
          <line key={i} x1={x + f * w} y1={GY} x2={x + f * w} y2={GY - 2.2} />
        ))}
      </g>
    </g>
  )
}

function Mailbox({ x, hasMail }) {
  return (
    <g style={{ animation: 'sproutIn 0.9s ease 0.1s both', transformBox: 'fill-box', transformOrigin: 'bottom center' }}>
      <line x1={x} y1={GY} x2={x} y2={GY - 7.1} stroke="currentColor" strokeWidth="1.8" />
      <rect x={x - 1.8} y={GY - 10.2} width="4" height="3.2" rx="1.4" stroke="currentColor" strokeWidth="1.6" fill="none" />
      <line x1={x - 1} y1={GY - 8.6} x2={x + 1} y2={GY - 8.6} stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
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

function Butterfly({ x, y, hue, dur = 6, delay = 0 }) {
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

function BirdFlock({ dur, delay = 0, y = 9 }) {
  return (
    <g style={{ animation: `birdCross ${dur}s linear ${delay}s infinite` }} stroke={BIRD} strokeWidth="0.6" fill="none" strokeLinecap="round">
      <path d={`M 0 ${y} Q 1 ${y - 1.2} 2 ${y} Q 3 ${y - 1.2} 4 ${y}`}
        style={{ animation: 'birdFlap 0.5s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'center' }} />
      <path d={`M 5 ${y + 2} Q 5.8 ${y + 1} 6.6 ${y + 2} Q 7.4 ${y + 1} 8.2 ${y + 2}`}
        style={{ animation: 'birdFlap 0.5s ease-in-out infinite 0.12s', transformBox: 'fill-box', transformOrigin: 'center' }} />
    </g>
  )
}

// Each recorded booking plants a flower. Placement is deterministic by index,
// so booking #1 always grows the same flower — the yard becomes a stable record
// of the property's history, filling outward and to both sides over time.
const LEFT_SPOTS  = [16, 12, 20, 9, 28, 31, 24]
const RIGHT_SPOTS = [68, 72, 64, 75, 56, 53, 60]
function flowerSlots(count) {
  const slots = []
  for (let i = 0; i < Math.min(count, 10); i++) {
    const row = LEFT_SPOTS.length
    const spots = i % 2 === 0 ? LEFT_SPOTS : RIGHT_SPOTS
    const x = spots[Math.floor(i / 2) % row]
    slots.push({ x, hue: i % FLOWER_HUES.length, h: 3 + ((i * 7) % 4) * 0.5 })
  }
  return slots
}

// ── The scene ─────────────────────────────────────────────────────────────────

export default function HouseScene({ size = 260, mood = 'calm', vitals = null, scene = null, style }) {
  const season   = scene?.season ?? 'summer'
  const activity = scene?.activity ?? 0
  const winter   = season === 'winter'
  const hasMail  = !!vitals?.hasMail

  // History-driven milestones (with gentle fallbacks for a bare scene).
  const bookings     = scene?.bookings ?? 0
  const listed       = scene?.listed ?? false
  const established  = scene?.established ?? false
  const consistent   = scene?.consistent ?? false
  const longTerm     = scene?.longTerm ?? false
  const arrivingSoon = scene?.arrivingSoon ?? false

  const W = size * (84 / 40)
  const H = size * (58 / 40)

  const flowers = winter ? [] : flowerSlots(bookings)
  const isFront = x => x >= 24 && x <= 60   // flowers in the front yard vs the sides
  // A busier property — and one expecting a guest — feels livelier (birds pass
  // more often). The whole scene reads as more active before an arrival.
  const lively  = Math.min(activity + (arrivingSoon ? 0.35 : 0), 1)
  const birdDur = 17 - lively * 6
  const leftTreeH  = 11 + Math.min(bookings, 16) * 0.45
  const rightTreeH = 12 + Math.min(bookings, 16) * 0.35

  return (
    <svg
      viewBox="0 0 84 58"
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
      {/* ── Sky: clouds drifting behind the rooftop ──────────────────────────── */}
      <g stroke="none" fill={CLOUD}>
        <g style={{ animation: 'cloudDrift 50s linear infinite', transformBox: 'fill-box', transformOrigin: 'center' }} opacity="0.5">
          <circle cx="20" cy="7" r="2.2" /><circle cx="23" cy="6.2" r="2.7" /><circle cx="26" cy="7.1" r="2" />
          <rect x="19.5" y="7" width="7.5" height="2.2" rx="1.1" />
        </g>
        {established && (
          <g style={{ animation: 'cloudDrift 70s linear infinite 10s', transformBox: 'fill-box', transformOrigin: 'center' }} opacity="0.36">
            <circle cx="56" cy="4" r="1.7" /><circle cx="58.5" cy="3.3" r="2.1" /><circle cx="61" cy="4" r="1.6" />
            <rect x="55.8" y="4" width="5.6" height="1.8" rx="0.9" />
          </g>
        )}
      </g>

      {/* ── Birds cross the whole sky once the property is established ──────── */}
      {established && !winter && <BirdFlock dur={birdDur} y={9} />}
      {longTerm    && !winter && <BirdFlock dur={birdDur + 6} delay={8} y={13} />}
      {/* an extra pass when a guest is on the way — anticipation in the air */}
      {arrivingSoon && established && !winter && <BirdFlock dur={birdDur - 2} delay={3} y={6} />}

      {/* ── The land ──────────────────────────────────────────────────────── */}
      <Ground winter={winter} />

      {/* ── A tree behind the house adds depth at full maturity ───────────── */}
      {longTerm && <Tree x={CX} h={17} season={season} delay={0.05} back />}

      {/* ── Flanking trees frame the house ────────────────────────────────── */}
      {established && <Tree x={11} h={leftTreeH} season={season} delay={0.1} />}
      {longTerm    && <Tree x={73} h={rightTreeH} season={season} delay={0.2} />}

      {/* ── Garden beds, both sides as the property keeps operating ───────── */}
      {consistent && !winter && <GardenPatch x={14} w={10} delay={0.25} />}
      {longTerm   && !winter && <GardenPatch x={70} w={9}  delay={0.3} />}

      {/* ── Side flowers (a record of bookings, framing the house) ────────── */}
      {flowers.filter(f => !isFront(f.x)).map((f, i) => (
        <Flower key={`fs${f.x}-${i}`} x={f.x} hue={FLOWER_HUES[f.hue]} h={f.h} delay={0.3 + i * 0.07} />
      ))}

      {/* ── Mailbox — goes up the moment the property is a real listing ───── */}
      {listed && <Mailbox x={70} hasMail={hasMail} />}

      {/* ── The house — the focal character, sitting in its yard ──────────── */}
      <g transform="translate(22, 9.5)">
        <HouseArt mood={mood} vitals={vitals} windowOpacity={1} arrivingSoon={arrivingSoon} />
      </g>

      {/* ── Front-yard flowers, in front of the house base ────────────────── */}
      {flowers.filter(f => isFront(f.x)).map((f, i) => (
        <Flower key={`ff${f.x}-${i}`} x={f.x} hue={FLOWER_HUES[f.hue]} h={f.h} delay={0.5 + i * 0.1} />
      ))}

      {/* ── Butterflies wander the beds at maturity ───────────────────────── */}
      {consistent && !winter && <Butterfly x={20} y={31} hue="#CE8AA8" dur={6.5} />}
      {longTerm   && !winter && <Butterfly x={64} y={28} hue="#E8B7C9" dur={7.5} delay={1.2} />}
    </svg>
  )
}
