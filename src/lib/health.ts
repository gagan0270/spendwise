import type { Budget, SavingsGoal, Transaction } from './types';
import type { SpendingSummary } from './insights';

export function calculateHealthScore(summary: SpendingSummary, budgets: Budget[], goals: SavingsGoal[]): number {
  if (summary.transactionCount === 0) return 72;
  let score = 68;
  const budgeted = budgets.length;
  const healthyBudgetCount = budgets.filter((budget) => {
    const spent = summary.byCategory.find((item) => item.category === budget.category)?.total ?? 0;
    return spent <= budget.monthly_limit;
  }).length;
  if (budgeted > 0) score += Math.round((healthyBudgetCount / budgeted) * 18) - 9;
  const top = summary.byCategory[0];
  if (top?.pct >= 55) score -= 10;
  else if (top?.pct <= 35) score += 6;
  if (summary.avgPerDay > 0) score += Math.min(8, Math.round(summary.transactionCount / 6));
  if (goals.length > 0) score += Math.min(8, goals.filter((goal) => goal.saved_amount > 0).length * 2);
  return Math.max(25, Math.min(98, score));
}

export function getDailyTotals(transactions: Transaction[], days: number): { date: string; total: number }[] {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));
    const iso = date.toISOString().slice(0, 10);
    return { date: iso, total: transactions.filter((t) => t.spent_at === iso).reduce((sum, t) => sum + t.amount, 0) };
  });
}
