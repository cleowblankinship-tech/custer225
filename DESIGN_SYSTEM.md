# 225 Custer — Design System

> **Core principle: Maximal color, minimal clutter.**
> Color should feel expressive and alive. Layout stays clean, structured, and easy to scan.
> Personality comes from selective moments, not everywhere.

---

## Visual Layers

The UI has three distinct layers. Every component belongs to exactly one.

### 1. Character Layer
*House icon + speech bubble*

- Whimsical, playful, slightly imperfect
- More saturated color and organic shapes
- This is the emotional and brand layer
- **Must NOT feel like standard dashboard UI**
- The speech bubble is not a card. It represents the house speaking — lighter, more temporary, with a tail pointing toward the house icon.

### 2. System Layer
*Cards, layout, dashboard sections*

- Clean, minimal, consistent
- Neutral backgrounds with subtle tinting
- Responsible for clarity and usability
- Colors on text/numbers, not on backgrounds (usually)

### 3. Structure Layer
*Data, progress, key metrics, CTA buttons*

- More geometric and blocky
- Stronger visual weight
- Progress bars are chunky and square-ended — intentionally un-rounded

---

## Color Tokens

All colors live in `src/index.css` as CSS custom properties.

### Primary palette (derived from the house illustration)
| Token | Value | Use |
|---|---|---|
| `--accent` | `#C05538` | Terracotta — house body, primary brand action |
| `--accent-light` | `#FAEDE9` | Soft tint for urgent speech bubble bg |
| `--gold` | `#A0720A` | Door/light — revenue, income |
| `--gold-bg` | `#FDF4E3` | Light tint for revenue card when positive |
| `--blue` | `#185FA5` | Roof — assets, depreciable items |
| `--blue-bg` | `#E6F1FB` | Light tint (use sparingly) |

### Neutrals
| Token | Value | Use |
|---|---|---|
| `--bg` | `#FAFAF8` | App background — warm off-white, NOT pure white |
| `--bg2` | `#F2F0EC` | Card backgrounds — slightly warmer than bg |
| `--text` | `#1A1A1A` | Primary text |
| `--text2` | `#888880` | Secondary labels |
| `--text3` | `#BBBBBB` | Tertiary / sub-text |
| `--border` | `rgba(0,0,0,0.08)` | Subtle dividers |
| `--border-mid` | `rgba(0,0,0,0.12)` | Input borders, stronger dividers |

### Semantic
| Token | Value | Use |
|---|---|---|
| `--green` | `#3B6D11` | Expenses (spending is tracked, not bad) |
| `--green-bg` | `#EAF3DE` | Light tint (use sparingly) |
| `--red` | `#A32D2D` | Errors, overdue |
| `--red-bg` | `#FCEBEB` | Light tint for error states |

### Rules
- **Max 1–2 accent colors visible per screen.** Do not use terracotta, gold, blue, and green all at once.
- Tinted backgrounds are a strong visual signal — reserve them for the most important card on screen (usually Revenue).
- All other cards use `--bg2`. Put color on the number or label text instead.
- Never put high saturation everywhere. Color earns its place.

---

## Typography

Font: `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` (system stack)

### Scale
| Role | Size | Weight | Token |
|---|---|---|---|
| Hero metric | 38px | 700 | Revenue, big KPIs |
| Large metric | 24–28px | 600 | Month spend, readiness % |
| Medium metric | 18–22px | 500 | Secondary stats |
| Section label | 11px | 500–600 | Uppercase, tracked |
| Card label | 11px | 500 | Normal case |
| Body / sub | 12–14px | 400 | Supporting text |
| Fine print | 11px | 400 | "all time", "tap to view" |

### Rules
- Large bold numbers for key metrics — let the number do the talking
- Section labels: uppercase, `letterSpacing: '0.07–0.1em'`, muted color
- Tone: friendly but not childish, slightly conversational
- Avoid mixing more than 3 type sizes in a single card

---

## Spacing (8pt system)

| Value | Use |
|---|---|
| 4px | Icon gaps, tight inline spacing |
| 8px | Small gaps within a component |
| 12px | Between label and value inside a card |
| 16px | Card internal padding (standard) |
| 20px | Screen edge padding |
| 24px | Between major sections |
| 32px+ | Major layout separation |

### Rules
- Screen horizontal padding is always `20px`
- Card internal padding: `14–16px` horizontal, `11–18px` vertical (scales with card tier)
- Section spacing: `24px` padding-bottom between dashboard sections

---

## Border Radius

| Token | Value | Use |
|---|---|---|
| `--radius` | `12px` | Main cards, panels, overlays |
| `--radius-sm` | `8px` | Smaller cards, inputs, chips/tags |
| `--radius-bar` | `2px` | Progress bar tracks (blocky) |
| (none) | `0px` | Progress bar fill — **fully square** |

### Rules
- Cards use `--radius` or `--radius-sm` consistently — do not mix with arbitrary values
- Progress bar fill is always `borderRadius: 0` — the blocky shape is intentional (Structure Layer)
- Month picker chips use `--radius-sm`, not pills (`borderRadius: 20`)
- Speech bubble uses organic, slightly irregular per-corner radius to distinguish it from cards

---

## Shadows

- Use soft, low-opacity shadows only
- Speech bubble: `0 2px 16px rgba(0,0,0,0.08)` — slightly elevated (it "floats")
- Cards: no shadow by default — use `--bg2` background + border for separation
- Avoid heavy, dramatic, or colored shadows

---

## Component Patterns

### Cards (System Layer)
```
background: var(--bg2)
borderRadius: var(--radius) or var(--radius-sm)
padding: 14–18px
border: none (rely on background contrast vs --bg)
```
- Color goes on the number or label text, not the background
- Exception: the **Revenue hero card** earns a tinted background because it is the most important item on the home screen

### Revenue Card (tier 1 hero)
- Full-width, largest padding (`22px 20px 18px`)
- Background: tinted (`--gold-bg` when positive, blush `#F7E8E8` when zero)
- Left border accent: `4px solid` — the only card with this treatment
- Number: 38px/700
- Sub-label: conversational personality ("No income yet — let's fix that")

### Metric Cards (tier 2)
- Grid: `1fr 1fr`
- Number: 20–24px/500–600
- Background: `var(--bg2)` — no tint
- Color on number text only

### Supporting Cards (tier 3)
- Full-width grid span or standalone
- Muted: `soft` prop → number color `var(--text2)`, label `var(--text3)`
- Same `var(--bg2)` background

### Progress Bars (Structure Layer)
```
track:  height 10px, borderRadius 2px, background rgba(255,255,255,0.12) or --bg2
fill:   borderRadius 0 (square ends), strong branded gradient or solid color
```
The square-ended fill is a deliberate design decision — it reads as data, not decoration.

### Speech Bubble (Character Layer)
- NOT a card — it has a tail pointing toward the house icon
- Lighter shadow than cards
- Slightly organic borderRadius (irregular per-corner values)
- Tail: 16×16 square rotated 45°, `borderLeft + borderBottom` drawn, half-protruding from bubble's left edge
- Animates on every home-screen visit (fade + slide-in from left)
- Three mood variants: `urgent` (blush tint), `attention` (white, stronger border), `calm` (white, soft shadow)
- All moods: consistent uniform border — no heavy `borderLeft` accent (that's a card pattern)

### Buttons
- Slightly rounded (`--radius-sm`)
- Not pill-shaped
- Primary CTA: `background: var(--accent)`, white text
- Inline/ghost: transparent bg, subtle border or just text

---

## Motion

| Element | Animation |
|---|---|
| Speech bubble | 280ms ease — `opacity 0→1` + `translateX(-8px)→0` |
| Progress bar fill | `width` transition 400ms ease |
| House icon press | Scale + rotate spring: `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| State transitions | 150–200ms ease — fast and unobtrusive |

### Rules
- Motion is purposeful, not decorative
- Speech bubble animation plays on every home visit (signals "the house is saying something now")
- Avoid anything that loops, bounces repeatedly, or distracts from content
- Transitions between data states should be fast (under 200ms)

---

## Home Screen Hierarchy

The home screen has a clear visual priority order:

```
CHARACTER MOMENT   →  House + speech bubble (what the house is saying right now)
─────────────────────────────────────────────────────────────────────────
REVENUE            →  Hero card. The most important number. Tinted bg.
THIS MONTH         →  Tier 2 left. Current behavior.
TOTAL EXPENSES     →  Tier 2 right. Combined direct + assets.
ASSETS             →  Tier 3. Subset of total expenses. Muted.
─────────────────────────────────────────────────────────────────────────
LAUNCH READINESS   →  Dark card. Motivational engine. Branded gradient bar.
─────────────────────────────────────────────────────────────────────────
QUICK ADD          →  Always accessible. Accent-colored submit button.
```

---

## Decision Filter

Before adding or changing any UI element, ask:

1. **Which layer does this belong to?** Character / System / Structure
2. **Does this add a color that's already on screen?** If so, simplify.
3. **Is the background tinted when it doesn't need to be?** Put the color on text instead.
4. **Does this break vertical rhythm or feel cramped?** Add breathing room.
5. **If it's a progress bar, is it blocky?** It should be.
6. **If it looks like a speech bubble, does it have a tail?** It should.

> "A living house helping manage real responsibilities."
> Clean enough to trust. Alive enough to feel like home.
