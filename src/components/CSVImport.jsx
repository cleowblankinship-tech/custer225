import { useState, useRef } from 'react'
import { CATEGORIES, INCOME_CATEGORIES } from '../lib/parser'

// Auto-skip these — obviously personal
const PERSONAL_PATTERNS = [
  'starbucks','dunkin','dutch bros','coffee','cafe','espresso',
  'mcdonald','burger king','wendy','chick-fil','taco bell','chipotle',
  'subway','domino','pizza','doordash','ubereats','grubhub','instacart',
  'netflix','spotify','hulu','disney','apple.com/bill','amazon prime',
  'movie','cinema','amc theater','fandango',
  'bar ','brewery','tavern','liquor',
  'gym','planet fitness','anytime fitness',
  'salon','barber','spa',
  'airline','delta','united','southwest','american air',
  'hotel','marriott','hilton','airbnb.com',  // airbnb.com = their own stays, not payouts
  'gas station','chevron','shell','exxon','bp ','mobil','sinclair',
  'kroger','safeway','whole foods','trader joe','albertsons','sprouts',
  'walgreens','cvs','rite aid',
]

// Smarter guesses for things that are clearly business
const BUSINESS_HINTS = [
  { pattern: ['airbnb','vrbo','homeaway','vacasa','payout','booking.com'],  entry_type: 'income',   category: 'Booking revenue',        tax_type: null },
  { pattern: ['cleaning fee','clean fee'],                                   entry_type: 'income',   category: 'Cleaning fee',           tax_type: null },
  { pattern: ['xcel','rocky mountain power','pg&e','utilities','electric','water','trash','waste','garbage','recycl','sewage'], entry_type: 'expense', category: 'Utilities', tax_type: 'expense' },
  { pattern: ['internet','comcast','xfinity','centurylink','lumen','wifi'],  entry_type: 'expense',  category: 'Utilities',              tax_type: 'expense' },
  { pattern: ['insurance','state farm','allstate','geico','farmers'],        entry_type: 'expense',  category: 'Insurance',              tax_type: 'expense' },
  { pattern: ['home depot','lowes','ace hardware','menards','true value'],   entry_type: 'expense',  category: 'Maintenance & repairs',  tax_type: 'expense' },
  { pattern: ['wayfair','furniture','mattress','ikea','ashley','rooms to go'], entry_type: 'expense', category: 'Furniture',             tax_type: 'depreciate' },
  { pattern: ['amazon'],                                                      entry_type: 'expense',  category: 'Linens & supplies',      tax_type: 'expense' },
  { pattern: ['target','walmart','costco','bed bath'],                        entry_type: 'expense',  category: 'Linens & supplies',      tax_type: 'expense' },
  { pattern: ['management','hpm','vacasa fee','property mgmt'],               entry_type: 'expense',  category: 'Management fees',        tax_type: 'expense' },
  { pattern: ['mortgage','loan pmt','loancare','pennymac','rocket mortgage'], entry_type: 'expense',  category: 'Mortgage interest',      tax_type: 'expense' },
  { pattern: ['hoa','homeowners assoc'],                                      entry_type: 'expense',  category: 'HOA',                    tax_type: 'expense' },
]

function classifyRow(description) {
  const lower = description.toLowerCase()

  // Check personal first
  if (PERSONAL_PATTERNS.some(p => lower.includes(p))) {
    return { _include: false, _autoSkipped: true, entry_type: 'expense', category: 'Other', tax_type: 'expense' }
  }

  // Check business hints
  for (const hint of BUSINESS_HINTS) {
    if (hint.pattern.some(p => lower.includes(p))) {
      return { _include: true, _autoSkipped: false, entry_type: hint.entry_type, category: hint.category, tax_type: hint.tax_type }
    }
  }

  // Unknown — include but flag for review
  return { _include: true, _autoSkipped: false, entry_type: 'expense', category: 'Other', tax_type: 'expense' }
}

// Parse a CSV line respecting quoted fields
function parseCSVLine(line) {
  const cols = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuote = !inQuote }
    else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  cols.push(cur.trim())
  return cols
}

function formatDate(str) {
  if (!str) return new Date().toISOString().split('T')[0]
  // MM/DD/YYYY → YYYY-MM-DD
  const slash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slash) return `${slash[3]}-${slash[1].padStart(2,'0')}-${slash[2].padStart(2,'0')}`
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  return str
}

function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''))

  // Find column indices by matching header names
  const find = (...names) => {
    for (const n of names) {
      const i = headers.findIndex(h => h.includes(n))
      if (i !== -1) return i
    }
    return -1
  }

  const dateCol   = find('transactiondate', 'date', 'postdate', 'postingdate')
  const descCol   = find('description', 'memo', 'name', 'payee')
  const amtCol    = find('amount', 'debit', 'credit')

  if (descCol === -1 || amtCol === -1) return []

  return lines.slice(1).map(line => {
    const cols = parseCSVLine(line)
    const rawAmount = cols[amtCol]?.replace(/[$,\s]/g, '')
    const amount = Math.abs(parseFloat(rawAmount))
    if (isNaN(amount) || amount <= 0) return null

    const description = cols[descCol] || ''
    const classification = classifyRow(description)
    return {
      date: formatDate(dateCol !== -1 ? cols[dateCol] : ''),
      description,
      amount,
      _review: true,
      ...classification,
    }
  }).filter(Boolean)
}

export default function CSVImport({ onImport, onClose }) {
  const [rows, setRows] = useState([])
  const [step, setStep] = useState('upload') // upload | review | error
  const [dragging, setDragging] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showSkipped, setShowSkipped] = useState(false)
  const fileRef = useRef()

  function handleFile(e) {
    processFile(e.target.files[0])
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }

  function processFile(file) {
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      setErrorMsg('Please upload a .csv file.')
      setStep('error')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result)
      if (parsed.length === 0) {
        setErrorMsg("Couldn't read any transactions. Make sure this is a Chase CSV export (or similar bank statement).")
        setStep('error')
        return
      }
      setRows(parsed)
      setStep('review')
    }
    reader.readAsText(file)
  }

  function updateRow(i, field, value) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  function handleImport() {
    onImport(rows.filter(r => r._include !== false))
    onClose()
  }

  const includedCount = rows.filter(r => r._include !== false).length
  const autoSkippedCount = rows.filter(r => r._autoSkipped).length
  const visibleRows = showSkipped ? rows : rows.filter(r => !r._autoSkipped)

  return (
    <div style={{ padding: '0 20px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontWeight: 500 }}>
          {step === 'upload' ? 'Import statement' : step === 'review' ? `Review ${rows.length} transactions` : 'Import failed'}
        </p>
        <button onClick={onClose} style={{ color: 'var(--text2)', fontSize: 22, lineHeight: 1 }}>×</button>
      </div>

      {step === 'upload' && (
        <div
          onClick={() => fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragEnter={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `1.5px dashed ${dragging ? 'var(--accent)' : 'var(--border-mid)'}`,
            borderRadius: 'var(--radius)',
            padding: '48px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'var(--accent-light)' : 'transparent',
            transition: 'all 0.15s',
          }}
        >
          <p style={{ fontSize: 28, marginBottom: 10 }}>{dragging ? '📂' : '📄'}</p>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
            {dragging ? 'Drop to import' : 'Drop a bank CSV here'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>or tap to browse</p>
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 12 }}>
            Works with Chase, Bank of America, and most bank exports
          </p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
        </div>
      )}

      {step === 'error' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: 28, marginBottom: 12 }}>⚠️</p>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Couldn't parse that file</p>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>{errorMsg}</p>
          <button
            onClick={() => setStep('upload')}
            style={{
              padding: '10px 24px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg2)', color: 'var(--text)', fontWeight: 500
            }}
          >
            Try another file
          </button>
        </div>
      )}

      {step === 'review' && (
        <>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
            Set category and type, toggle off anything to skip.
          </p>

          {autoSkippedCount > 0 && (
            <button
              onClick={() => setShowSkipped(s => !s)}
              style={{
                width: '100%', marginBottom: 14,
                padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 13, color: 'var(--text2)',
              }}
            >
              <span>
                {autoSkippedCount} likely personal transaction{autoSkippedCount !== 1 ? 's' : ''} auto-hidden
              </span>
              <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                {showSkipped ? 'Hide' : 'Review'} ↕
              </span>
            </button>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleRows.map((row) => {
              const i = rows.indexOf(row)
              const isSplit = !!row._splitActive
              const splitPct = row._splitPercent ?? 50
              const originalAmt = row._originalAmount ?? row.amount
              const importAmt = isSplit ? (originalAmt * splitPct / 100) : row.amount

              function activateSplit() {
                setRows(prev => prev.map((r, idx) => idx !== i ? r : {
                  ...r,
                  _splitActive: true,
                  _splitPercent: 50,
                  _originalAmount: r.amount,
                  amount: parseFloat((r.amount * 0.5).toFixed(2)),
                }))
              }

              function deactivateSplit() {
                setRows(prev => prev.map((r, idx) => idx !== i ? r : {
                  ...r,
                  _splitActive: false,
                  amount: r._originalAmount ?? r.amount,
                }))
              }

              function setSplitPct(pct) {
                setRows(prev => prev.map((r, idx) => idx !== i ? r : {
                  ...r,
                  _splitPercent: pct,
                  amount: parseFloat((originalAmt * pct / 100).toFixed(2)),
                }))
              }

              return <div key={i} style={{
                background: row._include === false ? 'var(--bg2)' : 'var(--bg)',
                border: `0.5px solid ${isSplit ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                opacity: row._include === false ? 0.45 : 1,
                transition: 'opacity 0.15s',
              }}>
                {/* Top row: description + toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.description}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{row.date}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {/* Editable amount */}
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text2)', pointerEvents: 'none' }}>$</span>
                      <input
                        type="number"
                        value={row.amount}
                        onChange={e => {
                          const v = parseFloat(e.target.value) || 0
                          setRows(prev => prev.map((r, idx) => idx !== i ? r : {
                            ...r,
                            amount: v,
                            _originalAmount: isSplit ? r._originalAmount : v,
                          }))
                        }}
                        style={{
                          width: 80, padding: '5px 8px 5px 18px',
                          fontSize: 13, fontWeight: 500,
                          borderRadius: 6, border: '1px solid var(--border-mid)',
                        }}
                      />
                    </div>
                    <button
                      onClick={() => updateRow(i, '_include', row._include === false ? true : false)}
                      style={{ fontSize: 20, color: row._include === false ? 'var(--text3)' : 'var(--text)', lineHeight: 1 }}
                    >
                      {row._include === false ? '○' : '●'}
                    </button>
                  </div>
                </div>

                {row._include !== false && (
                  <>
                    {/* Category + type selects */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <select
                        value={row.category}
                        onChange={e => updateRow(i, 'category', e.target.value)}
                        style={{ fontSize: 12, padding: '6px 10px' }}
                      >
                        <optgroup label="Expenses">
                          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </optgroup>
                        <optgroup label="Income">
                          {INCOME_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </optgroup>
                      </select>
                      <select
                        value={row.entry_type === 'income' ? 'income' : row.tax_type}
                        onChange={e => {
                          if (e.target.value === 'income') {
                            updateRow(i, 'entry_type', 'income')
                            updateRow(i, 'tax_type', null)
                          } else {
                            updateRow(i, 'entry_type', 'expense')
                            updateRow(i, 'tax_type', e.target.value)
                          }
                        }}
                        style={{ fontSize: 12, padding: '6px 10px' }}
                      >
                        <option value="expense">Direct expense</option>
                        <option value="depreciate">Depreciable</option>
                        <option value="income">Income</option>
                      </select>
                    </div>

                    {/* Split section */}
                    {!isSplit ? (
                      <button
                        onClick={activateSplit}
                        style={{
                          fontSize: 12, color: 'var(--text3)',
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '3px 0',
                        }}
                      >
                        ✂ Split with apartment / personal
                      </button>
                    ) : (
                      <div style={{
                        borderTop: '0.5px solid var(--border)',
                        paddingTop: 10,
                        marginTop: 2,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                            Split
                          </p>
                          <button onClick={deactivateSplit} style={{ fontSize: 11, color: 'var(--text3)' }}>
                            Remove split ×
                          </button>
                        </div>

                        {/* Quick % presets */}
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                          {[25, 50, 75].map(pct => (
                            <button
                              key={pct}
                              onClick={() => setSplitPct(pct)}
                              style={{
                                padding: '5px 12px', borderRadius: 20, fontSize: 12,
                                background: splitPct === pct ? 'var(--accent)' : 'var(--bg2)',
                                color: splitPct === pct ? 'white' : 'var(--text2)',
                                fontWeight: splitPct === pct ? 500 : 400,
                              }}
                            >
                              {pct}% mine
                            </button>
                          ))}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <input
                              type="number" min="1" max="100"
                              value={splitPct}
                              onChange={e => setSplitPct(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                              style={{ width: 52, padding: '5px 8px', fontSize: 12, borderRadius: 6 }}
                            />
                            <span style={{ fontSize: 12, color: 'var(--text3)' }}>%</span>
                          </div>
                        </div>

                        {/* Split summary */}
                        <div style={{
                          background: 'var(--accent-light)',
                          borderRadius: 6, padding: '8px 12px',
                          display: 'flex', justifyContent: 'space-between',
                          fontSize: 12,
                        }}>
                          <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
                            Importing: ${importAmt.toFixed(2)} ({splitPct}%)
                          </span>
                          <span style={{ color: 'var(--text3)' }}>
                            Skipping: ${(originalAmt - importAmt).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            })}
          </div>

          <div style={{ position: 'sticky', bottom: 0, paddingTop: 12, background: 'var(--bg)' }}>
            <button
              onClick={handleImport}
              disabled={includedCount === 0}
              style={{
                width: '100%', height: 48,
                background: includedCount > 0 ? 'var(--text)' : 'var(--bg2)',
                color: includedCount > 0 ? 'var(--bg)' : 'var(--text3)',
                borderRadius: 'var(--radius-sm)', fontWeight: 500, fontSize: 15,
              }}
            >
              Import {includedCount} transaction{includedCount !== 1 ? 's' : ''}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
