import { useState, useRef } from 'react'
import { CATEGORIES, INCOME_CATEGORIES } from '../lib/parser'

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

    return {
      date: formatDate(dateCol !== -1 ? cols[dateCol] : ''),
      description: cols[descCol] || '',
      amount,
      category: 'Other',
      entry_type: 'expense',
      tax_type: 'expense',
      _review: true,
    }
  }).filter(Boolean)
}

export default function CSVImport({ onImport, onClose }) {
  const [rows, setRows] = useState([])
  const [step, setStep] = useState('upload') // upload | review | error
  const [dragging, setDragging] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
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
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            Toggle off transactions to skip. Set category and type for each one before importing.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map((row, i) => (
              <div key={i} style={{
                background: row._include === false ? 'var(--bg2)' : 'var(--bg)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                opacity: row._include === false ? 0.45 : 1,
                transition: 'opacity 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.description}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{row.date}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 500 }}>${row.amount.toFixed(2)}</p>
                    <button
                      onClick={() => updateRow(i, '_include', row._include === false ? true : false)}
                      style={{
                        fontSize: 20,
                        color: row._include === false ? 'var(--text3)' : 'var(--text)',
                        lineHeight: 1,
                      }}
                    >
                      {row._include === false ? '○' : '●'}
                    </button>
                  </div>
                </div>
                {row._include !== false && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
                )}
              </div>
            ))}
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
