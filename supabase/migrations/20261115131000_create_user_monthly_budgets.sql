/*
# Create user_monthly_budgets table

1. New Tables
- `user_monthly_budgets`: Stores monthly master allowance / budget per user per month.
  - `id` uuid primary key
  - `user_id` text not null
  - `month_key` text not null (e.g. '2026-11')
  - `total_budget` numeric(12,2) not null
  - `target_goal_id` uuid (optional link to savings_goals for unspent surplus rollover)
  - `rollover_completed` boolean default false
  - `created_at` timestamptz default now()
  - UNIQUE (user_id, month_key)

2. Security
- Enable RLS and grant CRUD to anon + authenticated.
*/

CREATE TABLE IF NOT EXISTS user_monthly_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  month_key text NOT NULL,
  total_budget numeric(12,2) NOT NULL,
  target_goal_id uuid,
  rollover_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, month_key)
);

ALTER TABLE user_monthly_budgets ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_monthly_budgets TO anon, authenticated;

DROP POLICY IF EXISTS "anon_crud_user_monthly_budgets" ON user_monthly_budgets;
CREATE POLICY "anon_crud_user_monthly_budgets" ON user_monthly_budgets 
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_user_monthly_budgets_lookup 
  ON user_monthly_budgets (user_id, month_key);
