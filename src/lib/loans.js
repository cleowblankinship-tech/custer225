// ── Loan tracking ─────────────────────────────────────────────────────────────

const LOANS_KEY = 'custer225_loans'

const DEFAULT_LOANS = [
  {
    id: 'hl',
    label: 'Home loan',
    lender: 'Mom & Dad',
    note: 'Whole life policy loan',
    noteDetail: 'Policy cash value keeps earning while borrowed — net cost is the spread between 8% and the policy dividend rate.',
    principal: 88500,
    rate: 0.08,
    startDate: '2026-04-01',
    payments: [],
  },
  {
    id: 'cc',
    label: 'Credit card cover',
    lender: 'Mom & Dad',
    note: 'Interest-free',
    noteDetail: null,
    principal: 5000,
    rate: 0,
    startDate: '2026-04-01',
    payments: [],
  },
]

export function getLoans() {
  try {
    const saved = localStorage.getItem(LOANS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Merge saved payments onto defaults in case new loan fields were added
      return DEFAULT_LOANS.map(def => {
        const found = parsed.find(l => l.id === def.id)
        return found ? { ...def, payments: found.payments ?? [] } : def
      })
    }
  } catch {}
  return DEFAULT_LOANS
}

export function saveLoans(loans) {
  try { localStorage.setItem(LOANS_KEY, JSON.stringify(loans)) } catch {}
}

export function addPaymentToLoan(loans, loanId, payment) {
  const updated = loans.map(l =>
    l.id === loanId
      ? { ...l, payments: [...l.payments, payment].sort((a, b) => a.date.localeCompare(b.date)) }
      : l
  )
  saveLoans(updated)
  return updated
}

export function deletePaymentFromLoan(loans, loanId, paymentId) {
  const updated = loans.map(l =>
    l.id === loanId
      ? { ...l, payments: l.payments.filter(p => p.id !== paymentId) }
      : l
  )
  saveLoans(updated)
  return updated
}

// ── Balance calculations ──────────────────────────────────────────────────────

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Day-by-day simulation using daily rate = APR / 365.
// Each day interest accrues on the outstanding balance; payments apply on their exact date.
export function currentBalance(loan, asOf = new Date()) {
  const { principal, rate, startDate, payments } = loan
  const dailyRate = rate / 365

  let balance = principal
  const start = new Date(startDate + 'T12:00:00')

  // Walk from day after start up to and including asOf
  let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)
  const endDs = dateStr(asOf)

  while (dateStr(cursor) <= endDs) {
    if (dailyRate > 0) balance *= (1 + dailyRate)

    const ds = dateStr(cursor)
    for (const p of payments) {
      if (p.date === ds) balance -= p.amount
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return Math.max(0, balance)
}

export function totalPaid(loan) {
  return loan.payments.reduce((s, p) => s + p.amount, 0)
}

export function interestAccrued(loan) {
  const bal  = currentBalance(loan)
  const paid = totalPaid(loan)
  return Math.max(0, bal + paid - loan.principal)
}

// ── Payoff projection ─────────────────────────────────────────────────────────

// Effective monthly rate from daily APR/365 compounding.
// More accurate than APR/12 for daily-accrual loans.
function effectiveMonthlyRate(annualRate) {
  if (annualRate === 0) return 0
  return Math.pow(1 + annualRate / 365, 365 / 12) - 1
}

// Given current balance, annual rate, and monthly payment →
// returns { months, totalInterest, totalPaid } or null if payment is too low.
export function payoffProjection(balance, annualRate, monthlyPayment) {
  if (monthlyPayment <= 0 || balance <= 0) return null

  const r = effectiveMonthlyRate(annualRate)

  if (r === 0) {
    const months = Math.ceil(balance / monthlyPayment)
    return { months, totalInterest: 0, totalPaid: balance }
  }

  const minPayment = balance * r
  if (monthlyPayment <= minPayment) return null // never pays off

  // n = -ln(1 - B·r / P) / ln(1 + r)
  const months = Math.ceil(
    -Math.log(1 - (balance * r) / monthlyPayment) / Math.log(1 + r)
  )
  const tp = monthlyPayment * months

  return { months, totalInterest: Math.max(0, tp - balance), totalPaid: tp }
}

export function minimumMeaningfulPayment(balance, annualRate) {
  // Monthly interest floor using effective monthly rate from daily compounding
  return balance * effectiveMonthlyRate(annualRate)
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatMonths(n) {
  if (n <= 0) return 'now'
  const years  = Math.floor(n / 12)
  const months = n % 12
  if (years === 0) return `${months} mo`
  if (months === 0) return `${years} yr`
  return `${years} yr ${months} mo`
}

export function payoffDate(monthsFromNow) {
  const d = new Date()
  d.setMonth(d.getMonth() + monthsFromNow)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function fmt(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}
