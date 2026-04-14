import { useState, useEffect, useMemo } from 'react'
import { CATEGORIES, SHORT_CAT_NAMES, INITIAL_ITEMS, isItemDone } from '../lib/spinupData'
import { getSetupItems, saveSetupItems } from '../lib/supabase'

const STORAGE_KEY = '225-spinup-v1'

const SUBTYPE_LABELS = {
  inventory: 'Inventory',
  furniture: 'Furniture',
  consumable: 'Consumable',
  safety: 'Safety',
  setup: 'Setup task',
  staging: 'Staging task',
  appliance: 'Appliance',
}

// ── ItemRow ─────────────────────────────────────────────────────────────────

function ItemRow({ item, isLast, expanded, onToggle, onAdjustQty, onToggleExpand, onUpdateNotes }) {
  const done = isItemDone(item)
  const partial = item.qty !== null && item.qtyDone > 0 && item.qtyDone < item.qty

  let circleIcon = '○'
  let circleColor = 'var(--text3)'
  if (done) {
    circleIcon = '●'
    circleColor = 'var(--green)'
  } else if (partial) {
    circleIcon = '◑'
    circleColor = 'var(--accent)'
  }

  const subtitleParts = [SUBTYPE_LABELS[item.subtype]]
  if (item.optional) subtitleParts.push('optional')
  const subtitle = subtitleParts.join(' · ') + (item.notes ? ' 📝' : '')

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          opacity: done ? 0.5 : 1,
          borderBottom: isLast ? 'none' : '0.5px solid var(--border)',
          minHeight: 48,
        }}
      >
        {/* Circle toggle */}
        <button
          onClick={onToggle}
          style={{
            flexShrink: 0,
            fontSize: 17,
            color: circleColor,
            lineHeight: 1,
            width: 28,
            textAlign: 'center',
          }}
        >
          {circleIcon}
        </button>

        {/* Title + meta */}
        <button
          onClick={onToggleExpand}
          style={{
            flex: 1,
            textAlign: 'left',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: done ? 'var(--text3)' : 'var(--text)',
              textDecoration: done ? 'line-through' : 'none',
              lineHeight: 1.3,
            }}
          >
            {item.title}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.2 }}>
            {subtitle}
          </span>
        </button>

        {/* Priority badge */}
        {item.priority === 'high' && !done && (
          <span
            style={{
              flexShrink: 0,
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--accent)',
              background: 'var(--accent-light)',
              borderRadius: 4,
              padding: '2px 5px',
              lineHeight: 1.4,
            }}
          >
            !
          </span>
        )}

        {/* Qty counter */}
        {item.qty !== null && (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => onAdjustQty(-1)}
              disabled={item.qtyDone === 0}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                background: 'var(--bg2)',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.qtyDone === 0 ? 'var(--text3)' : 'var(--text)',
                opacity: item.qtyDone === 0 ? 0.4 : 1,
              }}
            >
              −
            </button>
            <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 28, textAlign: 'center' }}>
              {item.qtyDone}/{item.qty}
            </span>
            <button
              onClick={() => onAdjustQty(1)}
              disabled={done}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                background: done ? 'var(--bg2)' : 'var(--text)',
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: done ? 'var(--text3)' : 'var(--bg)',
                opacity: done ? 0.4 : 1,
              }}
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Expanded notes */}
      {expanded && (
        <div style={{ padding: '0 12px 10px', background: 'var(--bg2)' }}>
          <textarea
            value={item.notes}
            onChange={e => onUpdateNotes(e.target.value)}
            placeholder="Add a note…"
            rows={2}
            style={{
              background: 'var(--bg2)',
              fontSize: 13,
              resize: 'none',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '0.5px solid var(--border-mid)',
              width: '100%',
              color: 'var(--text)',
            }}
          />
        </div>
      )}
    </div>
  )
}

// ── SpinUp (main) ────────────────────────────────────────────────────────────

export default function SpinUp() {
  const [items, setItems] = useState(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY)
      return s ? JSON.parse(s) : INITIAL_ITEMS
    } catch { return INITIAL_ITEMS }
  })
  const [filterType, setFilterType] = useState('all')
  const [filterCat, setFilterCat] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [collapsed, setCollapsed] = useState({})
  const [addInput, setAddInput] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  // On mount: pull from Supabase in the background and update if it has data.
  // Content shows immediately from localStorage so the page is never blocked.
  useEffect(() => {
    getSetupItems()
      .then(dbItems => {
        if (dbItems && dbItems.length > 0) setItems(dbItems)
      })
      .catch(() => {})
  }, [])

  // Persist every change to localStorage (instant) + Supabase (synced).
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
    saveSetupItems(items).catch(() => {})
  }, [items])

  // ── Actions ──────────────────────────────────────────────────────────────

  function toggleItem(id) {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it
      if (it.qty !== null) {
        const newQtyDone = it.qtyDone >= it.qty ? 0 : it.qty
        return { ...it, qtyDone: newQtyDone }
      }
      return { ...it, done: !it.done }
    }))
  }

  function adjustQty(id, delta) {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it
      const newQtyDone = Math.max(0, Math.min(it.qty, it.qtyDone + delta))
      return { ...it, qtyDone: newQtyDone }
    }))
  }

  function updateNotes(id, notes) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, notes } : it))
  }

  function addCustomItem(title) {
    if (!title.trim()) return
    const newItem = {
      id: 'c' + Date.now(),
      title: title.trim(),
      category: 'Launch Tasks',
      type: 'task',
      subtype: 'setup',
      qty: null,
      qtyDone: 0,
      done: false,
      priority: 'medium',
      optional: false,
      notes: '',
    }
    setItems(prev => [...prev, newItem])
    setAddInput('')
    setShowAdd(false)
  }

  // ── Computed ─────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = items.length
    const done = items.filter(isItemDone).length
    const remaining = total - done
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    const tasks = items.filter(it => it.type === 'task')
    const purchases = items.filter(it => it.type === 'purchase')
    return {
      total,
      done,
      remaining,
      pct,
      tasksTotal: tasks.length,
      tasksDone: tasks.filter(isItemDone).length,
      purchasesTotal: purchases.length,
      purchasesDone: purchases.filter(isItemDone).length,
    }
  }, [items])

  const catStats = useMemo(() => {
    const result = {}
    for (const cat of CATEGORIES) {
      const catItems = items.filter(it => it.category === cat)
      result[cat] = {
        total: catItems.length,
        done: catItems.filter(isItemDone).length,
      }
    }
    return result
  }, [items])

  const filtered = useMemo(() => {
    return items.filter(it => {
      if (filterCat && it.category !== filterCat) return false
      if (filterType === 'purchases') return it.type === 'purchase'
      if (filterType === 'tasks') return it.type === 'task'
      if (filterType === 'remaining') return !isItemDone(it)
      if (filterType === 'done') return isItemDone(it)
      return true
    })
  }, [items, filterType, filterCat])

  const grouped = useMemo(() => {
    return CATEGORIES
      .map(cat => ({
        cat,
        items: filtered.filter(it => it.category === cat),
        allItems: items.filter(it => it.category === cat),
      }))
      .filter(g => g.items.length > 0)
  }, [filtered, items])

  const photoTasks = useMemo(() => {
    return items.filter(it => it.type === 'task' && it.priority === 'high' && !isItemDone(it))
  }, [items])

  const showPhotoSection = filterType === 'all' && !filterCat && photoTasks.length > 0

  // ── Type filter pill config ───────────────────────────────────────────────

  const typeFilters = [
    { key: 'all', label: 'All' },
    { key: 'purchases', label: 'Purchases' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'remaining', label: 'Remaining' },
    { key: 'done', label: 'Done' },
  ]

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ paddingBottom: 32 }}>

      {/* ── Progress Banner ── */}
      <div style={{
        margin: '0 16px 16px',
        background: 'var(--text)',
        color: 'var(--bg)',
        borderRadius: 'var(--radius)',
        padding: '16px 18px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              Launch readiness
            </p>
            <p style={{ fontSize: 36, fontWeight: 600, lineHeight: 1, color: 'var(--bg)' }}>
              {stats.pct}%
            </p>
          </div>
          <div style={{ textAlign: 'right', paddingTop: 4 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              {stats.done}/{stats.total}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>items complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          height: 4,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          overflow: 'hidden',
          marginBottom: 10,
        }}>
          <div style={{
            height: '100%',
            width: stats.pct + '%',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Stats row */}
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          {stats.tasksDone}/{stats.tasksTotal} tasks
          {' · '}
          {stats.purchasesDone}/{stats.purchasesTotal} purchases
          {' · '}
          {stats.remaining} remaining
        </p>
      </div>

      {/* ── Type filter pills ── */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '0 16px 12px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {typeFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            style={{
              flexShrink: 0,
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: filterType === f.key ? 500 : 400,
              background: filterType === f.key ? 'var(--text)' : 'var(--bg2)',
              color: filterType === f.key ? 'var(--bg)' : 'var(--text)',
              whiteSpace: 'nowrap',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Category chips ── */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '0 16px 16px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {/* All chip */}
        <button
          onClick={() => setFilterCat(null)}
          style={{
            flexShrink: 0,
            padding: '5px 11px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: !filterCat ? 500 : 400,
            background: !filterCat ? 'var(--text)' : 'var(--bg2)',
            color: !filterCat ? 'var(--bg)' : 'var(--text)',
            whiteSpace: 'nowrap',
          }}
        >
          All categories
        </button>

        {CATEGORIES.map(cat => {
          const s = catStats[cat]
          const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0
          const allDone = pct === 100 && s.total > 0
          const isActive = filterCat === cat
          const label = SHORT_CAT_NAMES[cat] + (pct > 0 ? ` ${pct}%` : '')
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(cat === filterCat ? null : cat)}
              style={{
                flexShrink: 0,
                padding: '5px 11px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: isActive ? 500 : 400,
                background: isActive ? 'var(--text)' : 'var(--bg2)',
                color: isActive ? 'var(--bg)' : (allDone ? 'var(--green)' : 'var(--text)'),
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── Before photos section ── */}
      {showPhotoSection && (
        <div style={{
          margin: '0 16px 16px',
          border: '0.5px solid var(--accent)',
          background: 'var(--accent-light)',
          borderRadius: 'var(--radius)',
          padding: '12px 14px',
        }}>
          <p style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--accent)',
            marginBottom: 10,
          }}>
            {'📷 Before photos — '}
            {photoTasks.length}
            {' task'}
            {photoTasks.length !== 1 ? 's' : ''}
            {' outstanding'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {photoTasks.slice(0, 6).map(it => (
              <button
                key={it.id}
                onClick={() => toggleItem(it.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 15, color: 'var(--accent)', lineHeight: 1 }}>○</span>
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{it.title}</span>
              </button>
            ))}
            {photoTasks.length > 6 && (
              <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 2 }}>
                +{photoTasks.length - 6} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Category sections ── */}
      {grouped.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)', fontSize: 14 }}>
          No items match this filter.
        </div>
      ) : (
        grouped.map(({ cat, items: catItems, allItems }) => {
          const s = catStats[cat]
          const allDone = s.total > 0 && s.done === s.total
          const isCollapsed = !!collapsed[cat]

          return (
            <div key={cat} style={{ marginBottom: 8 }}>
              {/* Section header */}
              <button
                onClick={() => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 16px 6px',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--text2)',
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                  }}>
                    {cat}
                  </span>
                  {allDone && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'var(--green)',
                      background: 'var(--green-bg)',
                      borderRadius: 4,
                      padding: '1px 5px',
                    }}>
                      Done
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                  {s.done}/{s.total}
                </span>
                <span style={{
                  fontSize: 11,
                  color: 'var(--text3)',
                  display: 'inline-block',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}>
                  ▾
                </span>
              </button>

              {/* Item list */}
              {!isCollapsed && (
                <div style={{
                  margin: '0 16px',
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  background: 'var(--bg)',
                }}>
                  {catItems.map((it, idx) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      isLast={idx === catItems.length - 1}
                      expanded={expanded === it.id}
                      onToggle={() => toggleItem(it.id)}
                      onAdjustQty={delta => adjustQty(it.id, delta)}
                      onToggleExpand={() => setExpanded(prev => prev === it.id ? null : it.id)}
                      onUpdateNotes={notes => updateNotes(it.id, notes)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}

      {/* ── Quick add ── */}
      <div style={{ padding: '12px 16px 8px' }}>
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1.5px dashed var(--border-mid)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              color: 'var(--text2)',
              textAlign: 'center',
            }}
          >
            ＋ Add task
          </button>
        ) : (
          <div style={{
            border: '0.5px solid var(--border-mid)',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
          }}>
            <input
              autoFocus
              type="text"
              value={addInput}
              onChange={e => setAddInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addCustomItem(addInput)
                if (e.key === 'Escape') { setShowAdd(false); setAddInput('') }
              }}
              placeholder="Task title…"
              style={{
                border: 'none',
                borderRadius: 0,
                borderBottom: '0.5px solid var(--border)',
                padding: '10px 14px',
                fontSize: 14,
              }}
            />
            <div style={{ display: 'flex', gap: 0 }}>
              <button
                onClick={() => { setShowAdd(false); setAddInput('') }}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: 13,
                  color: 'var(--text3)',
                  borderRight: '0.5px solid var(--border)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => addCustomItem(addInput)}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: addInput.trim() ? 'var(--text)' : 'var(--text3)',
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
