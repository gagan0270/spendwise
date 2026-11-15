import { getCategory } from '@/lib/categories';
import { formatCurrency } from '@/lib/format';
import type { Budget } from '@/lib/types';
import { categoryTotals } from '@/lib/insights';
import type { Transaction } from '@/lib/types';

interface BudgetProgressProps {
  budgets: Budget[];
  transactions: Transaction[];
  monthKey: string;
}

export function BudgetProgress({ budgets, transactions, monthKey }: BudgetProgressProps) {
  const totals = categoryTotals(transactions, monthKey);
  const totalMap = new Map(totals.map((t) => [t.category, t.total]));

  if (budgets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center">
        <p className="text-sm font-medium text-slate-400">No budgets set yet.</p>
        <p className="text-xs text-slate-500 mt-1">Tap “Budget rules” to set monthly limits and we'll track them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {budgets.map((b) => {
        const cat = getCategory(b.category);
        const spent = totalMap.get(b.category) ?? 0;
        const pct = b.monthly_limit > 0 ? (spent / b.monthly_limit) * 100 : 0;
        const over = pct >= 100;
        const near = pct >= 80 && !over;
        const barColor = over ? '#ef4444' : near ? '#f59e0b' : cat.color;
        return (
          <div key={b.id}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <cat.icon size={14} style={{ color: cat.color }} />
                <span className="text-sm font-medium text-slate-300">{cat.label}</span>
              </div>
              <span className={`text-xs font-semibold tabular-nums ${over ? 'text-rose-300' : near ? 'text-amber-300' : 'text-slate-500'}`}>
                {formatCurrency(spent)} / {formatCurrency(b.monthly_limit)}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
