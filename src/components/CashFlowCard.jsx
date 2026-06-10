import { useMemo, useState } from 'react'
import { computeCashFlow } from '../lib/finance'

// ── CashFlowCard ──────────────────────────────────────────────────────────────
//
// The money waterfall. Keeps gross revenue strictly separate from
// profitability metrics:
//
//   Gross Booking Revenue
//   − Operating Expenses   = NOI
//   − Debt Service         = Cash Flow
//   − Tax Reserve
//   − Maintenance Reserve
//   − Owner Draws          = Available Cash
//
// Startup/Furnishing Assets sit outside the waterfall — capital invested,
// not a recurring cost.

const fmt = (n) => {
  const abs = '$' + Math.abs(Number(n)).toLocaleString('en-US', { maximumFractionDigits: 0 })
  return n < 0 ? `(${abs})` : abs
}

export default function CashFlowCard({ expenses }) {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [scope, setScope] = useState('all') // 'all' | 'month'

  const cf = useMemo(
    () => computeCashFlow(expenses, scope === 'month' ? currentMonth : null),
    [expenses, scope, currentMonth]
  )

  const rows = [
    { label: 'Gross Booking Revenue', amount: cf.gross,       sign: +1, hero: true },
    { label: 'Operating Expenses',    amount: cf.operating,   sign: -1 },
    { label: 'NOI',                   amount: cf.noi,         subtotal: true },
    { label: 'Debt Service',          amount: cf.debt,        sign: -1 },
    { label: 'Cash Flow',             amount: cf.cashFlow,    subtotal: true },
    { label: 'Tax Reserve',           amount: cf.taxReserve,  sign: -1 },
    { label: 'Maintenance Reserve',   amount: cf.maintRes,    sign: -1 },
    { label: 'Owner Draws',           amount: cf.draw,        sign: -1 },
    { label: 'Available Cash',        amount: cf.availableCash, subtotal: true, final: true },
  ]

  return (
    <div style={{ padding: '0 20px 8px' }}>

      {/* Header + scope toggle */}
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        marginBottom: 14,
      }}>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--text3)',
        }}>
          Cash Flow
        </p>
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg2)', borderRadius: 6, padding: 2 }}>
          {[['all', 'All time'], ['month', 'This month']].map(([key, label]) => (
            <button key={key} onClick={() => setScope(key)} style={{
              fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 4,
              background: scope === key ? 'var(--bg)' : 'transparent',
              color: scope === key ? 'var(--text)' : 'var(--text3)',
              boxShadow: scope === key ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Waterfall */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map(({ label, amount, sign, subtotal, hero, final }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            padding: subtotal ? '8px 0' : '5px 0',
            borderTop: subtotal ? '1px solid var(--border-mid)' : 'none',
            marginTop: subtotal ? 4 : 0,
            marginBottom: subtotal && !final ? 8 : 0,
          }}>
            <span style={{
              fontSize: subtotal ? 13 : 12,
              fontWeight: subtotal ? 800 : hero ? 700 : 500,
              color: subtotal ? 'var(--text)' : hero ? 'var(--gold)' : 'var(--text2)',
              letterSpacing: subtotal ? '-0.01em' : 0,
            }}>
              {label}
            </span>
            <span style={{
              fontSize: final ? 20 : subtotal ? 15 : 13,
              fontWeight: subtotal || hero ? 800 : 600,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              color: hero     ? 'var(--gold)'
                   : final    ? (amount >= 0 ? 'var(--green)' : 'var(--red)')
                   : subtotal ? (amount >= 0 ? 'var(--text)' : 'var(--red)')
                   : sign < 0 && amount > 0 ? 'var(--text2)'
                   : 'var(--text3)',
            }}>
              {sign === -1 && amount > 0 ? `− ${fmt(amount)}` : fmt(amount)}
            </span>
          </div>
        ))}
      </div>

      {/* Startup capital — outside the operating waterfall */}
      <div style={{
        marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--border-mid)',
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>
          Startup/Furnishing Assets <span style={{ fontWeight: 400 }}>(capital, not P&L)</span>
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>
          {fmt(cf.startup)}
        </span>
      </div>
    </div>
  )
}
