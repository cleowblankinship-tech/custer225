import { createClient } from '@supabase/supabase-js'

// Set these in a .env file:
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key
//
// ── Table: expenses ───────────────────────────────────────────────────────────
// CREATE TABLE expenses (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   created_at timestamptz DEFAULT now(),
//   date date NOT NULL,
//   description text NOT NULL,
//   amount numeric(10,2) NOT NULL,
//   category text NOT NULL,
//   tax_type text NOT NULL CHECK (tax_type IN ('depreciate','expense','personal')),
//   notes text
// );
// ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Allow all" ON expenses FOR ALL USING (true);
//
// ── Table: setup_state ────────────────────────────────────────────────────────
// Stores the full Setup checklist as a single JSONB row so progress syncs
// across all devices.
//
// CREATE TABLE setup_state (
//   id integer PRIMARY KEY,
//   items jsonb NOT NULL DEFAULT '[]'::jsonb,
//   updated_at timestamptz DEFAULT now()
// );
// ALTER TABLE setup_state ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Allow all" ON setup_state FOR ALL USING (true) WITH CHECK (true);
// INSERT INTO setup_state (id, items) VALUES (1, '[]'::jsonb) ON CONFLICT (id) DO NOTHING;
//
// ── Table: tasks ──────────────────────────────────────────────────────────────
// Stores quick-add tasks and reminders.
//
// CREATE TABLE tasks (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   created_at timestamptz DEFAULT now(),
//   title text NOT NULL,
//   entry_type text NOT NULL DEFAULT 'task' CHECK (entry_type IN ('task', 'reminder')),
//   due_date date,
//   completed boolean NOT NULL DEFAULT false
// );
// ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "Allow all" ON tasks FOR ALL USING (true) WITH CHECK (true);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function getExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

export async function addExpense(expense) {
  const { data, error } = await supabase
    .from('expenses')
    .insert([expense])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExpense(id) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Setup checklist ───────────────────────────────────────────────────────────

export async function getSetupItems() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('setup_state')
    .select('items')
    .eq('id', 1)
    .single()
  if (error) return null
  return Array.isArray(data?.items) && data.items.length > 0 ? data.items : null
}

export async function saveSetupItems(items) {
  if (!supabase) return
  const { error } = await supabase
    .from('setup_state')
    .upsert({ id: 1, items, updated_at: new Date().toISOString() })
  if (error) throw error
}

// ── Tasks & reminders ─────────────────────────────────────────────────────────

export async function getTasks() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addTask(task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteTask(id) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function toggleTask(id, completed) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ completed })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
