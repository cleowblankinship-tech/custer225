import { useState } from 'react'
import {
  getLoans, addPaymentToLoan, deletePaymentFromLoan,
  currentBalance, totalPaid, interestAccrued,
  payoffProjection, minimumMeaningfulPayment,
  formatMonths, payoffDate, fmt,
} from '../lib/loans'

export default function DebtDashboard() {
  const [loans, setLoans] = useState(() => getLoans())

  function handleAddPayment(loanId, payment) {
    setLoans(prev => addPaymentToLoan(prev, loanId, payment))
  }

  function handleDeletePayment(loanId, paymentId) {
    setLoans(prev => deletePaymentFromLoan(prev, loanId, paymentId))
  }

  const totalOwed     = loans.reduce((s, l) => s + currentBalance(l), 0)
  const totalInterest = loans.reduce((s, l) => s + interestAccrued(l), 0)

  return (
    <div style={{ padding: '0 20px 32px' }}>

      {/* Combined summary */}
      <div style={{
        background: 'var(--bg2)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
        marginBottom: 24,
      }}>
        <p style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          Total outstanding
        </p>
        <p style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>
          {fmt(totalOwed)}
        </p>
        {totalInterest > 0 && (
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>
            {fmt(totalInterest)} interest accrued so far
          </p>
        )}
      </div>

      {/* Per-loan cards */}
      {loans.map(loan => (
        <LoanCard
          key={loan.id}
          loan={loan}
          onAddPayment={p => handleAddPayment(loan.id, p)}
          onDeletePayment={pid => handleDeletePayment(loan.id, pid)}
        />
      ))}
    </div>
  )
}

// ── LoanCard ──────────────────────────────────────────────────────────────────

function LoanCard({ loan, onAddPayment, onDeletePayment }) {
  const [monthlyInput, setMonthlyInput] = useState('')
  const [showPayments, setShowPayments] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [logAmount, setLogAmount] = useState('')
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0])
  const [logNote, setLogNote] = useState('')

  const balance    = currentBalance(loan)
  const paid       = totalPaid(loan)
  const interest   = interestAccrued(loan)
  const pctPaid    = Math.min(100, (paid / (loan.principal + interest)) * 100)
  const monthly    = parseFloat(monthlyInput.replace(/[^0-9.]/g, '')) || 0
  const projection = monthly > 0 ? payoffProjection(balance, loan.rate, monthly) : null
  const minPmt     = minimumMeaningfulPayment(balance, loan.rate)
  const isPaidOff  = balance <= 0.01

  function handleLogPayment() {
    if (!logAmount || parseFloat(logAmount) <= 0) return
    onAddPayment({
      id: 'pmt-' + Date.now(),
      date: logDate,
      amount: parseFloat(logAmount),
      note: logNote.trim() || null,
    })
    setLogAmount('')
    setLogNote('')
    setLogDate(new Date().toISOString().split('T')[0])
    setLogOpen(false)
  }

  return (
    <div style={{
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      marginBottom: 20,
    }}>

      {/* Loan header */}
      <div style={{ padding: '16px 18px 14px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>{loan.label}</p>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>{loan.lender} · {loan.note}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {isPaidOff ? '—' : fmt(balance)}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>
              {isPaidOff ? 'Paid off' : 'remaining'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 14 }}>
          <div style={{
            height: 5, borderRadius: 3,
            background: 'var(--border-mid)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${pctPaid}%`,
              background: isPaidOff ? 'var(--green)' : 'var(--accent)',
              borderRadius: 3,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>
              {fmt(paid)} paid · {pctPaid.toFixed(1)}%
            </p>
            <p style={{ fontSize: 11, color: 'var(--text3)' }}>
              of {fmt(loan.principal + interest)}
            </p>
          </div>
        </div>

        {/* Interest line */}
        {interest > 0 && (
          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8 }}>
            {fmt(interest)} interest accrued since {loan.startDate}
          </p>
        )}

        {/* Whole life note */}
        {loan.noteDetail && (
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, lineHeight: 1.5 }}>
            {loan.noteDetail}
          </p>
        )}
      </div>

      {/* Payoff calculator */}
      {!isPaidOff && (
        <div style={{ padding: '14px 18px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg2)' }}>
          <p style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
            Payoff calculator
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>Pay</span>
            <div style={{ position: 'relative', flex: 1, maxWidth: 140 }}>
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 14, color: 'var(--text2)',
              }}>$</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={monthlyInput}
                onChange={e => setMonthlyInput(e.target.value)}
                style={{ paddingLeft: 22, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 14, width: '100%' }}
              />
            </div>
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>/ month</span>
          </div>

          {monthly > 0 && !projection && loan.rate > 0 && (
            <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--red-bg)' }}>
              <p style={{ fontSize: 13, color: 'var(--red)', lineHeight: 1.5 }}>
                At {(loan.rate * 100).toFixed(0)}% interest, you need more than {fmt(minPmt)}/mo just to cover interest.
                This payment doesn't reduce the balance.
              </p>
            </div>
          )}

          {projection && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg)',
                border: '0.5px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <p style={{ fontSize: 13, color: 'var(--text2)' }}>Paid off in</p>
                  <p style={{ fontSize: 16, fontWeight: 600 }}>{formatMonths(projection.months)}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <p style={{ fontSize: 13, color: 'var(--text2)' }}>Target date</p>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{payoffDate(projection.months)}</p>
                </div>
                {projection.totalInterest > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <p style={{ fontSize: 13, color: 'var(--text2)' }}>Total interest</p>
                    <p style={{ fontSize: 14, color: 'var(--text2)' }}>{fmt(projection.totalInterest)}</p>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <p style={{ fontSize: 13, color: 'var(--text2)' }}>Total paid</p>
                  <p style={{ fontSize: 14, color: 'var(--text2)' }}>{fmt(projection.totalPaid)}</p>
                </div>
              </div>

              {/* Quick comparison scenarios */}
              {loan.rate > 0 && monthly > 0 && (
                <ScenarioRow balance={balance} rate={loan.rate} basePayment={monthly} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Payment log */}
      <div style={{ padding: '12px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: logOpen ? 12 : 0 }}>
          <button
            onClick={() => setShowPayments(p => !p)}
            style={{ fontSize: 13, color: 'var(--text2)' }}
          >
            {loan.payments.length === 0
              ? 'No payments yet'
              : `${loan.payments.length} payment${loan.payments.length > 1 ? 's' : ''} — ${showPayments ? 'hide' : 'show'}`
            }
          </button>
          <button
            onClick={() => setLogOpen(p => !p)}
            style={{
              fontSize: 12, fontWeight: 500, padding: '5px 12px',
              borderRadius: 20, background: 'var(--accent-light)', color: 'var(--accent)',
            }}
          >
            {logOpen ? 'Cancel' : '+ Log payment'}
          </button>
        </div>

        {/* Payment entry form */}
        {logOpen && (
          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 14, color: 'var(--text2)',
                }}>$</span>
                <input
                  type="number"
                  placeholder="Amount"
                  value={logAmount}
                  onChange={e => setLogAmount(e.target.value)}
                  style={{ paddingLeft: 22, paddingTop: 8, paddingBottom: 8, fontSize: 14 }}
                  autoFocus
                />
              </div>
              <input
                type="date"
                value={logDate}
                onChange={e => setLogDate(e.target.value)}
                style={{ flex: 1, paddingTop: 8, paddingBottom: 8, fontSize: 14 }}
              />
            </div>
            <input
              type="text"
              placeholder="Note (optional)"
              value={logNote}
              onChange={e => setLogNote(e.target.value)}
              style={{ paddingTop: 8, paddingBottom: 8, fontSize: 14 }}
            />
            <button
              onClick={handleLogPayment}
              disabled={!logAmount || parseFloat(logAmount) <= 0}
              style={{
                padding: '10px', borderRadius: 'var(--radius-sm)',
                background: 'var(--accent)', color: '#fff',
                fontSize: 14, fontWeight: 500,
                opacity: (!logAmount || parseFloat(logAmount) <= 0) ? 0.4 : 1,
              }}
            >
              Save payment
            </button>
          </div>
        )}

        {/* Payments list */}
        {showPayments && loan.payments.length > 0 && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[...loan.payments].reverse().map(p => (
              <div key={p.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0',
                borderBottom: '0.5px solid var(--border)',
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500 }}>{fmt(p.amount)}</p>
                  {p.note && <p style={{ fontSize: 11, color: 'var(--text3)' }}>{p.note}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {new Date(p.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <button
                    onClick={() => onDeletePayment(p.id)}
                    style={{ fontSize: 12, color: 'var(--text3)', padding: '2px 4px' }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ScenarioRow — quick +/- comparison ───────────────────────────────────────

function ScenarioRow({ balance, rate, basePayment }) {
  const scenarios = [
    { label: `${fmt(basePayment)}/mo`, payment: basePayment },
    { label: `${fmt(basePayment * 1.5)}/mo`, payment: basePayment * 1.5 },
    { label: `${fmt(basePayment * 2)}/mo`, payment: basePayment * 2 },
  ]

  return (
    <div style={{
      background: 'var(--bg)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      overflow: 'hidden',
    }}>
      <p style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 12px 6px' }}>
        Compare scenarios
      </p>
      {scenarios.map(({ label, payment }) => {
        const proj = payoffProjection(balance, rate, payment)
        if (!proj) return null
        return (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px 12px',
            borderTop: '0.5px solid var(--border)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</p>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, fontWeight: 500 }}>{formatMonths(proj.months)}</p>
              <p style={{ fontSize: 10, color: 'var(--text3)' }}>{fmt(proj.totalInterest)} interest</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
