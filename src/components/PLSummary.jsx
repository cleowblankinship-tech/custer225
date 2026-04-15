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

export default function PLSummary({ expenses, onNavigate }) {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [showPicker, setShowPicker] = useState(false)

  const availableMonths = useMemo(() => {
    const months = [...new Set(expenses.map(e => e.date?.slice(0,7)).filter(Boolean))]
    return months.sort().reverse()
  }, [expenses])

  const stats = useMemo(() => {
    const incomeEntries = expenses.filter(e => e.entry_type === 'income')
    const expenseEntries = expenses.filter(e => e.entry_type !== 'income')

    const monthExpenses = expenseEntries.filter(e => e.date?.startsWith(selectedMonth))
    const monthTotal = monthExpenses.reduce((s, e) => s + Number(e.amount), 0)

    const totalRevenue = incomeEntries.reduce((s, e) => s + Number(e.amount), 0)
    const allTimeDepreciable = expenseEntries.filter(e => e.tax_type === 'depreciate').reduce((s, e) => s + Number(e.amount), 0)
    const allTimeExpenses = expenseEntries.filter(e => e.tax_type === 'expense').reduce((s, e) => s + Number(e.amount), 0)

    return { monthTotal, totalRevenue, allTimeDepreciable, allTimeExpenses }
  }, [expenses, selectedMonth])

  const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const selectedMonthName = MONTH_NAMES[parseInt(selectedMonth.split('-')[1]) - 1]

  return (
    <div style={{ padding: '0 20px 20px' }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
        {now.getFullYear()} overview
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

        {/* Month spend card — special: opens picker */}
        <button
          onClick={() => setShowPicker(p => !p)}
          style={{
            background: showPicker ? 'var(--text)' : 'var(--bg2)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px 16px',
            textAlign: 'left',
            width: '100%',
            transition: 'background 0.2s',
          }}
        >
          <p style={{ fontSize: 11, fontWeight: 500, marginBottom: 4, color: showPicker ? 'rgba(255,255,255,0.55)' : 'var(--text2)' }}>
            {selectedMonthName} spend ▾
          </p>
          <p style={{ fontSize: 22, fontWeight: 500, lineHeight: 1, color: showPicker ? 'white' : 'var(--text)' }}>
            {fmt(stats.monthTotal)}
          </p>
          <p style={{ fontSize: 11, marginTop: 4, color: showPicker ? 'rgba(255,255,255,0.4)' : 'var(--text3)' }}>
            tap to change month
          </p>
        </button>

        <StatCard
          label="Revenue"
          value={fmt(stats.totalRevenue)}
          sub={stats.totalRevenue > 0 ? 'all time' : 'none logged yet'}
          color="var(--accent)"
          bg="var(--accent-light)"
          onClick={() => onNavigate?.('income', null)}
        />
        <StatCard
          label="Direct expenses"
          value={fmt(stats.allTimeExpenses)}
          sub="all time"
          color="var(--green)"
          bg="var(--green-bg)"
          onClick={() => onNavigate?.('expense', null)}
        />
        <StatCard
          label="Depreciable assets"
          value={fmt(stats.allTimeDepreciable)}
          sub="all time"
          color="var(--blue)"
          bg="var(--blue-bg)"
          onClick={() => onNavigate?.('depreciate', null)}
        />
      </div>

      {/* Month picker */}
      {showPicker && (
        <div style={{
          marginTop: 10,
          background: 'var(--bg2)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 14px 12px',
        }}>
          <p style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
            Select month
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {(availableMonths.length > 0 ? availableMonths : [currentMonth]).map(m => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                style={{
                  padding: '6px 13px', borderRadius: 20, fontSize: 13,
                  background: selectedMonth === m ? 'var(--text)' : 'var(--bg)',
                  color: selectedMonth === m ? 'white' : 'var(--text2)',
                  fontWeight: selectedMonth === m ? 500 : 400,
                  border: '0.5px solid var(--border)',
                  transition: 'all 0.15s',
                }}
              >
                {formatMonthLabel(m)}
              </button>
            ))}
          </div>
          <button
            onClick={() => { onNavigate?.('all', selectedMonth); setShowPicker(false) }}
            style={{
              width: '100%', padding: '11px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--text)', color: 'var(--bg)',
              fontSize: 13, fontWeight: 500,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <span>View {formatMonthLabel(selectedMonth)} expenses</span>
            <span>→</span>
          </button>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, color, bg, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: bg || 'var(--bg2)',
        borderRadius: 'var(--radius-sm)',
        padding: '14px 16px',
        textAlign: 'left',
        width: '100%',
        transition: 'opacity 0.15s',
      }}
      onMouseDown={e => { e.currentTarget.style.opacity = '0.7' }}
      onMouseUp={e => { e.currentTarget.style.opacity = '1' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
    >
      <p style={{ fontSize: 11, color: color || 'var(--text2)', fontWeight: 500, marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 500, color: color || 'var(--text)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: color || 'var(--text3)', marginTop: 4 }}>{sub}</p>}
    </button>
  )
}
