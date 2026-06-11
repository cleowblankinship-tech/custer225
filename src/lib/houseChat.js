// ── Ask the House ─────────────────────────────────────────────────────────────
//
// The house's question-answering engine. Intent matching is rule-based; every
// answer is grounded in actual application data (calendar, ledger, tasks,
// launch checklist) — the house NEVER invents numbers. When it doesn't have
// the data, it says so.
//
// askHouse() returns { answer, view, viewLabel, autoOpen }:
//   answer    — what the house says (first person, warm, concise)
//   view      — supporting view to offer: 'calendar' | 'money' | 'list' |
//               'tasks' | 'debt' | 'spinup' | null
//   viewLabel — label for the open-view affordance
//   autoOpen  — true when the user asked to *see* something ("show me…")

import { normalizeStays, computeMonth, fmtDay, MONTH_NAMES } from './houseUpdates'
import { computeCashFlow } from './finance'
import { normalizeCategory } from './categories'

const VIEW_LABELS = {
  calendar: 'Open the calendar',
  money:    'Open financials',
  list:     'Open the ledger',
  tasks:    'Open the task list',
  debt:     'Open the debt board',
  spinup:   'Open the launch list',
}

function dollars(n) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

function todayMT() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Denver' })
}

// "occupancy for June" → [year, monthIndex+1]; defaults to the current month
function parseMonth(q) {
  const now = todayMT().split('-').map(Number)
  const idx = MONTH_NAMES.findIndex(m => q.includes(m.toLowerCase()))
  if (idx === -1) return { y: now[0], m: now[1], name: MONTH_NAMES[now[1] - 1], isCurrent: true }
  // A named past month this year, or upcoming — assume this year
  return { y: now[0], m: idx + 1, name: MONTH_NAMES[idx], isCurrent: idx + 1 === now[1] }
}

function reply(answer, view = null, autoOpen = false) {
  return { answer, view, viewLabel: view ? VIEW_LABELS[view] : null, autoOpen }
}

// ── Intent answers ────────────────────────────────────────────────────────────

function answerOccupancy(q, stays, expenses) {
  const { y, m, name } = parseMonth(q)
  if (!stays.length) return reply("My calendar's empty right now — once bookings land I'll keep count.", 'calendar')
  const mo = computeMonth(stays, expenses, y, m)
  if (mo.stayCount === 0) return reply(`Nothing booked for ${name} yet — ${mo.daysInMonth} open nights.`, 'calendar')
  let a = `${name} is ${mo.pct}% booked — ${mo.stayCount} stay${mo.stayCount !== 1 ? 's' : ''}, ${mo.bookedNights} of ${mo.daysInMonth} nights.`
  if (mo.revenue > 0) a += ` ${dollars(mo.revenue)} along with it.`
  return reply(a, 'calendar')
}

function answerHowAreWeDoing(stays, expenses) {
  const [y, m] = todayMT().split('-').map(Number)
  const name = MONTH_NAMES[m - 1]
  const mo = computeMonth(stays, expenses, y, m)
  const cf = computeCashFlow(expenses, `${y}-${String(m).padStart(2, '0')}`)
  const bits = []
  if (mo.stayCount > 0) {
    bits.push(`${name} is ${mo.pct}% booked with ${mo.stayCount} stay${mo.stayCount !== 1 ? 's' : ''}`)
    if (mo.revenue > 0) bits.push(`${dollars(mo.revenue)} coming through`)
  } else {
    bits.push(`nothing on the ${name} calendar yet`)
  }
  if (cf.operating > 0) bits.push(`${dollars(cf.operating)} out in operating costs`)
  // Pacing against last month, same accounting as the narration deck
  const prev = new Date(y, m - 2, 1)
  const prevRev = computeMonth(stays, expenses, prev.getFullYear(), prev.getMonth() + 1).revenue
  let tail = ''
  if (prevRev > 0 && mo.revenue > 0) {
    tail = mo.revenue >= prevRev
      ? ` Ahead of ${MONTH_NAMES[prev.getMonth()]} — I'd call that a good month.`
      : ` Still chasing ${MONTH_NAMES[prev.getMonth()]}'s ${dollars(prevRev)}.`
  }
  return reply(`So far, ${bits.join(', ')}.${tail}`, 'money')
}

function answerNextGuest(stays) {
  if (!stays.length) return reply("No guests on my calendar yet — I'll let you know the moment that changes.", 'calendar')
  const t = todayMT()
  const current = stays.find(b => b.ci <= t && t < b.co)
  const next    = stays.find(b => b.ci > t)
  const parts = []
  if (current) parts.push(`${current.name} is here now, through ${fmtDay(current.co)}`)
  if (next)    parts.push(`${current ? 'then ' : ''}${next.name} arrives ${fmtDay(next.ci)} for ${next.nights ?? '?'} night${next.nights !== 1 ? 's' : ''}`)
  if (!parts.length) return reply('No upcoming check-ins on my calendar.', 'calendar')
  return reply(parts.join('; ') + '.', 'calendar')
}

function answerCheckout(stays) {
  const t = todayMT()
  const current = stays.find(b => b.ci <= t && t < b.co)
  if (current) {
    return reply(current.co === t
      ? `${current.name} checks out today.`
      : `${current.name} checks out ${fmtDay(current.co)}.`, 'calendar')
  }
  return reply('Nobody to check out — the house is empty right now.', 'calendar')
}

function answerExpenses(q, expenses) {
  const { y, m, name, isCurrent } = parseMonth(q)
  const prefix = `${y}-${String(m).padStart(2, '0')}`
  const ops = expenses.filter(e =>
    e.entry_type === 'expense' && e.tax_type === 'expense' && e.date?.startsWith(prefix))
  if (!ops.length) return reply(`No operating expenses logged ${isCurrent ? 'this month' : `for ${name}`}.`, 'list')
  const total = ops.reduce((s, e) => s + Number(e.amount), 0)
  const byCat = {}
  for (const e of ops) {
    const c = normalizeCategory(e.category)
    byCat[c] = (byCat[c] ?? 0) + Number(e.amount)
  }
  const [topCat, topAmt] = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0]
  return reply(
    `${dollars(total)} in operating costs ${isCurrent ? 'this' : 'in'} ${name} — the biggest line is ${topCat} at ${dollars(topAmt)}.`,
    'list'
  )
}

function answerCashFlow(q, expenses) {
  const scoped = /this month|month/.test(q)
  const [y, m] = todayMT().split('-').map(Number)
  const cf = computeCashFlow(expenses, scoped ? `${y}-${String(m).padStart(2, '0')}` : null)
  const span = scoped ? 'This month' : 'All time'
  if (cf.gross === 0 && cf.operating === 0) {
    return reply('Nothing in the books yet — no income or expenses to count.', 'money')
  }
  return reply(
    `${span}: ${dollars(cf.gross)} in, ${dollars(cf.operating)} out — cash flow of ${dollars(cf.cashFlow)} after debt service, ${dollars(cf.availableCash)} free after reserves and draws.`,
    'money'
  )
}

function answerRevenue(q, stays, expenses) {
  const { y, m, name } = parseMonth(q)
  const mo = computeMonth(stays, expenses, y, m)
  if (mo.revenue <= 0) return reply(`No revenue in my books for ${name} yet.`, 'money')
  const prev = new Date(y, m - 2, 1)
  const prevRev = computeMonth(stays, expenses, prev.getFullYear(), prev.getMonth() + 1).revenue
  let a = `${dollars(mo.revenue)} for ${name} across ${mo.stayCount} stay${mo.stayCount !== 1 ? 's' : ''}.`
  if (mo.bookedNights > 0) a += ` That's ${dollars(mo.revenue / mo.bookedNights)} a night.`
  if (prevRev > 0) a += mo.revenue >= prevRev
    ? ` Ahead of ${MONTH_NAMES[prev.getMonth()]}.`
    : ` ${MONTH_NAMES[prev.getMonth()]} did ${dollars(prevRev)}.`
  return reply(a, 'money')
}

function answerGaps(stays) {
  const t = todayMT()
  const prefix = t.slice(0, 7)
  let gaps = 0
  let first = null
  for (let i = 0; i < stays.length - 1; i++) {
    const cursor = new Date(stays[i].co.slice(0, 4), stays[i].co.slice(5, 7) - 1, stays[i].co.slice(8, 10))
    const end    = new Date(stays[i + 1].ci.slice(0, 4), stays[i + 1].ci.slice(5, 7) - 1, stays[i + 1].ci.slice(8, 10))
    while (cursor < end) {
      const key = cursor.toLocaleDateString('en-CA')
      if (key.startsWith(prefix) && key >= t) { gaps++; first ??= key }
      cursor.setDate(cursor.getDate() + 1)
    }
  }
  if (gaps === 0) return reply('No gap nights ahead this month — the calendar lines up nicely.', 'calendar')
  return reply(
    `${gaps} open night${gaps !== 1 ? 's' : ''} between stays this month — the first is ${fmtDay(first)}. Worth a price tweak.`,
    'calendar'
  )
}

function answerTasks(tasks) {
  const open = tasks.filter(t => !t.completed && (t.entry_type === 'task' || t.entry_type === 'reminder'))
  if (!open.length) return reply('My to-do list is clear. A rare luxury.', 'tasks')
  const today = new Date().toISOString().split('T')[0]
  const due = open.filter(t => t.due_date && t.due_date <= today)
  let a = `${open.length} open item${open.length !== 1 ? 's' : ''} on my list`
  if (due.length) a += `, ${due.length} due now — first up: ${due[0].title}`
  else a += ` — next up: ${open[0].title}`
  return reply(a + '.', 'tasks')
}

function answerLaunch(setupStats) {
  if (!setupStats) return reply("I haven't checked the launch list lately — take a look.", 'spinup')
  if (setupStats.pct >= 100) return reply("The launch list is done — I'm fully open for business.", 'spinup')
  return reply(
    `I'm ${setupStats.pct}% ready — ${setupStats.remaining} task${setupStats.remaining !== 1 ? 's' : ''} left on the launch list.`,
    'spinup'
  )
}

// ── Main entry ────────────────────────────────────────────────────────────────

/**
 * @param {string} question
 * @param {object} ctx — { calendarData, expenses, tasks, setupStats }
 */
export function askHouse(question, ctx = {}) {
  const q = ` ${question.toLowerCase().trim()} `
  const { calendarData = null, expenses = [], tasks = [], setupStats = null } = ctx
  const stays = normalizeStays(calendarData)
  const autoOpen = /\b(show|open|pull up|take me|go to)\b/.test(q)
  const wrap = r => ({ ...r, autoOpen: autoOpen && !!r.view })

  if (/\b(hi|hello|hey|good (morning|afternoon|evening))\b/.test(q)) {
    return wrap(reply("Hello! Ask me about bookings, occupancy, revenue, expenses, cash flow, or my to-do list."))
  }
  if (/\bgap/.test(q))                                    return wrap(answerGaps(stays))
  if (/occupan|how (booked|full)|booked/.test(q))         return wrap(answerOccupancy(q, stays, expenses))
  if (/how (are we|am i|is it|are things)|doing this month|status|overview/.test(q))
                                                          return wrap(answerHowAreWeDoing(stays, expenses))
  if (/check[- ]?out|leaving|departs?/.test(q))           return wrap(answerCheckout(stays))
  if (/check[- ]?in|arriv|next guest|who.?s (coming|next)|upcoming (guest|stay)|booking/.test(q))
                                                          return wrap(answerNextGuest(stays))
  if (/cash ?flow|available cash|noi|profit/.test(q))     return wrap(answerCashFlow(q, expenses))
  if (/bill|expense|spend|spent|cost|utilit/.test(q))     return wrap(answerExpenses(q, expenses))
  if (/revenue|income|earn|made|payout/.test(q))          return wrap(answerRevenue(q, stays, expenses))
  if (/debt|mortgage|loan|owe/.test(q))                   return wrap(reply("The debt board has the full picture of what we owe.", 'debt'))
  if (/task|maintenance|remind|to-?do|chore|fix|repair/.test(q)) return wrap(answerTasks(tasks))
  if (/launch|setup|ready|spin/.test(q))                  return wrap(answerLaunch(setupStats))
  if (/plant|flower|water/.test(q)) {
    return wrap(reply('The flowers out front could use water now and then — I keep a reminder for it.', 'tasks'))
  }
  if (/calendar|month view|schedule/.test(q))             return wrap(reply("Here's the month at a glance.", 'calendar'))
  if (/ledger|transactions|entries/.test(q))              return wrap(reply('Every dollar in and out lives in the ledger.', 'list'))

  return wrap(reply(
    "I keep track of bookings, occupancy, revenue, expenses, cash flow, debt, and the to-do list. Try “Who checks in next?” or “How are we doing this month?”"
  ))
}
