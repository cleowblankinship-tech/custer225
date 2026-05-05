import { useState, useEffect } from 'react'
import PLSummary from './components/PLSummary'
import PLReport from './components/PLReport'
import QuickAdd from './components/QuickAdd'
import ExpenseList from './components/ExpenseList'
import CSVImport from './components/CSVImport'
import SpinUp from './components/SpinUp'
import SetupCard from './components/SetupCard'
import { getExpenses, addExpense, deleteExpense, getTasks, addTask, deleteTask, toggleTask, getSetupItems } from './lib/supabase'
import { INITIAL_ITEMS, computeSpinUpStats } from './lib/spinupData'
import IntroSplash from './components/IntroSplash'
import HouseToday from './components/HouseToday'
import DebtDashboard from './components/DebtDashboard'
import HeroSection from './components/HeroSection'
import { getActiveUpdates, getHouseMood, getCalmMessage, getCompositeMessage } from './lib/houseUpdates'
import { fetchWeather } from './lib/weather'
import { getRecurringRemindersForDate, getUserRules, saveUserRule } from './lib/recurringRules'
import { getTimeOfDay, getTheme, applyTheme } from './lib/theme'

// ── Mood → bubble visual config ───────────────────────────────────────────────
//
// The bubble sits to the RIGHT of the house icon in a flex row.
// The tail points LEFT, connecting back to the house character.
//
// Because the tail is now on the left edge, we do NOT use a heavy
// borderLeft accent — that would clash with the tail junction.
// Urgency is conveyed through background tint and border color instead.
//
// borderRadius: left corners (10px) are tighter at the tail attachment;
// right corners (16-18px) are rounder, giving a natural "bubble" silhouette.
// Bubble surfaces now use --bubble-bg / --bubble-border / --bubble-sub tokens
// so the parchment color in night mode transitions smoothly with the rest of
// the palette. Shadows are reduced — dark mode relies on surface + border
// contrast rather than drop shadows.
const MOOD_BUBBLE = {
  urgent: {
    bg:           'var(--accent-light)',
    border:       '1px solid rgba(192,85,56,0.22)',
    borderLeft:   '1px solid rgba(192,85,56,0.22)',
    borderRadius: '10px 16px 16px 10px',
    padding:      '11px 14px',
    boxShadow:    '0 1px 6px rgba(0,0,0,0.08)',
    tailBorder:   '1px solid rgba(192,85,56,0.22)',
    tailFill:     'var(--accent-light)',
    textColor:    'var(--text)',
    textWeight:   600,
    moreColor:    'var(--accent)',
  },
  attention: {
    bg:           'var(--bubble-bg)',
    border:       '1px solid var(--bubble-border)',
    borderLeft:   '1px solid var(--bubble-border)',
    borderRadius: '10px 16px 16px 10px',
    padding:      '11px 14px',
    boxShadow:    '0 1px 5px rgba(0,0,0,0.06)',
    tailBorder:   '1px solid var(--bubble-border)',
    tailFill:     'var(--bubble-bg)',
    textColor:    '#1A1208',
    textWeight:   500,
    moreColor:    'var(--bubble-sub)',
  },
  calm: {
    bg:           'var(--bubble-bg)',
    border:       '1px solid var(--bubble-border)',
    borderLeft:   '1px solid var(--bubble-border)',
    borderRadius: '10px 18px 18px 10px',
    padding:      '11px 14px',
    boxShadow:    '0 1px 5px rgba(0,0,0,0.06)',
    tailBorder:   '1px solid var(--bubble-border)',
    tailFill:     'var(--bubble-bg)',
    textColor:    '#1A1208',
    textWeight:   500,
    moreColor:    'var(--bubble-sub)',
  },
}

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
  const [weatherConditions, setWeatherConditions] = useState([])
  const [weatherBlurb, setWeatherBlurb] = useState(null)
  const [weatherCondition, setWeatherCondition] = useState('clear')
  // themeMode: 'auto' = follows time + weather; 'day' / 'night' = forced
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('custer225_theme_mode') || 'auto')
  const [showIntro, setShowIntro] = useState(true) // true on every cold load
  const [housePanelOpen, setHousePanelOpen] = useState(false)
  const [userRules, setUserRules] = useState(() => getUserRules())
  const [setupStats, setSetupStats] = useState(null) // launch readiness snapshot

  // ── Derive today's reminders from the tasks system ────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]
  const taskReminders = tasks
    .filter(t => !t.completed && t.entry_type === 'reminder' && t.due_date && t.due_date <= todayStr)
    .map(t => ({
      id: `task-${t.id}`,
      type: 'reminder',
      priority: 'normal',
      title: t.title,
      detail: null,
    }))

  // ── Recurring house routines (built-in + user-defined) ───────────────────
  const recurringReminders = getRecurringRemindersForDate(todayStr, userRules)

  // ── Merge all update sources + derive mood ────────────────────────────────
  const activeUpdates  = getActiveUpdates([...weatherConditions, ...taskReminders, ...recurringReminders])
  const topUpdate      = activeUpdates[0] ?? null
  const mood           = getHouseMood(activeUpdates)
  const moodStyle      = MOOD_BUBBLE[mood]

  // All-time Airbnb revenue — used for bubble message + NBA card
  const totalRevenue = expenses
    .filter(e => e.entry_type === 'income')
    .reduce((s, e) => s + Number(e.amount), 0)

  // Bubble message:
  //   updates present → show top update title; weather is the subtitle
  //   nothing active  → composite message weaves weather + readiness + revenue
  const bubbleMessage = topUpdate
    ? topUpdate.title
    : getCompositeMessage({
        weatherBlurb,
        setupPct:       setupStats?.pct       ?? 100,
        setupRemaining: setupStats?.remaining ?? 0,
        totalRevenue,
      })
  const bubbleWeatherSubtitle = (weatherBlurb && topUpdate) ? weatherBlurb : null
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

  // Fetch weather on mount, refresh every 30 min
  // Activates automatically once VITE_OWM_KEY + VITE_PROPERTY_LAT/LON are set
  useEffect(() => {
    async function refresh() {
      const { alerts, blurb, themeCondition } = await fetchWeather()
      setWeatherConditions(alerts)
      setWeatherBlurb(blurb)
      setWeatherCondition(themeCondition ?? 'clear')
    }
    refresh()
    const id = setInterval(refresh, 30 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  // ── Apply theme ───────────────────────────────────────────────────────────
  // Runs immediately, then re-checks every 60 s in auto mode so the palette
  // naturally transitions at the time-band boundaries (morning → day, etc.).
  useEffect(() => {
    function apply() {
      const tod = themeMode === 'auto'   ? getTimeOfDay()
                : themeMode === 'night'  ? 'night'
                : themeMode === 'morning'? 'morning'
                : themeMode === 'evening'? 'evening'
                :                         'day'
      applyTheme(getTheme({ timeOfDay: tod, weatherCondition }))
    }
    apply()
    if (themeMode !== 'auto') return   // no polling needed when forced
    const id = setInterval(apply, 60_000)
    return () => clearInterval(id)
  }, [themeMode, weatherCondition])

  // Load launch readiness stats (mirrors SetupCard's data fetch)
  useEffect(() => {
    async function loadSetup() {
      try {
        const dbItems = await getSetupItems()
        if (dbItems && dbItems.length > 0) { setSetupStats(computeSpinUpStats(dbItems)); return }
      } catch {}
      // Supabase unavailable — try localStorage, fall back to INITIAL_ITEMS
      if (!import.meta.env.VITE_SUPABASE_URL) {
        console.warn('[225] Supabase not configured. Launch readiness is showing INITIAL_ITEMS fallback (dev only — deploy with env vars to see real data).')
      }
      try {
        const s = localStorage.getItem('225-spinup-v1')
        setSetupStats(computeSpinUpStats(s ? JSON.parse(s) : INITIAL_ITEMS))
      } catch {
        setSetupStats(computeSpinUpStats(INITIAL_ITEMS))
      }
    }
    loadSetup()
  }, [])

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

  // ── Recurring rule handler ────────────────────────────────────────────────

  function handleAddRecurringRule(parsed) {
    const rule = {
      id:            'user-' + Date.now(),
      title:         parsed.title,
      type:          parsed.type || 'general',
      cadence_type:  parsed.cadence_type,
      cadence_config: parsed.cadence_config,
      active:        true,
      start_date:    null,
      end_date:      null,
      notes:         null,
    }
    const updated = saveUserRule(rule)
    setUserRules(updated)
    setView('home')
  }

  // ── Unified entry point from QuickAdd ─────────────────────────────────────

  async function handleAdd(parsed) {
    if (parsed.entry_type === 'recurring_rule') return handleAddRecurringRule(parsed)
    if (parsed.entry_type === 'task' || parsed.entry_type === 'reminder') return handleAddTask(parsed)
    return handleAddExpense(parsed)
  }

  // ── Nav ───────────────────────────────────────────────────────────────────

  const navItems = [
    { key: 'home',   label: 'Home',   icon: '⌂' },
    { key: 'list',   label: 'Ledger', icon: '≡' },
    { key: 'debt',   label: 'Debt',   icon: '$' },
    { key: 'spinup', label: 'Launch', icon: '✓' },
    { key: 'import', label: 'Import', icon: '↑' },
  ]

  const viewTitle = { home: 'Overview', list: 'Ledger', debt: 'Debt', spinup: 'Spin-Up', import: 'Import', pl: 'P&L Report' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>

      {/* Intro splash — fixed overlay, only on cold load */}
      {showIntro && <IntroSplash onComplete={() => setShowIntro(false)} />}

      {/* Header */}
      {view === 'home' ? (
        // ── Hero landscape section ─────────────────────────────────────────
        // Replaces the old house-icon + speech-bubble header on the home view.
        // Painting background, house embedded in scene, bubble revealed on tap.
        <HeroSection
          moodStyle={moodStyle}
          message={bubbleMessage}
          extraCount={activeUpdates.length > 1 ? activeUpdates.length - 1 : 0}
          onOpen={() => setHousePanelOpen(true)}
          weatherBlurb={bubbleWeatherSubtitle}
          setupStats={setupStats}
          totalRevenue={totalRevenue}
          themeMode={themeMode}
          onThemeToggle={() => {
            const CYCLE = ['auto', 'day', 'evening', 'night']
            const m = CYCLE[(CYCLE.indexOf(themeMode) + 1) % CYCLE.length]
            setThemeMode(m)
            localStorage.setItem('custer225_theme_mode', m)
          }}
        />
      ) : (
        <div style={{
          padding: '48px 20px 18px',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--text2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
              225 Custer
            </p>
            <p style={{ fontSize: 22, fontWeight: 500 }}>{viewTitle[view]}</p>
          </div>
          {view === 'pl' && (
            <button onClick={() => setView('home')} style={{ fontSize: 13, color: 'var(--text2)' }}>
              ← Back
            </button>
          )}
        </div>
      )}

      {/* Content — bottom padding reserves space for the fixed nav */}
      {/* paddingTop: 0 on home — the hero fade + card overlap handles separation.
          paddingTop: 20 on all other views — normal header gap.              */}
      <div style={{ flex: 1, paddingTop: view === 'home' ? 0 : 20, paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 14, padding: 40 }}>Loading...</p>
        )}

        {!loading && view === 'home' && (
          <>
            {/*
              Negative marginTop pulls PLSummary up 55px into the hero's
              gradient fade zone, creating a card-overlap effect.
              zIndex: 2 ensures cards render above the gradient (z:1) and
              overlay, but below the house (z:5) and bubble (z:10).
              The section header ("The House So Far") appears ~47px above the
              hero bottom edge — floating in the soft fade, bridging hero and
              dashboard visually.
            */}
            <div style={{ position: 'relative', zIndex: 2, marginTop: -55 }}>
              <PLSummary
                expenses={expenses}
                onNavigate={navigateToList}
                isPreLaunch={!setupStats || setupStats.pct < 100}
              />
            </div>

            {/* P&L link */}
            <div style={{ padding: '0 20px 24px' }}>
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

            {/* ── Next Best Action ─────────────────────────────────────── */}
            {/* Computed from: launch % → revenue → fallback              */}
            {(() => {
              let msg, sub, onClick
              if (!setupStats) {
                // Data unavailable or still loading
                msg     = 'Review launch checklist'
                sub     = 'View launch list'
                onClick = () => setView('spinup')
              } else if (setupStats.pct < 100) {
                const { remaining, done } = setupStats
                if (done === 0) {
                  msg = 'Start the launch checklist'
                  sub = `${setupStats.total} tasks to go`
                } else if (remaining <= 10) {
                  msg = remaining === 1 ? 'Finish the last launch task' : `Finish the last ${remaining} launch tasks`
                  sub = 'View launch list'
                } else {
                  msg = 'Work through the launch checklist'
                  sub = `${remaining} tasks remaining`
                }
                onClick = () => setView('spinup')
              } else if (totalRevenue === 0) {
                msg     = 'Add your first Airbnb booking when it comes in'
                sub     = 'Tap to log income'
                onClick = () => navigateToList('income', null)
              } else {
                msg     = "Review this month's house spending"
                sub     = 'View full P&L'
                onClick = () => setView('pl')
              }
              return (
                <div style={{ padding: '0 20px 24px' }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Next Best Action
                  </p>
                  <button
                    onClick={onClick}
                    style={{
                      width: '100%', padding: '13px 16px',
                      borderRadius: 'var(--radius-sm)', background: 'var(--bg2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{msg}</span>
                      {sub && <span style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sub}</span>}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--accent)', flexShrink: 0, marginLeft: 8 }}>→</span>
                  </button>
                </div>
              )
            })()}

            {/* Launch readiness card */}
            <div style={{ padding: '0 20px 24px' }}>
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

        {!loading && view === 'debt' && <DebtDashboard />}

        {!loading && view === 'spinup' && <SpinUp />}

        {!loading && view === 'import' && (
          <CSVImport onImport={handleImport} onClose={() => setView('home')} />
        )}

        {!loading && view === 'pl' && (
          <PLReport expenses={expenses} />
        )}
      </div>

      {/* House Today panel — fixed overlay, slides up from bottom */}
      {housePanelOpen && (
        <HouseToday
          updates={activeUpdates}
          onClose={() => setHousePanelOpen(false)}
        />
      )}

      {/* Bottom nav — fixed, background spans viewport, tabs constrained to content width */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        borderTop: '0.5px solid var(--border)',
        background: 'var(--bg)',
      }}>
        <div style={{
          maxWidth: 480, margin: '0 auto',
          display: 'flex',
          paddingBottom: 'env(safe-area-inset-bottom)',
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
              color: view === item.key ? 'var(--accent)' : 'var(--text3)',
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: view === item.key ? 500 : 400 }}>{item.label}</span>
          </button>
        ))}
        </div>
      </div>
    </div>
  )
}
