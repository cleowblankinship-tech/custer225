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
//   consistent   → garden beds appear
//   longTerm     → butterflies, more birds
//
// (Grass and trees are removed for now to keep the scene calmer.)
//
// The land itself — a dirt path to the door and a couple of stones — is always
// there: even a brand-new listing is rooted somewhere. New plants sprout up
// from the ground rather than popping in. Season recolors the foliage and, in
// winter, lays snow over the beds.
//
// Nature keeps its own earthy palette so the house's red coat stays the focus.

const GY = 47   // ground line in stage coords; the house's feet rest here
const CX = 42   // horizontal center of the stage (and the house)

const STEM  = '#6E8E54'
const DIRT  = '#CBB489'
const STONE = '#B9B2A6'
const CLOUD = '#D8CEBE'
const BIRD  = '#9C8E7A'
const SNOW  = '#EAF1F4'
const SOIL  = '#A98C68'
const FLOWER_HUES = ['#E3B23C', '#E0703F', '#8A6480', '#D6537C', '#EFE6D2']

// ── Ground: the land the house is rooted in (always present) ────────────────
function Ground({ winter }) {
  return (
    <g>
      {winter && <rect x="0" y={GY} width="84" height={58 - GY} fill={SNOW} stroke="none" opacity="0.4" />}

      {/* dirt path from the front door toward the viewer — clearer at a glance:
          a defined fill, soft edge lines, and a centre seam */}
      <path d={`M 38.5 ${GY} L 45.5 ${GY} L 51 57.5 L 33 57.5 Z`} fill={DIRT} stroke="none" opacity={winter ? 0.7 : 0.95} />
      <g stroke="#A8895E" strokeWidth="0.6" strokeLinecap="round" opacity="0.55" fill="none">
        <path d={`M 38.5 ${GY} L 33 57.5`} />
        <path d={`M 45.5 ${GY} L 51 57.5`} />
        <path d={`M 42 ${GY + 1} L 42 57`} strokeWidth="0.5" opacity="0.4" strokeDasharray="1.4 2" />
      </g>
      {/* stepping stones up the path — defined with a thin rim + highlight */}
      {[[CX, GY + 2.6, 2.4], [CX - 0.3, GY + 5.6, 2.9], [CX - 0.7, GY + 8.8, 3.3]].map(([sx, sy, rx], i) => (
        <g key={i}>
          <ellipse cx={sx} cy={sy} rx={rx} ry={rx * 0.36} fill={STONE} stroke="#9A9388" strokeWidth="0.35" />
          <ellipse cx={sx - rx * 0.2} cy={sy - 0.25} rx={rx * 0.5} ry={rx * 0.16} fill="#C9C3B8" stroke="none" opacity="0.7" />
        </g>
      ))}

      {/* a couple of stones resting on the ground */}
      <ellipse cx={26} cy={GY + 1.6} rx="1.7" ry="0.8" fill={STONE} stroke="#9A9388" strokeWidth="0.3" />
      <ellipse cx={59} cy={GY + 2}   rx="2.1" ry="0.9" fill={STONE} stroke="#9A9388" strokeWidth="0.3" />
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
