/*
# Create savings goals for Student Spend AI

1. New Tables
- `savings_goals`: a single-tenant list of personal savings targets.
  - `id` uuid primary key
  - `name` text: the goal name, such as Emergency fund or New laptop
  - `target_amount` numeric: the desired total in Indian rupees
  - `saved_amount` numeric: current progress in Indian rupees
  - `target_date` date: optional target date
  - `created_at` timestamptz: creation timestamp

2. Security
- This app has no sign-in screen and is intentionally single-tenant.
- Enable RLS and grant CRUD access to anon + authenticated.
- Add separate policies for each CRUD operation using true because the app has one shared workspace.

3. Notes
- Goal amounts use numeric(12,2) to preserve exact rupee values.
- The frontend can update progress without deleting or recreating goals.
*/

CREATE TABLE IF NOT EXISTS savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  target_amount numeric(12,2) NOT NULL CHECK (target_amount > 0),
  saved_amount numeric(12,2) NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
  target_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON savings_goals TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_savings_goals" ON savings_goals;
CREATE POLICY "anon_select_savings_goals" ON savings_goals FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_savings_goals" ON savings_goals;
CREATE POLICY "anon_insert_savings_goals" ON savings_goals FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_savings_goals" ON savings_goals;
CREATE POLICY "anon_update_savings_goals" ON savings_goals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_savings_goals" ON savings_goals;
CREATE POLICY "anon_delete_savings_goals" ON savings_goals FOR DELETE
  TO anon, authenticated USING (true);
