import { useState } from 'react'
import { parseNaturalLanguage, CATEGORIES, INCOME_CATEGORIES } from '../lib/parser'
import { nextWeekdayDate } from '../lib/recurringRules'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const TAX_COLORS = { depreciate: 'var(--blue)', expense: 'var(--green)' }

const FREQ_OPTIONS = [
  { value: 'weekly',    label: 'Weekly' },
  { value: 'monthly',  label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly',   label: 'Yearly' },
]

function ordinal(n) {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function QuickAdd({ onAdd }) {
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState(null)
  const [confirming, setConfirming] = useState(false)

  function handleInput(val) {
    setInput(val)
    if (parsed) setParsed(null)
  }

  function handleParse() {
    if (!input.trim()) return
    const result = parseNaturalLanguage(input)
    setParsed(result)
    setConfirming(true)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleParse()
  }

  function handleConfirm() {
    const isTaskType = parsed?.entry_type === 'task' || parsed?.entry_type === 'reminder'
    if (isTaskType) {
      if (!parsed.title) return

      if (parsed.recurring) {
        // Validate a weekday is selected
        if (parsed.cadence_weekday == null) return
        const weekday     = parsed.cadence_weekday
        const cadenceType = parsed.cadence_type || 'weekly'
        const config      = cadenceType === 'biweekly'
          ? { weekday, anchor_date: nextWeekdayDate(weekday) }
          : { weekday }
        onAdd({
          entry_type:    'recurring_rule',
          title:         parsed.title,
          type:          'general',
          cadence_type:  cadenceType,
          cadence_config: config,
          active:        true,
        })
      } else {
        onAdd(parsed)
      }
    } else {
      if (!parsed || !parsed.amount || !parsed.description) return
      onAdd(parsed)
    }
    setInput('')
    setParsed(null)
    setConfirming(false)
  }

  function handleCancel() {
    setParsed(null)
    setConfirming(false)
  }

  const isTask = parsed?.entry_type === 'task' || parsed?.entry_type === 'reminder'
  const isIncome = parsed?.entry_type === 'income'

  return (
    <div style={{ padding: '0 20px 8px' }}>
      {!confirming ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input
              value={input}
              onChange={e => handleInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add expense, task, or reminder…"
              style={{
                border: '1.5px solid rgba(0,0,0,0.18)',
                padding: '11px 14px',
                fontSize: 15,
              }}
            />
          </div>
          <button
            onClick={handleParse}
            disabled={!input.trim()}
            style={{
              height: 46, padding: '0 20px', borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)',
              color: '#fff',
              opacity: input.trim() ? 1 : 0.55,
              fontWeight: 600, flexShrink: 0, transition: 'opacity 0.15s',
              fontSize: 14,
            }}
          >
            Add
          </button>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg)',
          border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius)',
          padding: 16
        }}>

          {/* ── Task / Reminder confirm ────────────────────────────────── */}
          {isTask ? (
            <>
              {/* Task / Reminder type toggle */}
              <div style={{
                display: 'flex', background: 'var(--bg2)',
                borderRadius: 'var(--radius-sm)', padding: 3,
                marginBottom: 14, gap: 3,
              }}>
                {['task', 'reminder'].map(t => (
                  <button
                    key={t}
                    onClick={() => setParsed({ ...parsed, entry_type: t })}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 13, fontWeight: 500,
                      background: parsed.entry_type === t ? 'var(--bg)' : 'transparent',
                      color: parsed.entry_type === t ? 'var(--text)' : 'var(--text3)',
                      boxShadow: parsed.entry_type === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t === 'task' ? '✓ Task' : '○ Reminder'}
                  </button>
                ))}
              </div>

              <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>Confirm {parsed.entry_type}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Field label="Title">
                  <input
                    value={parsed.title || ''}
                    onChange={e => setParsed({ ...parsed, title: e.target.value })}
                    style={{ borderColor: !parsed.title ? 'var(--red)' : undefined }}
                  />
                </Field>

                {/* Only show due date when not recurring — a rule has no single due date */}
                {!parsed.recurring && (
                  <Field label="Due date (optional)">
                    <input
                      type="date"
                      value={parsed.due_date || ''}
                      onChange={e => setParsed({ ...parsed, due_date: e.target.value || null })}
                    />
                  </Field>
                )}
              </div>

              {/* ── Repeat section ──────────────────────────────────────────── */}
              <div style={{ borderTop: '0.5px solid var(--border)', marginTop: 14, paddingTop: 12 }}>

                {/* Repeat toggle row */}
                <button
                  onClick={() => setParsed({
                    ...parsed,
                    recurring:       !parsed.recurring,
                    cadence_type:    parsed.cadence_type    || 'weekly',
                    cadence_weekday: parsed.cadence_weekday ?? null,
                  })}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '2px 0',
                  }}
                >
                  <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>Repeat</span>
                  <span style={{
                    width: 42, height: 24, borderRadius: 12,
                    background: parsed.recurring ? 'var(--text)' : 'var(--bg2)',
                    display: 'flex', alignItems: 'center', padding: '0 3px',
                    transition: 'background 0.2s', flexShrink: 0,
                  }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transform: parsed.recurring ? 'translateX(18px)' : 'translateX(0)',
                      transition: 'transform 0.2s', display: 'block',
                    }} />
                  </span>
                </button>

                {parsed.recurring && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* weekly / every other week */}
                    <Field label="Cadence">
                      <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 3 }}>
                        {[
                          { value: 'weekly',   label: 'Every week' },
                          { value: 'biweekly', label: 'Every other week' },
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setParsed({ ...parsed, cadence_type: opt.value })}
                            style={{
                              flex: 1, padding: '8px 4px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                              background: (parsed.cadence_type || 'weekly') === opt.value ? 'var(--bg)' : 'transparent',
                              color:      (parsed.cadence_type || 'weekly') === opt.value ? 'var(--text)' : 'var(--text3)',
                              boxShadow:  (parsed.cadence_type || 'weekly') === opt.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                              transition: 'all 0.15s',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </Field>

                    {/* Weekday picker */}
                    <Field label={parsed.cadence_weekday == null ? 'Day of week — pick one' : 'Day of week'}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {WEEKDAYS.map((label, i) => (
                          <button
                            key={label}
                            onClick={() => setParsed({ ...parsed, cadence_weekday: i })}
                            style={{
                              padding: '6px 10px', borderRadius: 20, fontSize: 13,
                              background: parsed.cadence_weekday === i ? 'var(--text)' : 'var(--bg2)',
                              color:      parsed.cadence_weekday === i ? 'var(--bg)' : 'var(--text2)',
                              fontWeight: parsed.cadence_weekday === i ? 500 : 400,
                              outline:    parsed.cadence_weekday == null ? '1px dashed var(--border-mid)' : 'none',
                              transition: 'all 0.15s',
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </Field>

                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button
                  onClick={handleCancel}
                  style={{
                    flex: 1, height: 44, borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg2)', color: 'var(--text2)', fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={parsed.recurring ? (!parsed.title || parsed.cadence_weekday == null) : !parsed.title}
                  style={{
                    flex: 2, height: 44, borderRadius: 'var(--radius-sm)',
                    background: 'var(--text)', color: 'var(--bg)', fontWeight: 500
                  }}
                >
                  {parsed.recurring ? 'Save recurring reminder' : `Save ${parsed.entry_type}`}
                </button>
              </div>
            </>
          ) : (

          /* ── Expense / Income confirm ──────────────────────────────── */
          <>
            {/* Income / Expense toggle */}
            <div style={{
              display: 'flex',
              background: 'var(--bg2)',
              borderRadius: 'var(--radius-sm)',
              padding: 3,
              marginBottom: 14,
              gap: 3,
            }}>
              {['expense', 'income'].map(t => (
                <button
                  key={t}
                  onClick={() => setParsed({
                    ...parsed,
                    entry_type: t,
                    category: t === 'income' ? INCOME_CATEGORIES[0] : CATEGORIES[0],
                    tax_type: t === 'income' ? null : 'expense',
                  })}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 13, fontWeight: 500,
                    background: parsed.entry_type === t ? 'var(--bg)' : 'transparent',
                    color: parsed.entry_type === t
                      ? (t === 'income' ? 'var(--accent)' : 'var(--text)')
                      : 'var(--text3)',
                    boxShadow: parsed.entry_type === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {t === 'income' ? '+ Income' : '− Expense'}
                </button>
              ))}
            </div>

            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>Confirm entry</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Field label="Description">
                <input value={parsed.description} onChange={e => setParsed({...parsed, description: e.target.value})} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label="Amount">
                  <input
                    type="number"
                    value={parsed.amount || ''}
                    onChange={e => setParsed({...parsed, amount: parseFloat(e.target.value)})}
                    placeholder="0.00"
                    style={{ borderColor: !parsed.amount ? 'var(--red)' : undefined }}
                  />
                </Field>
                <Field label="Date">
                  <input
                    type="date"
                    value={parsed.date}
                    onChange={e => setParsed({...parsed, date: e.target.value})}
                  />
                </Field>
              </div>

              {isIncome ? (
                <Field label="Category">
                  <select value={parsed.category} onChange={e => setParsed({...parsed, category: e.target.value})}>
                    {INCOME_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Field label="Category">
                    <select value={parsed.category} onChange={e => setParsed({...parsed, category: e.target.value})}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Tax treatment">
                    <select
                      value={parsed.tax_type}
                      onChange={e => setParsed({...parsed, tax_type: e.target.value})}
                      style={{ color: TAX_COLORS[parsed.tax_type] }}
                    >
                      <option value="expense">Direct expense</option>
                      <option value="depreciate">Depreciable</option>
                    </select>
                  </Field>
                </div>
              )}

              {/* Recurring toggle */}
              <div style={{
                borderTop: '0.5px solid var(--border)',
                paddingTop: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                <button
                  onClick={() => setParsed({...parsed, recurring: !parsed.recurring})}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '2px 0',
                  }}
                >
                  <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>Recurring</span>
                  <span style={{
                    width: 42, height: 24, borderRadius: 12,
                    background: parsed.recurring ? 'var(--text)' : 'var(--bg2)',
                    display: 'flex', alignItems: 'center', padding: '0 3px',
                    transition: 'background 0.2s', flexShrink: 0,
                  }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transform: parsed.recurring ? 'translateX(18px)' : 'translateX(0)',
                      transition: 'transform 0.2s', display: 'block',
                    }} />
                  </span>
                </button>

                {parsed.recurring && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Field label="Frequency">
                      <select
                        value={parsed.recurring_frequency}
                        onChange={e => setParsed({...parsed, recurring_frequency: e.target.value})}
                      >
                        {FREQ_OPTIONS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </Field>

                    {(parsed.recurring_frequency === 'monthly' || parsed.recurring_frequency === 'quarterly') && (
                      <Field label={parsed.recurring_frequency === 'quarterly' ? 'Day of month (each quarter)' : 'Day of month'}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {[1,5,10,15,20,25,28].map(d => (
                            <button
                              key={d}
                              onClick={() => setParsed({...parsed, recurring_day: d})}
                              style={{
                                padding: '6px 12px', borderRadius: 20, fontSize: 13,
                                background: parsed.recurring_day === d ? 'var(--text)' : 'var(--bg2)',
                                color: parsed.recurring_day === d ? 'var(--bg)' : 'var(--text2)',
                                fontWeight: parsed.recurring_day === d ? 500 : 400,
                                transition: 'all 0.15s',
                              }}
                            >
                              {ordinal(d)}
                            </button>
                          ))}
                          <input
                            type="number" min="1" max="31"
                            value={parsed.recurring_day}
                            onChange={e => {
                              const v = Math.min(31, Math.max(1, parseInt(e.target.value) || 1))
                              setParsed({...parsed, recurring_day: v})
                            }}
                            style={{ width: 72, padding: '6px 10px', fontSize: 13 }}
                            placeholder="Day"
                          />
                        </div>
                      </Field>
                    )}

                    {parsed.recurring_frequency === 'weekly' && (
                      <Field label="Day of week">
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
                            <button
                              key={d}
                              onClick={() => setParsed({...parsed, recurring_day: i + 1})}
                              style={{
                                padding: '6px 10px', borderRadius: 20, fontSize: 13,
                                background: parsed.recurring_day === i + 1 ? 'var(--text)' : 'var(--bg2)',
                                color: parsed.recurring_day === i + 1 ? 'var(--bg)' : 'var(--text2)',
                                fontWeight: parsed.recurring_day === i + 1 ? 500 : 400,
                                transition: 'all 0.15s',
                              }}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </Field>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1, height: 44, borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg2)', color: 'var(--text2)', fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!parsed.amount || !parsed.description}
                style={{
                  flex: 2, height: 44, borderRadius: 'var(--radius-sm)',
                  background: isIncome ? 'var(--accent)' : 'var(--text)',
                  color: 'var(--bg)', fontWeight: 500
                }}
              >
                Save {isIncome ? 'income' : 'expense'}
              </button>
            </div>
          </>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{label}</p>
      {children}
    </div>
  )
}
