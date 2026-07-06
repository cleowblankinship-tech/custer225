import HouseArt from './HouseArt'

const GY = 47   // ground line in stage coords

function Ground() {
  return (
    <g stroke="currentColor" fill="none">
      <line x1="0" y1={GY} x2="84" y2={GY} strokeWidth="2.5"/>
      <line x1="38" y1={GY} x2="34" y2="58" strokeWidth="1.4" opacity="0.3"/>
      <line x1="46" y1={GY} x2="50" y2="58" strokeWidth="1.4" opacity="0.3"/>
    </g>
  )
}

function Tree({ x, h }) {
  const trunkH  = h * 0.38
  const r       = h * 0.42
  const cy      = GY - trunkH - r * 0.85
  const swayDur = 6 + (x % 5) * 0.5

  return (
    <g style={{
      animation: `canopySway ${swayDur}s ease-in-out infinite ${(x % 7) * 0.3}s`,
      transformBox: 'fill-box', transformOrigin: 'bottom center',
    }}>
      <line x1={x} y1={GY} x2={x} y2={GY - trunkH}
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx={x} cy={cy} r={r}
        fill="var(--bg)" stroke="currentColor" strokeWidth="2.5"/>
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

function BirdFlock({ dur, delay = 0, y = 9 }) {
  return (
    <g style={{ animation: `birdCross ${dur}s linear ${delay}s infinite` }}
      stroke="currentColor" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.5">
      <path d={`M 0 ${y} Q 1 ${y - 1.2} 2 ${y} Q 3 ${y - 1.2} 4 ${y}`}
        style={{ animation: 'birdFlap 0.5s ease-in-out infinite', transformBox: 'fill-box', transformOrigin: 'center' }} />
      <path d={`M 5 ${y + 2} Q 5.8 ${y + 1} 6.6 ${y + 2} Q 7.4 ${y + 1} 8.2 ${y + 2}`}
        style={{ animation: 'birdFlap 0.5s ease-in-out infinite 0.12s', transformBox: 'fill-box', transformOrigin: 'center' }} />
    </g>
  )
}

export default function HouseScene({ size = 260, mood = 'calm', vitals = null, scene = null, style }) {
  const activity     = scene?.activity ?? 0
  const hasMail      = !!vitals?.hasMail
  const listed       = scene?.listed ?? false
  const longTerm     = scene?.longTerm ?? false
  const arrivingSoon = scene?.arrivingSoon ?? false

  const W = size * (84 / 40)
  const H = size * (58 / 40)

  const lively  = Math.min(activity + (arrivingSoon ? 0.35 : 0), 1)
  const birdDur = 17 - lively * 6
  const treeH   = 11 + Math.min(scene?.bookings ?? 0, 16) * 0.45

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
      {/* Clouds — faint outlines, same line language as the house */}
      <g stroke="currentColor" fill="var(--bg)" strokeWidth="1.6">
        <g style={{ animation: 'cloudDrift 55s linear infinite', transformBox: 'fill-box', transformOrigin: 'center' }} opacity="0.22">
          <circle cx="20" cy="7" r="2.2" /><circle cx="23" cy="6.2" r="2.7" /><circle cx="26" cy="7.1" r="2" />
        </g>
        <g style={{ animation: 'cloudDrift 75s linear infinite 12s', transformBox: 'fill-box', transformOrigin: 'center' }} opacity="0.15">
          <circle cx="56" cy="4" r="1.7" /><circle cx="58.5" cy="3.3" r="2.1" /><circle cx="61" cy="4" r="1.6" />
        </g>
      </g>

      {/* Birds cross the sky */}
      <BirdFlock dur={birdDur} y={9} />
      {longTerm && <BirdFlock dur={birdDur + 6} delay={8} y={13} />}

      {/* Ground */}
      <Ground />

      {/* Left tree */}
      <Tree x={11} h={treeH} />

      {/* Mailbox */}
      {listed && <Mailbox x={70} hasMail={hasMail} />}

      {/* House */}
      <g transform="translate(22, 9.5)">
        <HouseArt mood={mood} vitals={vitals} arrivingSoon={arrivingSoon} />
      </g>
    </svg>
  )
}
