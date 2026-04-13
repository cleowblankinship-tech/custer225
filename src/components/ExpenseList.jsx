import { useState, useMemo } from 'react'

const TAX_CONFIG = {
  depreciate: { label: 'Depreciable', color: 'var(--blue)',   bg: 'var(--blue-bg)' },
  expense:    { label: 'Expense',     color: 'var(--green)',  bg: 'var(--green-bg)' },
  income:     { label: 'Income',      color: 'var(--accent)', bg: 'var(--accent-light)' },
}

const FREQ_LABELS = { monthly: 'Monthly', weekly: 'Weekly', quarterly: 'Quarterly', yearly: 'Yearly' }

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

function formatMonthLabel(ym) {
  if (!ym) return ym
  const [year, month] = ym.split('-')
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`
}

const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function ExpenseList({ expenses, onDelete, initialFilter = 'all', initialMonth = null }) {
  const [filter, setFilter] = useState(initialFilter)
  const [activeMonth, setActiveMonth] = useState(initialMonth)

  const availableMonths = useMemo(() => {
    const months = [...new Set(expenses.map(e => e.date?.slice(0,7)).filter(Boolean))]
    return months.sort().reverse()
  }, [expenses])

  const filtered = useMemo(() => {
    let result = [...expenses]

    // Separate income vs expense views
    if (filter === 'income') {
      result = result.filter(e => e.entry_type === 'income')
    } else {
      result = result.filter(e => e.entry_type !== 'income')
      if (filter !== 'all') {
        result = result.filter(e => e.tax_type === filter)
      }
    }

    // Month filter
    if (activeMonth) {
      result = result.filter(e => e.date?.startsWith(activeMonth))
    }

    return result
  }, [expenses, filter, activeMonth])

  const grouped = filtered.reduce((acc, e) => {
    const month = e.date?.slice(0, 7) || 'Unknown'
    if (!acc[month]) acc[month] = []
    acc[month].push(e)
    return acc
  }, {})

  return (
    <div style={{ flex: 1, padding: '0 20px 40px' }}>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
        {['all', 'expense', 'depreciate', 'income'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, whiteSpace: 'nowrap',
              background: filter === f ? 'var(--text)' : 'var(--bg2)',
              color: filter === f ? 'var(--bg)' : 'var(--text2)',
              fontWeight: filter === f ? 500 : 400,
              transition: 'all 0.15s'
            }}
          >
            {f === 'all' ? 'All expenses' : f === 'income' ? 'Income' : TAX_CONFIG[f].label}
          </button>
        ))}
      </div>

      {/* Month chips */}
      {availableMonths.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, overflowX: 'auto', paddingBottom: 2 }}>
          <button
            onClick={() => setActiveMonth(null)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, whiteSpace: 'nowrap',
              background: !activeMonth ? 'var(--text)' : 'var(--bg2)',
              color: !activeMonth ? 'var(--bg)' : 'var(--text3)',
              fontWeight: !activeMonth ? 500 : 400,
              transition: 'all 0.15s'
            }}
          >
            All months
          </button>
          {availableMonths.map(m => (
            <button
              key={m}
              onClick={() => setActiveMonth(activeMonth === m ? null : m)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, whiteSpace: 'nowrap',
                background: activeMonth === m ? 'var(--text)' : 'var(--bg2)',
                color: activeMonth === m ? 'var(--bg)' : 'var(--text3)',
                fontWeight: activeMonth === m ? 500 : 400,
                transition: 'all 0.15s'
              }}
            >
              {formatMonthLabel(m)}
            </button>
          ))}
        </div>
      )}

      {Object.keys(grouped).sort().reverse().map(month => (
        <div key={month} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {formatMonthLabel(month)}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>
              {filter === 'income' ? '+' : ''}{fmt(grouped[month].reduce((s, e) => s + Number(e.amount), 0))}
            </p>
          </div>
          <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {grouped[month].map((e, i) => {
              const isIncome = e.entry_type === 'income'
              const badge = isIncome ? TAX_CONFIG.income : (TAX_CONFIG[e.tax_type] || TAX_CONFIG.expense)
              return (
                <div
                  key={e.id || i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    borderBottom: i < grouped[month].length - 1 ? '0.5px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {e.description}
                      </p>
                      {e.recurring && (
                        <span style={{
                          fontSize: 10, color: 'var(--accent)', background: 'var(--accent-light)',
                          borderRadius: 10, padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          ↻ {FREQ_LABELS[e.recurring_frequency] || 'Recurring'}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{e.date}</span>
                      <span style={{ fontSize: 10, color: 'var(--text3)' }}>·</span>
                      <span style={{ fontSize: 11, color: 'var(--text2)' }}>{e.category}</span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, padding: '3px 8px', borderRadius: 20,
                    background: badge.bg, color: badge.color,
                    fontWeight: 500, whiteSpace: 'nowrap'
                  }}>
                    {badge.label}
                  </span>
                  <p style={{
                    fontSize: 15, fontWeight: 500, minWidth: 64, textAlign: 'right',
                    color: isIncome ? 'var(--accent)' : 'var(--text)',
                  }}>
                    {isIncome ? '+' : ''}{fmt(e.amount)}
                  </p>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(e.id)}
                      style={{ color: 'var(--text3)', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 14, paddingTop: 40 }}>
          No entries yet
        </p>
      )}
    </div>
  )
}
