import { useMemo } from 'react'

const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtShort = (n, showSign = false) => {
  const abs = '$' + Math.abs(Number(n)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  if (showSign && n < 0) return `(${abs})`
  return abs
}

const EXPENSE_CATEGORY_ORDER = [
  'Furniture', 'Appliances', 'Linens & supplies', 'Cleaning',
  'Maintenance & repairs', 'Utilities', 'Management fees',
  'Marketing', 'Insurance', 'Mortgage interest', 'HOA',
  'Professional fees', 'Other',
]

const INCOME_CATEGORY_ORDER = [
  'Booking revenue', 'Cleaning fee', 'Damage reimbursement', 'Other income',
]

export default function PLReport({ expenses }) {
  const stats = useMemo(() => {
    const incomeEntries  = expenses.filter(e => e.entry_type === 'income')
    const directExpenses = expenses.filter(e => e.entry_type !== 'income' && e.tax_type === 'expense')
    const depreciable    = expenses.filter(e => e.entry_type !== 'income' && e.tax_type === 'depreciate')

    const byCategory = (list) => {
      const map = {}
      for (const e of list) {
        const cat = e.category || 'Other'
        if (!map[cat]) map[cat] = 0
        map[cat] += Number(e.amount)
      }
      return map
    }

    const incomeCats    = byCategory(incomeEntries)
    const expenseCats   = byCategory(directExpenses)
    const depreciateCats = byCategory(depreciable)

    const totalRevenue    = incomeEntries.reduce((s, e) => s + Number(e.amount), 0)
    const totalExpenses   = directExpenses.reduce((s, e) => s + Number(e.amount), 0)
    const totalDepreciable = depreciable.reduce((s, e) => s + Number(e.amount), 0)
    const netIncome       = totalRevenue - totalExpenses

    return { incomeCats, expenseCats, depreciateCats, totalRevenue, totalExpenses, totalDepreciable, netIncome }
  }, [expenses])

  const allExpenseCats = [...new Set([...EXPENSE_CATEGORY_ORDER, ...Object.keys(stats.expenseCats)])].filter(c => stats.expenseCats[c])
  const allDepreciateCats = [...new Set([...EXPENSE_CATEGORY_ORDER, ...Object.keys(stats.depreciateCats)])].filter(c => stats.depreciateCats[c])
  const allIncomeCats = [...new Set([...INCOME_CATEGORY_ORDER, ...Object.keys(stats.incomeCats)])].filter(c => stats.incomeCats[c])

  const netPositive = stats.netIncome >= 0

  return (
    <div style={{ padding: '0 20px 60px' }}>

      {/* Top banner */}
      <div style={{
        background: 'var(--text)', color: 'var(--bg)',
        borderRadius: 'var(--radius)', padding: '20px',
        marginBottom: 24,
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0,
        textAlign: 'center',
      }}>
        <div style={{ borderRight: '0.5px solid rgba(255,255,255,0.15)', paddingRight: 12 }}>
          <p style={{ fontSize: 10, opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Revenue</p>
          <p style={{ fontSize: 20, fontWeight: 600, lineHeight: 1 }}>{fmtShort(stats.totalRevenue)}</p>
        </div>
        <div style={{ borderRight: '0.5px solid rgba(255,255,255,0.15)', padding: '0 12px' }}>
          <p style={{ fontSize: 10, opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Expenses</p>
          <p style={{ fontSize: 20, fontWeight: 600, lineHeight: 1 }}>{fmtShort(stats.totalExpenses)}</p>
        </div>
        <div style={{ paddingLeft: 12 }}>
          <p style={{ fontSize: 10, opacity: 0.55, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Net income</p>
          <p style={{
            fontSize: 20, fontWeight: 600, lineHeight: 1,
            color: stats.totalRevenue === 0 ? 'rgba(255,255,255,0.4)' : (netPositive ? '#7FCF7F' : '#FF8080'),
          }}>
            {stats.totalRevenue === 0 ? '—' : fmtShort(stats.netIncome, true)}
          </p>
        </div>
      </div>

      {/* Revenue */}
      <Section
        title="Revenue"
        subtitle="Rental income received"
        total={stats.totalRevenue}
        color="var(--accent)"
        bg="var(--accent-light)"
        categories={stats.incomeCats}
        order={allIncomeCats}
        empty="No income logged yet"
        positive
      />

      {/* Direct Expenses */}
      <Section
        title="Direct expenses"
        subtitle="Fully deductible this year (Schedule E)"
        total={stats.totalExpenses}
        color="var(--green)"
        bg="var(--green-bg)"
        categories={stats.expenseCats}
        order={allExpenseCats}
      />

      {/* Depreciable Assets */}
      <Section
        title="Depreciable assets"
        subtitle="Basis for Form 4562 — deducted over time"
        total={stats.totalDepreciable}
        color="var(--blue)"
        bg="var(--blue-bg)"
        categories={stats.depreciateCats}
        order={allDepreciateCats}
      />

      {/* Tax summary */}
      <div style={{
        borderTop: '0.5px solid var(--border)', paddingTop: 20,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
          Tax summary
        </p>
        <Row label="Gross revenue" value={fmt(stats.totalRevenue)} color="var(--accent)" />
        <Row label="Direct expenses (Schedule E)" value={`(${fmt(stats.totalExpenses)})`} color="var(--green)" />
        <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 10, marginTop: 2 }}>
          <Row
            label="Net rental income"
            value={stats.totalRevenue === 0 ? '—' : fmt(stats.netIncome)}
            color={stats.totalRevenue === 0 ? 'var(--text3)' : (netPositive ? 'var(--green)' : 'var(--red)')}
            bold
          />
        </div>
        <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
          <Row label="Depreciable asset basis (Form 4562)" value={fmt(stats.totalDepreciable)} color="var(--blue)" />
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle, total, color, bg, positive }) {
  const display = positive
    ? '+$' + Number(total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '$' + Number(total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (
    <div style={{
      background: bg, borderRadius: 'var(--radius-sm)', padding: '14px 16px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color }}>{title}</p>
        {subtitle && <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{subtitle}</p>}
      </div>
      <p style={{ fontSize: 18, fontWeight: 600, color }}>{display}</p>
    </div>
  )
}

function Section({ title, subtitle, total, color, bg, categories, order, empty, positive }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <SectionHeader title={title} subtitle={subtitle} total={total} color={color} bg={bg} positive={positive} />
      {order.length > 0 ? (
        <div style={{
          border: '0.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
          marginTop: 8, overflow: 'hidden',
        }}>
          {order.map((cat, i) => (
            <div
              key={cat}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 16px',
                borderBottom: i < order.length - 1 ? '0.5px solid var(--border)' : 'none',
                background: 'var(--bg)',
              }}
            >
              <p style={{ fontSize: 14, color: 'var(--text2)' }}>{cat}</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
                {positive ? '+' : ''}${Number(categories[cat]).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      ) : empty ? (
        <p style={{ fontSize: 13, color: 'var(--text3)', padding: '12px 0 0 2px' }}>{empty}</p>
      ) : null}
    </div>
  )
}

function Row({ label, value, color, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <p style={{ fontSize: 13, color: bold ? 'var(--text)' : 'var(--text2)', fontWeight: bold ? 500 : 400 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: bold ? 600 : 500, color: color || 'var(--text)', minWidth: 80, textAlign: 'right' }}>{value}</p>
    </div>
  )
}
