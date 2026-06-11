// ── /api/ask ──────────────────────────────────────────────────────────────────
//
// The AI brain behind "Ask the House". Receives a question plus a compact
// snapshot of REAL application data (computed client-side with the same
// accounting functions the dashboards use) and asks Claude to answer in the
// house's voice, grounded strictly in that snapshot.
//
// Requires ANTHROPIC_API_KEY in the environment. When the key is missing or
// the call fails, this returns a non-200 and the client falls back to the
// built-in rule-based engine (src/lib/houseChat.js) — the house always answers.
//
// Request:  POST { question: string, snapshot: object }
// Response: 200  { answer: string, view: string|null }

import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are the voice of a small storybook house at 225 Custer in Colorado Springs — a short-term rental that narrates its own operations. You speak in first person as the house itself: warm, competent, helpful, slightly whimsical, and concise. A trusted caretaker, not a corporate assistant. Not overly cartoonish, not overly chatty.

Style: 1-3 short sentences. Examples of your voice:
- "Three guests are arriving this month."
- "Revenue is ahead of last month — $5,650 so far."
- "You have a gap night next Thursday. Worth a price tweak."
- "The flowers out front could use water."

HARD RULES:
1. Answer ONLY from the data snapshot provided in the user message. NEVER invent, estimate, or extrapolate numbers, names, or dates that are not in the snapshot.
2. If the snapshot doesn't contain what's needed to answer, say so plainly (e.g. "I don't have that in my books yet.") and suggest what you CAN answer.
3. Dollar figures: round to whole dollars, format like $5,650.
4. You may do simple arithmetic on snapshot values (sums, differences, averages, percentages) — but never introduce outside facts.
5. Pick the most relevant supporting view for the question, or null if none fits:
   - calendar: bookings, guests, occupancy, gap nights, check-ins/outs
   - money:    revenue, cash flow, NOI, financial summaries
   - list:     expenses, bills, the ledger, transactions
   - tasks:    maintenance, reminders, to-dos, chores
   - debt:     mortgage, loans, what's owed
   - spinup:   launch checklist, readiness`

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    answer: {
      type: 'string',
      description: "The house's reply: 1-3 short sentences, first person, grounded only in the snapshot.",
    },
    view: {
      anyOf: [
        { type: 'string', enum: ['calendar', 'money', 'list', 'tasks', 'debt', 'spinup'] },
        { type: 'null' },
      ],
      description: 'The supporting view to offer, or null.',
    },
  },
  required: ['answer', 'view'],
  additionalProperties: false,
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST only' })
    return
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    res.status(503).json({ error: 'ANTHROPIC_API_KEY not configured' })
    return
  }

  const { question, snapshot } = req.body ?? {}
  if (!question || typeof question !== 'string' || question.length > 500 || !snapshot) {
    res.status(400).json({ error: 'question (≤500 chars) and snapshot required' })
    return
  }

  try {
    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      output_config: {
        format: { type: 'json_schema', schema: RESPONSE_SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content:
            `Property data snapshot (the ONLY source of truth):\n` +
            `${JSON.stringify(snapshot)}\n\n` +
            `Question: ${question}`,
        },
      ],
    })

    if (response.stop_reason === 'refusal' || response.content.length === 0) {
      res.status(502).json({ error: 'no answer' })
      return
    }
    const text = response.content.find(b => b.type === 'text')?.text
    const parsed = JSON.parse(text)
    res.status(200).json({ answer: parsed.answer, view: parsed.view ?? null })
  } catch (err) {
    console.error('[ask]', err?.status ?? '', err?.message)
    res.status(502).json({ error: 'ask failed' })
  }
}
