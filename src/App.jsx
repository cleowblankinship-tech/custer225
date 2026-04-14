import { useState, useEffect } from 'react'
import PLSummary from './components/PLSummary'
import PLReport from './components/PLReport'
import QuickAdd from './components/QuickAdd'
import ExpenseList from './components/ExpenseList'
import CSVImport from './components/CSVImport'
import SpinUp from './components/SpinUp'
import SetupCard from './components/SetupCard'
import { getExpenses, addExpense, deleteExpense } from './lib/supabase'

const SEED_EXPENSES = [
  { id: 's1', date: '2026-04-07', description: 'American Furniture Warehouse — couch', category: 'Furniture', entry_type: 'expense', tax_type: 'depreciate', amount: 2162.04 },
  { id: 's2', date: '2026-04-11', description: 'Wayfair — bedframe', category: 'Furniture', entry_type: 'expense', tax_type: 'depreciate', amount: 85.75 },
  { id: 's3', date: '2026-04-08', description: 'Costco — mattress', category: 'Furniture', entry_type: 'expense', tax_type: 'depreciate', amount: 173.39 },
  { id: 's4', date: '2026-04-06', description: 'Amazon — home setup (x3)', category: 'Linens & supplies', entry_type: 'expense', tax_type: 'expense', amount: 428.15 },
  { id: 's5', date: '2026-04-10', description: 'Amazon — home setup', category: 'Linens & supplies', entry_type: 'expense', tax_type: 'expense', amount: 72.17 },
  { id: 's6', date: '2026-04-04', description: 'Ace Hardware', category: 'Maintenance & repairs', entry_type: 'expense', tax_type: 'expense', amount: 304.03 },
  { id: 's7', date: '2026-04-11', description: 'Target', category: 'Linens & supplies', entry_type: 'expense', tax_type: 'expense', amount: 198.28 },
  { id: 's8', date: '2026-04-09', description: 'Apex Waste Solutions', category: 'Utilities', entry_type: 'expense', tax_type: 'expense', amount: 103.73 },
  { id: 's9', date: '2026-04-06', description: 'Apex Waste Solutions', category: 'Utilities', entry_type: 'expense', tax_type: 'expense', amount: 124.01 },
]

export default function App() {
  const [expenses, setExpenses] = useState(SEED_EXPENSES)
  const [view, setView] = useState('home') // home | list | spinup | import | pl
  const [listFilter, setListFilter] = useState('all')
  const [listMonth, setListMonth] = useState(null)
  const [loading, setLoading] = useState(false)
  const [useDB, setUseDB] = useState(false)

  function navigateToList(filter, month = null) {
    setListFilter(filter)
    setListMonth(month)
    setView('list')
  }

  // Try to load from Supabase if env vars are present
  useEffect(() => {
    const hasSupabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    if (!hasSupabase) return
    setUseDB(true)
    setLoading(true)
    getExpenses()
      .then(data => { if (data.length > 0) setExpenses(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleAdd(parsed) {
    const entry = {
      date: parsed.date,
      description: parsed.description,
      amount: parsed.amount,
      category: parsed.category,
      entry_type: parsed.entry_type || 'expense',
      tax_type: parsed.entry_type === 'income' ? null : parsed.tax_type,
      recurring: parsed.recurring || false,
      recurring_frequency: parsed.recurring_frequency || null,
      recurring_day: parsed.recurring_day || null,
    }
    if (useDB) {
      try {
        const saved = await addExpense(entry)
        setExpenses(prev => [saved, ...prev])
      } catch (err) {
        console.error('Supabase save failed:', err.message)
        alert(`Could not save to database: ${err.message}`)
        return
      }
    } else {
      setExpenses(prev => [{ ...entry, id: 'local-' + Date.now() }, ...prev])
    }
    setView('home')
  }

  async function handleDelete(id) {
    if (useDB) await deleteExpense(id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  async function handleImport(rows) {
    for (const row of rows) {
      await handleAdd(row)
    }
  }

  const navItems = [
    { key: 'home',   label: 'Home',    icon: '⌂' },
    { key: 'list',   label: 'Ledger',  icon: '≡' },
    { key: 'spinup', label: 'Setup',   icon: '✓' },
    { key: 'import', label: 'Import',  icon: '↑' },
  ]

  const viewTitle = { home: 'Overview', list: 'Ledger', spinup: 'Spin-Up', import: 'Import', pl: 'P&L Report' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>

      {/* Header */}
      <div style={{
        padding: '52px 20px 20px',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--text2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
            225 Custer
          </p>
          <p style={{ fontSize: 22, fontWeight: 500 }}>{viewTitle[view]}</p>
        </div>
        {view === 'pl' && (
          <button onClick={() => setView('home')} style={{ fontSize: 13, color: 'var(--text2)', paddingBottom: 4 }}>
            ← Back
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingTop: 20 }}>
        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 14, padding: 40 }}>Loading...</p>
        )}

        {!loading && view === 'home' && (
          <>
            <PLSummary expenses={expenses} onNavigate={navigateToList} />

            {/* P&L link */}
            <div style={{ padding: '0 20px 8px' }}>
              <button
                onClick={() => setView('pl')}
                style={{
                  width: '100%', padding: '13px 16px',
                  borderRadius: 'var(--radius-sm)', background: 'var(--bg2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: 14, fontWeight: 500, color: 'var(--text)',
                }}
              >
                <span>View full P&amp;L report</span>
                <span style={{ color: 'var(--text3)' }}>→</span>
              </button>
            </div>

            {/* Setup progress card */}
            <div style={{ padding: '0 20px 20px' }}>
              <SetupCard onNavigate={() => setView('spinup')} />
            </div>

            <div style={{ padding: '0 20px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>
                Quick add
              </p>
            </div>
            <QuickAdd onAdd={handleAdd} />
          </>
        )}

        {!loading && view === 'list' && (
          <ExpenseList
            expenses={expenses}
            onDelete={handleDelete}
            initialFilter={listFilter}
            initialMonth={listMonth}
            key={`${listFilter}-${listMonth}`}
          />
        )}

        {!loading && view === 'spinup' && <SpinUp />}

        {!loading && view === 'import' && (
          <CSVImport onImport={handleImport} onClose={() => setView('home')} />
        )}

        {!loading && view === 'pl' && (
          <PLReport expenses={expenses} />
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        display: 'flex', borderTop: '0.5px solid var(--border)',
        background: 'var(--bg)', paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => {
              if (item.key === 'list') { setListFilter('all'); setListMonth(null) }
              setView(item.key)
            }}
            style={{
              flex: 1, padding: '12px 0', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3,
              color: view === item.key ? 'var(--text)' : 'var(--text3)',
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: view === item.key ? 500 : 400 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
