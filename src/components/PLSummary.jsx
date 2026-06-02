import { useMemo, useState } from 'react'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

function formatMonthLabel(ym) {
  if (!ym) return ''
  const [year, month] = ym.split('-')
  return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`
}

export default function PLSummary({ expenses, onNavigate, isPreLaunch }) {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [showPicker,    setShowPicker]    = useState(false)

  const availableMonths = useMemo(() => {
    const months = new Set([currentMonth, ...expenses.map(e => e.date?.slice(0,7)).filter(Boolean)])
    return [...months].sort().reverse()
  }, [expenses, currentMonth])

  const stats = useMemo(() => {
    const incomeEntries  = expenses.filter(e => e.entry_type === 'income')
    const expenseEntries = expenses.filter(e => e.entry_type !== 'income')

    const monthExpenses = expenseEntries.filter(e => e.date?.startsWith(selectedMonth))
    const monthTotal    = monthExpenses.reduce((s, e) => s + Number(e.amount), 0)

    const totalRevenue       = incomeEntries.reduce((s, e) => s + Number(e.amount), 0)
    const allTimeDepreciable = expenseEntries.filter(e => e.tax_type === 'depreciate').reduce((s, e) => s + Number(e.amount), 0)
    const allTimeExpenses    = expenseEntries.filter(e => e.tax_type === 'expense').reduce((s, e) => s + Number(e.amount), 0)
    const allTimeTotal       = allTimeExpenses + allTimeDepreciable

    return { monthTotal, totalRevenue, allTimeDepreciable, allTimeExpenses, allTimeTotal }
  }, [expenses, selectedMonth])

  const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const selectedMonthName = MONTH_NAMES[parseInt(selectedMonth.split('-')[1]) - 1]

  const revenueZeroCopy = isPreLaunch ? 'Earning starts soon.' : 'Add your first booking.'
  const hasRevenue = stats.totalRevenue > 0

  return (
    <div style={{ padding: '0 20px 8px' }}>

      {/* ── Revenue — the hero metric ──────────────────────────────────── */}
      {/*
        Not a card — just the number and context.
        Tappable but visually reads as editorial type, not a UI widget.
      */}
      <button
        onClick={() => onNavigate?.('income', null)}
        style={{ width: '100%', textAlign: 'left', marginBottom: 28, display: 'block' }}
      >
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: hasRevenue ? 'var(--gold)' : 'var(--text3)',
          marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          Airbnb Revenue
          {isPreLaunch && !hasRevenue && (
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: '0.08em',
              color: 'var(--accent)', background: 'var(--accent-light)',
              borderRadius: 3, padding: '2px 6px',
            }}>
              Pre-launch
            </span>
          )}
        </p>

        <p style={{
          fontSize: 56, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em',
          color: hasRevenue ? 'var(--gold)' : 'var(--text)',
          marginBottom: 8,
        }}>
          {fmt(stats.totalRevenue)}
        </p>

        <p style={{ fontSize: 12, color: 'var(--text3)' }}>
          {hasRevenue ? 'all time · tap to view ledger →' : revenueZeroCopy}
        </p>
      </button>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: 'var(--border-mid)', marginBottom: 24 }} />

      {/* ── Month spending — prominent secondary ───────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setShowPicker(p => !p)}
          style={{ width: '100%', textAlign: 'left', display: 'block' }}
        >
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            color: showPicker ? 'var(--accent)' : 'var(--text3)',
            marginBottom: 8,
          }}>
            {selectedMonthName} Spending
            <span style={{ marginLeft: 6, opacity: 0.6 }}>{showPicker ? '▲' : '▼'}</span>
          </p>
          <p style={{
            fontSize: 36, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em',
            color: 'var(--text)',
          }}>
            {fmt(stats.monthTotal)}
          </p>
        </button>

        {/* Month picker */}
        {showPicker && (
          <div style={{
            marginTop: 14,
            background: 'var(--bg)',
            border: '1px solid var(--border-mid)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 14px 12px',
          }}>
            <p style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              Select month
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {availableMonths.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  style={{
                    padding: '5px 12px', borderRadius: 4, fontSize: 12,
                    background: selectedMonth === m ? 'var(--text)' : 'var(--bg2)',
                    color: selectedMonth === m ? 'var(--bg)' : 'var(--text2)',
                    fontWeight: selectedMonth === m ? 600 : 400,
                    border: '1px solid var(--border)',
                  }}
                >
                  {formatMonthLabel(m)}
                </button>
              ))}
            </div>
            <button
              onClick={() => { onNavigate?.('all', selectedMonth); setShowPicker(false) }}
              style={{
                width: '100%', padding: '10px 14px',
                borderRadius: 4, background: 'var(--text)', color: 'var(--bg)',
                fontSize: 12, fontWeight: 600,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <span>View {formatMonthLabel(selectedMonth)}</span>
              <span>→</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Tertiary: all-time breakdown ───────────────────────────────── */}
      {/*
        Three inline stats at a significantly smaller scale than the two
        above. This enforces hierarchy without equal-weight cards.
      */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: 1, background: 'var(--border)',
        borderRadius: 'var(--radius-sm)', overflow: 'hidden',
      }}>
        {[
          { label: 'All-time spent',   value: fmt(stats.allTimeTotal),       onClick: () => onNavigate?.('expense', null) },
          { label: 'Operating',        value: fmt(stats.allTimeExpenses),     onClick: () => onNavigate?.('expense', null) },
          { label: 'Startup assets',   value: fmt(stats.allTimeDepreciable),  onClick: () => onNavigate?.('depreciate', null) },
        ].map(({ label, value, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            style={{ background: 'var(--bg2)', padding: '12px 12px', textAlign: 'left' }}
          >
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 5 }}>
              {label}
            </p>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text2)', lineHeight: 1 }}>
              {value}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
