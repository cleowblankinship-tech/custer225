import { useState, useEffect } from 'react'
import PLSummary from './components/PLSummary'
import PLReport from './components/PLReport'
import QuickAdd from './components/QuickAdd'
import ExpenseList from './components/ExpenseList'
import CSVImport from './components/CSVImport'
import SpinUp from './components/SpinUp'
import SetupCard from './components/SetupCard'
import { getExpenses, addExpense, deleteExpense, getTasks, addTask, deleteTask, toggleTask } from './lib/supabase'
import IntroSplash from './components/IntroSplash'

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

const TASKS_LS_KEY = 'custer225_tasks'

export default function App() {
  const [expenses, setExpenses] = useState(SEED_EXPENSES)
  const [tasks, setTasks] = useState([])
  const [showIntro, setShowIntro] = useState(true) // true on every cold load
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

  // Load expenses from Supabase if env vars are present
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

  // Load tasks: localStorage first (instant), then Supabase sync
  useEffect(() => {
    try {
      const local = localStorage.getItem(TASKS_LS_KEY)
      if (local) setTasks(JSON.parse(local))
    } catch {}
    const hasSupabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    if (hasSupabase) {
      getTasks()
        .then(data => { if (data.length > 0) setTasks(data) })
        .catch(console.error)
    }
  }, [])

  // Persist tasks to localStorage whenever they change
  useEffect(() => {
    try { localStorage.setItem(TASKS_LS_KEY, JSON.stringify(tasks)) } catch {}
  }, [tasks])

  // ── Expense / income handlers ─────────────────────────────────────────────

  async function handleAddExpense(parsed) {
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
      await handleAddExpense(row)
    }
  }

  // ── Task / reminder handlers ──────────────────────────────────────────────

  async function handleAddTask(parsed) {
    const entry = {
      title: parsed.title,
      entry_type: parsed.entry_type, // 'task' | 'reminder'
      due_date: parsed.due_date || null,
      completed: false,
    }
    if (useDB) {
      try {
        const saved = await addTask(entry)
        setTasks(prev => [saved, ...prev])
      } catch (err) {
        console.error('Task save failed:', err.message)
        // Fall back to local even if DB fails
        setTasks(prev => [{ ...entry, id: 'local-task-' + Date.now() }, ...prev])
      }
    } else {
      setTasks(prev => [{ ...entry, id: 'local-task-' + Date.now() }, ...prev])
    }
    setView('home')
  }

  async function handleDeleteTask(id) {
    if (useDB) await deleteTask(id).catch(console.error)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function handleToggleTask(id) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const newCompleted = !task.completed
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t))
    if (useDB) {
      try {
        const updated = await toggleTask(id, newCompleted)
        setTasks(prev => prev.map(t => t.id === id ? updated : t))
      } catch (err) {
        console.error('Toggle failed:', err.message)
        // Already updated optimistically — leave as-is
      }
    }
  }

  // ── Unified entry point from QuickAdd ─────────────────────────────────────

  async function handleAdd(parsed) {
    if (parsed.entry_type === 'task' || parsed.entry_type === 'reminder') {
      return handleAddTask(parsed)
    }
    return handleAddExpense(parsed)
  }

  // ── Nav ───────────────────────────────────────────────────────────────────

  const navItems = [
    { key: 'home',   label: 'Home',    icon: '⌂' },
    { key: 'list',   label: 'Ledger',  icon: '≡' },
    { key: 'spinup', label: 'Setup',   icon: '✓' },
    { key: 'import', label: 'Import',  icon: '↑' },
  ]

  const viewTitle = { home: 'Overview', list: 'Ledger', spinup: 'Spin-Up', import: 'Import', pl: 'P&L Report' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>

      {/* Intro splash — fixed overlay, only on cold load */}
      {showIntro && <IntroSplash onComplete={() => setShowIntro(false)} />}

      {/* Header */}
      <div style={{
        padding: view === 'home' ? '36px 20px 14px' : '48px 20px 18px',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {view === 'home' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/logo.png"
              alt="225 Custer"
              style={{ height: 48, width: 'auto', display: 'block', flexShrink: 0 }}
            />
            <p style={{ fontSize: 22, fontWeight: 500 }}>Overview</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 11, color: 'var(--text2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
              225 Custer
            </p>
            <p style={{ fontSize: 22, fontWeight: 500 }}>{viewTitle[view]}</p>
          </div>
        )}
        {view === 'pl' && (
          <button onClick={() => setView('home')} style={{ fontSize: 13, color: 'var(--text2)' }}>
            ← Back
          </button>
        )}
      </div>

      {/* Content — bottom padding reserves space for the fixed nav */}
      <div style={{ flex: 1, paddingTop: 20, paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
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
            tasks={tasks}
            onDeleteTask={handleDeleteTask}
            onToggleTask={handleToggleTask}
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

      {/* Bottom nav — fixed so it's always visible regardless of scroll */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
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
