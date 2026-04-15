// Parses natural language into structured entries.
//
// Financial entries (expense / income):  requires a $ amount
//   "spatula amazon $14"  →  expense
//   "airbnb payout $1200" →  income
//
// Task / reminder entries:  no $ sign detected
//   "replace air filter"        →  task (no date)
//   "trash tomorrow"            →  reminder (due tomorrow)
//   "fix cabinet hinge weekend" →  task (due Saturday)
//
// Recurring rule entries:  no $ sign + recurring signal
//   "trash day"                 →  recurring rule (weekly, Wednesday night)
//   "recycling"                 →  recurring rule (biweekly, Wednesday night)
//   "water plants every monday" →  recurring rule (weekly, Monday)

export const CATEGORIES = [
  'Furniture', 'Appliances', 'Linens & supplies', 'Cleaning',
  'Maintenance & repairs', 'Utilities', 'Management fees',
  'Marketing', 'Insurance', 'Other'
]

export const INCOME_CATEGORIES = [
  'Booking revenue',
  'Cleaning fee',
  'Damage reimbursement',
  'Other income',
]

const CATEGORY_KEYWORDS = {
  'Furniture': ['couch','sofa','chair','table','bed','mattress','frame','dresser','desk','shelf','shelving','bookcase'],
  'Appliances': ['appliance','fridge','microwave','toaster','coffee maker','blender','vacuum','washer','dryer'],
  'Linens & supplies': ['towel','sheet','pillow','blanket','shampoo','soap','toilet paper','supplies','spatula','utensil','crockery','dish','pan','pot'],
  'Cleaning': ['clean','cleaning','mop','broom','sponge','detergent','spray'],
  'Maintenance & repairs': ['repair','fix','hardware','tool','plumb','electric','lock','paint','patch'],
  'Utilities': ['electric','gas','water','internet','wifi','trash','waste','utility'],
  'Management fees': ['hpm','hospitality','management','commission','fee'],
  'Marketing': ['photo','photography','listing','airbnb','vrbo'],
  'Insurance': ['insurance','state farm','policy'],
}

const TAX_KEYWORDS = {
  depreciate: ['furniture','couch','sofa','chair','table','bed','mattress','frame','dresser','appliance','fridge','microwave','tv','television'],
}

const INCOME_KEYWORDS = ['booking','reservation','airbnb','vrbo','guest','payout','rental income','cleaning fee']

// Time-related words that signal a reminder (vs plain task)
const REMINDER_TRIGGER_WORDS = [
  'today','tomorrow','this weekend','weekend','this week','next week',
  'monday','tuesday','wednesday','thursday','friday','saturday','sunday',
]

// Ordered list used for both detection and stripping from the title
const DATE_PHRASES = [
  'this weekend','next week','this week',
  'tomorrow','today',
  'on monday','on tuesday','on wednesday','on thursday','on friday','on saturday','on sunday',
  'monday','tuesday','wednesday','thursday','friday','saturday','sunday',
]

// ── Recurring pattern detection ───────────────────────────────────────────────
//
// These run BEFORE the generic task/reminder path so known house routines get
// the right cadence pre-filled instead of just a one-time due date.

// Known routine types — checked in order, most specific first
const KNOWN_ROUTINES = [
  {
    // Trash / garbage — fires Wednesday night for Thursday morning pickup
    re:          /\b(trash|garbage|rubbish|bins?)\s*(day|night|pickup|collection|out)?\b/i,
    type:        'trash',
    title:       'Trash goes out tonight.',
    cadence_type: 'weekly',
    cadence_weekday: 3, // Wednesday — night before pickup
  },
  {
    // Recycling — every other Wednesday night for Thursday morning pickup
    re:          /\b(recycl\w*|blue\s*bin)\s*(day|night|pickup|collection|out)?\b/i,
    type:        'recycling',
    title:       'Recycling goes out tonight.',
    cadence_type: 'biweekly',
    cadence_weekday: 3, // Wednesday — night before pickup
  },
  {
    // Plant watering
    re:          /\b(water|watering)\b.*\b(plant|garden|flower|herb)s?\b|\b(plant|garden|flower|herb)s?.*\b(water|watering)\b/i,
    type:        'plant_watering',
    title:       null, // use cleaned input
    cadence_type: 'weekly',
    cadence_weekday: null, // user must pick
  },
]

// Generic recurring signal — "every", "each", "weekly", "biweekly" with no known type
const RECURRING_RE  = /\b(every|each|weekly|biweekly|bi-weekly|repeating)\b/i
const BIWEEKLY_RE   = /\b(every\s+other|biweekly|bi-weekly|every\s+two\s+weeks?|alternating)\b/i

// Weekday name → getDay() value (0=Sun … 6=Sat)
const WEEKDAY_MAP = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
}

/** Extract the first weekday name found in text, or null. */
function detectWeekday(text) {
  const lower = text.toLowerCase()
  for (const [name, day] of Object.entries(WEEKDAY_MAP)) {
    if (new RegExp(`\\b${name}\\b`).test(lower)) return day
  }
  return null
}

/** Strip recurring signal words from title for cleaner display. */
const RECURRING_STRIP_RE = /\b(every\s+other|every|each|weekly|biweekly|bi-weekly|repeating)\b\s*/gi

function cleanRecurringTitle(text) {
  let result = text
    .replace(RECURRING_STRIP_RE, '')
    .replace(new RegExp(`\\b(${Object.keys(WEEKDAY_MAP).join('|')})\\b`, 'gi'), '')
  return result.replace(/\s+/g, ' ').trim()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true only when the input contains an explicit dollar amount */
function hasAmount(text) {
  return /\$[\d,]+/.test(text) || /\b\d+(?:\.\d{1,2})?\s*dollars?\b/i.test(text)
}

/** Resolve relative date words → YYYY-MM-DD, or null if none found */
function parseRelativeDate(text) {
  const lower = text.toLowerCase()
  const today = new Date()

  if (lower.includes('today')) {
    return today.toISOString().split('T')[0]
  }
  if (lower.includes('tomorrow')) {
    const d = new Date(today); d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }
  if (lower.includes('this weekend') || lower.includes('weekend')) {
    const d = new Date(today)
    const daysToSat = ((6 - d.getDay()) + 7) % 7 || 7
    d.setDate(d.getDate() + daysToSat)
    return d.toISOString().split('T')[0]
  }
  if (lower.includes('next week')) {
    const d = new Date(today); d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  }
  if (lower.includes('this week')) {
    const d = new Date(today); d.setDate(d.getDate() + 3)
    return d.toISOString().split('T')[0]
  }

  // Named weekdays — find next occurrence
  const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  for (let i = 0; i < weekdays.length; i++) {
    if (lower.includes(weekdays[i])) {
      const d = new Date(today)
      const diff = ((i - d.getDay()) + 7) % 7 || 7
      d.setDate(d.getDate() + diff)
      return d.toISOString().split('T')[0]
    }
  }

  return null
}

/** Strip date/time phrases from the title for cleaner display */
function cleanTaskTitle(text) {
  let result = text
  for (const phrase of DATE_PHRASES) {
    result = result.replace(new RegExp('\\b' + phrase.replace(/\s+/g, '\\s+') + '\\b', 'gi'), '')
  }
  return result.replace(/\s+/g, ' ').trim()
}

function guessCategory(text) {
  const lower = text.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return cat
  }
  return 'Other'
}

function guessTaxType(text, category) {
  const lower = text.toLowerCase()
  if (TAX_KEYWORDS.depreciate.some(k => lower.includes(k))) return 'depreciate'
  if (category === 'Furniture' || category === 'Appliances') return 'depreciate'
  return 'expense'
}

function guessEntryType(text) {
  const lower = text.toLowerCase()
  if (INCOME_KEYWORDS.some(k => lower.includes(k))) return 'income'
  return 'expense'
}

function guessIncomeCategory(text) {
  const lower = text.toLowerCase()
  if (lower.includes('cleaning')) return 'Cleaning fee'
  if (lower.includes('damage') || lower.includes('reimburse')) return 'Damage reimbursement'
  if (lower.includes('booking') || lower.includes('airbnb') || lower.includes('vrbo') || lower.includes('payout') || lower.includes('reservation')) return 'Booking revenue'
  return 'Other income'
}

// ── Main export ───────────────────────────────────────────────────────────────

export function parseNaturalLanguage(input) {
  const text = input.trim()

  // ── Recurring / task / reminder path ─────────────────────────────────────
  if (!hasAmount(text)) {

    // 1. Check known house routines first (trash, recycling, plants, etc.)
    for (const routine of KNOWN_ROUTINES) {
      if (routine.re.test(text)) {
        return {
          entry_type:      'reminder',
          title:           routine.title ?? (cleanRecurringTitle(text) || text),
          due_date:        null,
          completed:       false,
          recurring:       true,
          type:            routine.type,
          cadence_type:    routine.cadence_type,
          cadence_weekday: routine.cadence_weekday,
          _parsed:         true,
        }
      }
    }

    // 2. Check for generic recurring signals ("every Monday", "weekly", etc.)
    if (RECURRING_RE.test(text)) {
      const weekday    = detectWeekday(text)
      const isBiweekly = BIWEEKLY_RE.test(text)
      return {
        entry_type:      'reminder',
        title:           cleanRecurringTitle(cleanTaskTitle(text)) || text,
        due_date:        null,
        completed:       false,
        recurring:       true,
        type:            'general',
        cadence_type:    isBiweekly ? 'biweekly' : 'weekly',
        cadence_weekday: weekday, // null = user must pick in the form
        _parsed:         true,
      }
    }

    // 3. Regular one-time task or reminder
    const lower     = text.toLowerCase()
    const isReminder = REMINDER_TRIGGER_WORDS.some(w => lower.includes(w))
    const dueDate   = parseRelativeDate(text)
    const title     = cleanTaskTitle(text) || text

    return {
      entry_type: isReminder ? 'reminder' : 'task',
      title,
      due_date:   dueDate,
      completed:  false,
      _parsed:    true,
    }
  }

  // ── Financial path (existing behavior) ───────────────────────────────────

  // Extract amount — $XX or XX dollars
  const amountMatch = text.match(/\$?([\d,]+(?:\.\d{1,2})?)\s*(?:dollars?)?/i)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : null

  // Remove the amount from text for description
  const withoutAmount = text.replace(/\$[\d,]+(?:\.\d{1,2})?/, '').replace(/[\d,]+(?:\.\d{1,2})?\s*dollars?/i, '').trim()

  const entryType = guessEntryType(withoutAmount)
  const category = entryType === 'income' ? guessIncomeCategory(withoutAmount) : guessCategory(withoutAmount)
  const taxType = entryType === 'income' ? null : guessTaxType(withoutAmount, category)

  const today = new Date().toISOString().split('T')[0]

  return {
    description: withoutAmount.replace(/\s+/g, ' ').trim() || text,
    amount,
    category,
    entry_type: entryType,
    tax_type: taxType,
    date: today,
    recurring: false,
    recurring_frequency: 'monthly',
    recurring_day: new Date().getDate(),
    _parsed: true,
    _confidence: amount ? 'high' : 'low'
  }
}
