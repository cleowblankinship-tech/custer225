import { useState, useEffect } from 'react'
import { UPDATE_TYPES, SECTION_ORDER } from '../lib/houseUpdates'

// ── HouseToday ────────────────────────────────────────────────────────────────
//
// Bottom-sheet panel showing all active house updates.
// Slides up on mount, slides down on dismiss.
//
// Props:
//   updates  — array of update objects from houseUpdates.js
//   onClose  — called after the slide-down animation finishes

const ANIM_MS = 300

export default function HouseToday({ updates, onClose }) {
  const [visible, setVisible] = useState(false)

  // Trigger slide-up after mount so the CSS transition fires
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(id)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, ANIM_MS)
  }

  // Group by type in defined section order
  const byType = {}
  for (const type of SECTION_ORDER) {
    byType[type] = updates.filter(u => u.type === type)
  }
  const hasAny = updates.length > 0

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.28)',
          opacity: visible ? 1 : 0,
          transition: `opacity ${ANIM_MS}ms ease`,
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-label="House Today"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
          background: 'var(--bg)',
          borderRadius: '16px 16px 0 0',
          maxHeight: '82vh',
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -2px 24px rgba(0,0,0,0.07)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: `transform ${ANIM_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`,
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-mid)' }} />
        </div>

        {/* Header row */}
        <div style={{
          padding: '12px 20px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '0.5px solid var(--border)',
        }}>
          <div>
            <p style={{ fontSize: 17, fontWeight: 600 }}>House Today</p>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>225 Custer</p>
          </div>
          <button
            onClick={handleClose}
            style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 500, padding: '6px 0 6px 16px' }}
          >
            Done
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 20px 32px' }}>
          {!hasAny ? (
            <div style={{ textAlign: 'center', paddingTop: 32, paddingBottom: 16 }}>
              <p style={{ fontSize: 28, marginBottom: 12 }}>☀</p>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>All clear</p>
              <p style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.5 }}>
                No alerts or reminders for today.
              </p>
            </div>
          ) : (
            SECTION_ORDER.map(type => {
              const items = byType[type]
              if (!items || items.length === 0) return null
              const config = UPDATE_TYPES[type]

              return (
                <div key={type} style={{ marginBottom: 24 }}>
                  {/* Section label */}
                  <p style={{
                    fontSize: 11, fontWeight: 500, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: 'var(--text3)',
                    marginBottom: 8,
                  }}>
                    {items.length === 1 ? config.label : config.plural}
                  </p>

                  {/* Items card */}
                  <div style={{
                    background: 'var(--bg)',
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                  }}>
                    {items.map((item, i) => (
                      <UpdateRow
                        key={item.id}
                        item={item}
                        isLast={i === items.length - 1}
                      />
                    ))}
                  </div>
                </div>
              )
            })
          )}

        </div>
      </div>
    </>
  )
}

// ── UpdateRow ─────────────────────────────────────────────────────────────────

function UpdateRow({ item, isLast }) {
  const isHigh = item.priority === 'high'

  return (
    <div style={{
      padding: '13px 16px',
      borderBottom: isLast ? 'none' : '0.5px solid var(--border)',
      borderLeft: isHigh ? '2px solid var(--accent)' : '2px solid transparent',
    }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: item.detail ? 5 : 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 500,
          color: isHigh ? 'var(--accent)' : 'var(--text)',
          flex: 1,
        }}>
          {item.title}
        </p>
        {isHigh && (
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 20,
            background: 'var(--accent-light)', color: 'var(--accent)',
            fontWeight: 600, letterSpacing: '0.02em', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            urgent
          </span>
        )}
      </div>

      {/* Detail */}
      {item.detail && (
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>
          {item.detail}
        </p>
      )}
    </div>
  )
}
