# 225 Custer

STR business tracker for 225 Custer Ave, Colorado Springs.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase (for persistent data)
1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to the SQL editor and run:

```sql
CREATE TABLE expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  date date NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  category text NOT NULL,
  tax_type text NOT NULL CHECK (tax_type IN ('depreciate','expense','personal')),
  notes text
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON expenses FOR ALL USING (true);
```

4. Copy `.env.example` to `.env` and fill in your Supabase URL and anon key
   (found in Project Settings > API)

### 3. Run locally
```bash
npm run dev
```

### 4. Deploy to Vercel
1. Push to GitHub
2. Connect repo in Vercel
3. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables
4. Deploy

### 5. Install as app on iPhone
Open the deployed URL in Safari > Share > Add to Home Screen

## Features
- Natural language quick-add ("spatula amazon $14 supplies")
- Voice input (tap the mic)
- CSV import from Chase statements
- P&L summary with depreciable vs expense breakdown
- Filter by tax treatment
- Works offline (PWA)
