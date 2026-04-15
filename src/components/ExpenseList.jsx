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

function formatDueDate(dateStr) {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Today'
  if (dateStr === tomorrow) return 'Tomorrow'
  // "Apr 18" style
  const [, m, d] = dateStr.split('-')
  const month = MONTH_NAMES[parseInt(m) - 1].slice(0, 3)
  return `${month} ${parseInt(d)}`
}

const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ── Task row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, onToggle, onDelete, isLast }) {
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = task.due_date && !task.completed && task.due_date < today
  const isDueToday = task.due_date === today

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      borderBottom: isLast ? 'none' : '0.5px solid var(--border)',
    }}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          border: `1.5px solid ${task.completed ? 'var(--text3)' : 'var(--border-mid)'}`,
          background: task.completed ? 'var(--text3)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontSize: 11, fontWeight: 700,
          transition: 'all 0.15s',
        }}
      >
        {task.completed ? '✓' : ''}
      </button>

      {/* Title + due date */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 500,
          textDecoration: task.completed ? 'line-through' : 'none',
          color: task.completed ? 'var(--text3)' : 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {task.title}
        </p>
        {task.due_date && (
          <p style={{
            fontSize: 11, marginTop: 2,
            color: isOverdue ? 'var(--red, #e05252)' : isDueToday ? 'var(--accent)' : 'var(--text3)',
          }}>
            {isOverdue ? '⚠ ' : ''}{formatDueDate(task.due_date)}
          </p>
        )}
      </div>

      {/* Type badge */}
      <span style={{
        fontSize: 10, padding: '3px 8px', borderRadius: 20,
        background: task.entry_type === 'reminder' ? 'var(--accent-light)' : 'var(--bg2)',
        color: task.entry_type === 'reminder' ? 'var(--accent)' : 'var(--text3)',
        fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {task.entry_type === 'reminder' ? 'Reminder' : 'Task'}
      </span>

      {/* Delete */}
      {onDelete && (
        <button
          onClick={() => onDelete(task.id)}
          style={{ color: 'var(--text3)', fontSize: 16, padding: '0 4px', lineHeight: 1, flexShrink: 0 }}
        >
          ×
        </button>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExpenseList({
  expenses,
  onDelete,
  initialFilter = 'all',
  initialMonth = null,
  tasks = [],
  onDeleteTask,
  onToggleTask,
}) {
  const [filter, setFilter] = useState(initialFilter)
  const [activeMonth, setActiveMonth] = useState(initialMonth)

  const isTaskView = filter === 'tasks'

  // ── Tasks ─────────────────────────────────────────────────────────────────

  const sortedTasks = useMemo(() => {
    if (!isTaskView) return []
    return [...tasks].sort((a, b) => {
      // Incomplete first
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      // Then by due_date (nulls last)
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return a.due_date < b.due_date ? -1 : 1
    })
  }, [tasks, isTaskView])

  // ── Expenses ──────────────────────────────────────────────────────────────

  const availableMonths = useMemo(() => {
    const months = [...new Set(expenses.map(e => e.date?.slice(0,7)).filter(Boolean))]
    return months.sort().reverse()
  }, [expenses])

  const filtered = useMemo(() => {
    if (isTaskView) return []
    let result = [...expenses]
    if (filter === 'income') {
      result = result.filter(e => e.entry_type === 'income')
    } else {
      result = result.filter(e => e.entry_type !== 'income')
      if (filter !== 'all') {
        result = result.filter(e => e.tax_type === filter)
      }
    }
    if (activeMonth) {
      result = result.filter(e => e.date?.startsWith(activeMonth))
    }
    return result
  }, [expenses, filter, activeMonth, isTaskView])

  const grouped = filtered.reduce((acc, e) => {
    const month = e.date?.slice(0, 7) || 'Unknown'
    if (!acc[month]) acc[month] = []
    acc[month].push(e)
    return acc
  }, {})

  // ── Filter chip labels ────────────────────────────────────────────────────

  const filterChips = [
    { key: 'all',        label: 'All expenses' },
    { key: 'expense',    label: 'Expense' },
    { key: 'depreciate', label: 'Depreciable' },
    { key: 'income',     label: 'Income' },
    { key: 'tasks',      label: `Tasks${tasks.length ? ` · ${tasks.filter(t => !t.completed).length}` : ''}` },
  ]

  return (
    <div style={{ flex: 1, padding: '0 20px 40px' }}>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
        {filterChips.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, whiteSpace: 'nowrap',
              background: filter === key ? 'var(--text)' : 'var(--bg2)',
              color: filter === key ? 'var(--bg)' : 'var(--text2)',
              fontWeight: filter === key ? 500 : 400,
              transition: 'all 0.15s'
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Task view ──────────────────────────────────────────────────────── */}
      {isTaskView ? (
        sortedTasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 14, paddingTop: 40 }}>
            No tasks yet — try typing "fix cabinet hinge" or "trash tomorrow"
          </p>
        ) : (
          <div style={{
            background: 'var(--bg)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)', overflow: 'hidden'
          }}>
            {sortedTasks.map((t, i) => (
              <TaskRow
                key={t.id}
                task={t}
                onToggle={onToggleTask}
                onDelete={onDeleteTask}
                isLast={i === sortedTasks.length - 1}
              />
            ))}
          </div>
        )
      ) : (

      /* ── Expense / income view ─────────────────────────────────────────── */
      <>
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
      </>
      )}
    </div>
  )
}
