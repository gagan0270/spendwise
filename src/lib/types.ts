export interface Transaction {
  id: string;
  user_id?: string;
  amount: number;
  category: string;
  description: string;
  merchant: string | null;
  spent_at: string; // ISO date yyyy-mm-dd
  created_at: string;
}

export interface Budget {
  id: string;
  user_id?: string;
  category: string;
  monthly_limit: number;
  created_at: string;
}

export type NewTransaction = {
  user_id?: string;
  amount: number;
  category: string;
  description: string;
  merchant?: string | null;
  spent_at: string;
};

export type NewBudget = {
  user_id?: string;
  category: string;
  monthly_limit: number;
};

export interface SavingsGoal {
  id: string;
  user_id?: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  created_at: string;
}

export type NewSavingsGoal = {
  user_id?: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  target_date?: string | null;
};
