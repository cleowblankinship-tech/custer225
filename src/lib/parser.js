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

  // ── Task / reminder path ──────────────────────────────────────────────────
  if (!hasAmount(text)) {
    const lower = text.toLowerCase()
    const isReminder = REMINDER_TRIGGER_WORDS.some(w => lower.includes(w))
    const dueDate = parseRelativeDate(text)
    const title = cleanTaskTitle(text) || text

    return {
      entry_type: isReminder ? 'reminder' : 'task',
      title,
      due_date: dueDate,
      completed: false,
      _parsed: true,
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
