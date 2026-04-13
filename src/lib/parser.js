// Parses natural language like "spatula amazon $14 supplies"
// into a structured expense object

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

export function parseNaturalLanguage(input) {
  const text = input.trim()

  // Extract amount — look for $XX or XX dollars
  const amountMatch = text.match(/\$?([\d,]+(?:\.\d{1,2})?)\s*(?:dollars?)?/i)
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : null

  // Remove the amount from text for description
  const withoutAmount = text.replace(/\$[\d,]+(?:\.\d{1,2})?/, '').replace(/[\d,]+(?:\.\d{1,2})?\s*dollars?/i, '').trim()

  const entryType = guessEntryType(withoutAmount)
  const category = entryType === 'income' ? guessIncomeCategory(withoutAmount) : guessCategory(withoutAmount)
  const taxType = entryType === 'income' ? null : guessTaxType(withoutAmount, category)

  // Today's date as default
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
