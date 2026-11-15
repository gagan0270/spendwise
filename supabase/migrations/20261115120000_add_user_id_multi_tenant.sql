/*
# Multi-tenant user isolation support

1. Changes
- Add `user_id` text column to `transactions`, `budgets`, and `savings_goals`.
- Update `budgets` unique constraint to (user_id, category) so each user has separate budget rules.
- Add indexes for fast per-user querying on spent_at and category.
*/

ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_category_key;

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id text NOT NULL DEFAULT '';
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id text NOT NULL DEFAULT '';
ALTER TABLE savings_goals ADD COLUMN IF NOT EXISTS user_id text NOT NULL DEFAULT '';

ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_user_id_category_key;
ALTER TABLE budgets ADD CONSTRAINT budgets_user_id_category_key UNIQUE (user_id, category);

CREATE INDEX IF NOT EXISTS idx_transactions_user_spent ON transactions (user_id, spent_at);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets (user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON savings_goals (user_id);
