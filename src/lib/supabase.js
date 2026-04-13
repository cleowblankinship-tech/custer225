import { createClient } from '@supabase/supabase-js'

// Set these in a .env file:
// VITE_SUPABASE_URL=https://your-project.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key
//
// Supabase table: expenses
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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

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
