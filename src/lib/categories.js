// ── Chart of accounts ─────────────────────────────────────────────────────────
//
// The ledger is built around ACCOUNTING categories, not Airbnb/listing
// categories. The calendar is operational (who's staying when); the ledger is
// financial (where money came from and went). This module is the single source
// of truth for the chart of accounts — every ledger surface (QuickAdd,
// ExpenseList, P&L, CSV import, cash flow) reads from here.

export const INCOME_CATEGORIES = [
  'Gross Booking Revenue',
  'Other income',
]

// Deductible operating costs — these make up the P&L expense section
export const OPERATING_CATEGORIES = [
  'Property Management',
  'Cleaning',
  'Utilities',
  'Internet',
  'Supplies',
  'Maintenance',
  'Insurance',
  'Property Tax',
  'Other',
]

// Cash movements — transfers, not deductible costs; excluded from the P&L
export const CASH_MOVEMENT_CATEGORIES = [
  'Debt Service',
  'Tax Reserve',
  'Owner Draw',
]

// Old listing-style category names → accounting category. Existing ledger rows
// keep their stored category; normalizeCategory() rolls them up at read time
// so no data migration is needed.
const LEGACY_MAP = {
  // income
  'Booking revenue':       'Gross Booking Revenue',
  'Cleaning fee':          'Gross Booking Revenue',
  'Damage reimbursement':  'Other income',
  // operating expenses
  'Management fees':       'Property Management',
  'Maintenance & repairs': 'Maintenance',
  'Linens & supplies':     'Supplies',
  'Furniture':             'Supplies',
  'Appliances':            'Supplies',
  'Marketing':             'Other',
  'HOA':                   'Other',
  'Professional fees':     'Other',
  // cash movements
  'Mortgage interest':     'Debt Service',
  'Debt service':          'Debt Service',
  'Tax reserve':           'Tax Reserve',
  'Owner draw':            'Owner Draw',
}

export function normalizeCategory(category) {
  return LEGACY_MAP[category] ?? category ?? 'Other'
}
