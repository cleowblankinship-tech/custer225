import { useState, useRef } from 'react'
import { CATEGORIES } from '../lib/parser'

const TAX_LABELS = { depreciate: 'Depreciable', expense: 'Direct expense' }

export default function CSVImport({ onImport, onClose }) {
  const [rows, setRows] = useState([])
  const [step, setStep] = useState('upload') // upload | review
  const [dragging, setDragging] = useState(false)
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
    const reader = new FileReader()
    reader.onload = (ev) => {
      const lines = ev.target.result.split('\n').filter(Boolean)
      const header = lines[0].toLowerCase()
      const isChase = header.includes('description') && header.includes('amount')

      const parsed = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim())
        if (isChase) {
          // Chase format: Transaction Date, Post Date, Description, Category, Type, Amount, Memo
          const amount = Math.abs(parseFloat(cols[5]))
          if (isNaN(amount) || amount <= 0) return null
          return {
            date: cols[0] ? formatDate(cols[0]) : new Date().toISOString().split('T')[0],
            description: cols[2] || '',
            amount,
            category: 'Other',
            entry_type: 'expense',
            tax_type: 'expense',
            _review: true
          }
        }
        return null
      }).filter(Boolean)

      setRows(parsed)
      setStep('review')
    }
    reader.readAsText(file)
  }

  function formatDate(str) {
    // MM/DD/YYYY -> YYYY-MM-DD
    const parts = str.split('/')
    if (parts.length === 3) return `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}`
    return str
  }

  function updateRow(i, field, value) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  function removeRow(i) {
    setRows(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleImport() {
    onImport(rows.filter(r => r._include !== false))
    onClose()
  }

  return (
    <div style={{ padding: '0 20px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontWeight: 500 }}>{step === 'upload' ? 'Import statement' : `Review ${rows.length} transactions`}</p>
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
            padding: '40px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? 'var(--accent-light)' : 'transparent',
            transition: 'all 0.15s',
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
            {dragging ? 'Drop it!' : 'Drop your Chase CSV here'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text2)' }}>or tap to browse</p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
        </div>
      )}

      {step === 'review' && (
        <>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            Mark each transaction — toggle off ones you want to skip, set the category and type for business items.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map((row, i) => (
              <div key={i} style={{
                background: row._include === false ? 'var(--bg2)' : 'var(--bg)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                opacity: row._include === false ? 0.5 : 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 500 }}>{row.description}</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{row.date}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <p style={{ fontSize: 15, fontWeight: 500 }}>${row.amount.toFixed(2)}</p>
                    <button
                      onClick={() => updateRow(i, '_include', row._include === false ? true : false)}
                      style={{
                        fontSize: 18, color: row._include === false ? 'var(--text3)' : 'var(--text)',
                        lineHeight: 1
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
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
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
          <button
            onClick={handleImport}
            style={{
              width: '100%', height: 48, marginTop: 20,
              background: 'var(--text)', color: 'var(--bg)',
              borderRadius: 'var(--radius-sm)', fontWeight: 500, fontSize: 15
            }}
          >
            Import {rows.filter(r => r._include !== false).length} transactions
          </button>
        </>
      )}
    </div>
  )
}
