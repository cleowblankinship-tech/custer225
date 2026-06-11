// ── Financial buckets ─────────────────────────────────────────────────────────
//
// Every ledger entry maps to exactly one of seven money buckets. Buckets are
// DERIVED from existing fields (entry_type / category / tax_type) so no schema
// change is needed — the QuickAdd bucket picker simply writes the right
// category + tax_type combination.
//
//   gross      Gross Booking Revenue       income entries
//   operating  Operating Expenses          expense + tax_type 'expense'
//   debt       Debt Service                category 'Debt Service'
//   taxReserve Tax Reserve                 category 'Tax Reserve'
//   maintRes   Maintenance/Repairs Reserve legacy 'Maintenance reserve' rows only
//   startup    Startup/Furnishing Assets   expense + tax_type 'depreciate'
//   draw       Owner Draw                  category 'Owner Draw'
//
// Reserves, debt service, and draws use tax_type 'personal' so they stay OUT
// of the P&L operating totals — they're cash movements, not deductible costs.
// (Actual repairs paid for remain Operating under 'Maintenance'.)
//
// Derived metrics keep gross revenue separate from profitability:
//   NOI            = gross − operating          (before debt, reserves, draws)
//   cashFlow       = NOI − debt service          (cash the business generates)
//   availableCash  = cashFlow − reserves − draws (what's left to take out)

export const BUCKETS = {
  gross:      { label: 'Gross Booking Revenue',        short: 'Revenue',     color: 'var(--gold)'  },
  operating:  { label: 'Operating Expenses',           short: 'Operating',   color: 'var(--red)'   },
  debt:       { label: 'Debt Service',                 short: 'Debt',        color: 'var(--blue)'  },
  taxReserve: { label: 'Tax Reserve',                  short: 'Tax reserve', color: 'var(--text2)' },
  maintRes:   { label: 'Maintenance/Repairs Reserve',  short: 'Maint. res.', color: 'var(--text2)' },
  startup:    { label: 'Startup/Furnishing Assets',    short: 'Startup',     color: 'var(--text2)' },
  draw:       { label: 'Owner Draw',                   short: 'Draw',        color: 'var(--green)' },
}

// Categories that pin an entry to a bucket regardless of tax_type.
// Lowercase/legacy spellings are kept so old ledger rows still map; maintRes
// is legacy-only — it's no longer in the chart of accounts (lib/categories.js).
const CATEGORY_BUCKETS = {
  'Debt Service':        'debt',
  'Debt service':        'debt',
  'Mortgage interest':   'debt',
  'Tax Reserve':         'taxReserve',
  'Tax reserve':         'taxReserve',
  'Maintenance reserve': 'maintRes',
  'Owner Draw':          'draw',
  'Owner draw':          'draw',
}

export function getBucket(entry) {
  if (entry.entry_type === 'income') return 'gross'
  const byCat = CATEGORY_BUCKETS[entry.category]
  if (byCat) return byCat
  if (entry.tax_type === 'depreciate') return 'startup'
  return 'operating'
}

// QuickAdd bucket picker → field values written to the entry.
// `null` means "leave the user's choice alone" (category stays editable).
export const BUCKET_PRESETS = {
  operating:  { tax_type: 'expense',    category: null },
  startup:    { tax_type: 'depreciate', category: null },
  debt:       { tax_type: 'personal',   category: 'Debt Service' },
  taxReserve: { tax_type: 'personal',   category: 'Tax Reserve' },
  draw:       { tax_type: 'personal',   category: 'Owner Draw' },
}

/**
 * Roll the ledger up into bucket totals and derived metrics.
 * @param {Array} expenses — all ledger entries
 * @param {string|null} monthPrefix — 'YYYY-MM' to scope to a month, null = all time
 */
export function computeCashFlow(expenses, monthPrefix = null) {
  const totals = {
    gross: 0, operating: 0, debt: 0,
    taxReserve: 0, maintRes: 0, startup: 0, draw: 0,
  }

  for (const e of expenses) {
    if (e.entry_type !== 'income' && e.entry_type !== 'expense') continue
    if (monthPrefix && !e.date?.startsWith(monthPrefix)) continue
    totals[getBucket(e)] += Number(e.amount) || 0
  }

  const noi           = totals.gross - totals.operating
  const cashFlow      = noi - totals.debt
  const availableCash = cashFlow - totals.taxReserve - totals.maintRes - totals.draw

  return { ...totals, noi, cashFlow, availableCash }
}
