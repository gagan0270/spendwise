/*
# Create Student Spend AI schema (single-tenant, no auth)

1. New Tables
- `transactions`: a single student's spending entries.
  - `id` uuid primary key
  - `amount` numeric not null (positive = expense, negative = refund/income)
  - `category` text not null (e.g. Food, Books, Transport, Entertainment, Rent, Other)
  - `description` text not null (short note, e.g. "Coffee at campus cafe")
  - `merchant` text (optional)
  - `spent_at` date not null (the day the spend happened)
  - `created_at` timestamptz default now()
- `budgets`: monthly budget targets per category.
  - `id` uuid primary key
  - `category` text not null unique
  - `monthly_limit` numeric not null
  - `created_at` timestamptz default now()

2. Security
- This is a single-tenant app with no sign-in, so the anon-key frontend must read/write.
- Enable RLS on both tables. Grant CRUD to anon + authenticated.
- Use `USING (true)` policies because the data is intentionally shared (single user, no auth).

3. Notes
- `spent_at` is a plain date so we can group by month/day easily without timezone drift.
- `amount` stored as numeric for exact currency math.
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric(12,2) NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  merchant text,
  spent_at date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  monthly_limit numeric(12,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_budgets" ON budgets;
CREATE POLICY "anon_select_budgets" ON budgets FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_budgets" ON budgets;
CREATE POLICY "anon_insert_budgets" ON budgets FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_budgets" ON budgets;
CREATE POLICY "anon_update_budgets" ON budgets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_budgets" ON budgets;
CREATE POLICY "anon_delete_budgets" ON budgets FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_transactions_spent_at ON transactions (spent_at);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category);
