import { ArrowDownRight, CheckCircle2, ChevronRight, CircleDollarSign, Edit3, PiggyBank, Sparkles, Target } from 'lucide-react';
import type { SavingsGoal, UserMonthlyBudget } from '@/lib/types';
import { formatCurrency, formatMonth } from '@/lib/format';

interface MonthlyBudgetCardProps {
  monthlyBudget: UserMonthlyBudget | null;
  totalSpent: number;
  monthKey: string;
  goals: SavingsGoal[];
  onOpenSetModal: () => void;
  onRolloverSavings: () => Promise<void>;
  rolloverLoading: boolean;
}

export function MonthlyBudgetCard({
  monthlyBudget,
  totalSpent,
  monthKey,
  goals,
  onOpenSetModal,
  onRolloverSavings,
  rolloverLoading,
}: MonthlyBudgetCardProps) {
  const [year, month] = monthKey.split('-').map(Number);
  const monthName = formatMonth(year, month - 1);

  // Calculate days remaining in the month
  const today = new Date();
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const currentDay = today.getDate();
  const daysLeft = Math.max(1, totalDaysInMonth - currentDay + 1);

  // If no monthly budget set yet, show the onboarding card
  if (!monthlyBudget) {
    return (
      <div className="relative mb-6 overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-r from-cyan-950/60 via-[#0b1a2c] to-[#0d2940] p-6 shadow-xl backdrop-blur-xl animate-fade-in">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/20">
              <CircleDollarSign size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Monthly Budget Setup</span>
                <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">New Feature</span>
              </div>
              <h3 className="mt-1 font-display text-xl font-extrabold text-white">
                How much do you plan to spend in {monthName}?
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-xl leading-relaxed">
                Set a monthly budget (like ₹5,000). Every expense you log will subtract from it, and any leftover money at the end of the month will automatically become savings for your goals!
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSetModal}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-lime-300 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-300/20 hover:opacity-95 active:scale-95 transition-all shrink-0"
          >
            <Sparkles size={16} />
            <span>Set {monthName} Budget</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  // Monthly budget is set
  const budget = monthlyBudget.total_budget;
  const remaining = budget - totalSpent;
  const isOver = remaining < 0;
  const spentPct = Math.min(100, Math.max(0, (totalSpent / budget) * 100));
  const safeDailyPace = remaining > 0 ? remaining / daysLeft : 0;

  const targetGoal = goals.find((g) => g.id === monthlyBudget.target_goal_id);

  return (
    <div className="relative mb-6 overflow-hidden rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-[#0c2238] via-[#09192c] to-[#071322] p-6 shadow-xl backdrop-blur-xl animate-fade-in">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
            <CircleDollarSign size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">{monthName} Budget Balance</p>
          </div>
        </div>

        <button
          onClick={onOpenSetModal}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Edit3 size={13} />
          <span>Edit Budget</span>
        </button>
      </div>

      {/* Main Metric Spotlight */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-center">
        {/* Remaining amount display */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isOver ? 'Over Budget by' : 'Remaining to Spend'}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`font-display text-4xl sm:text-5xl font-extrabold tracking-tight ${
                isOver ? 'text-rose-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-lime-300 to-white'
              }`}
            >
              {formatCurrency(Math.abs(remaining))}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                isOver ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-lime-400/15 text-lime-300 border border-lime-400/30'
              }`}
            >
              {isOver ? 'Budget Exceeded' : 'Safe to Spend'}
            </span>
            <span className="text-slate-400">of {formatCurrency(budget)} allowance</span>
          </div>
        </div>

        {/* Deductions & Pace Breakdown */}
        <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Monthly Budget:</span>
            <span className="font-bold text-white tabular-nums">{formatCurrency(budget)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <ArrowDownRight size={13} className="text-rose-400" /> Spent so far:
            </span>
            <span className="font-bold text-rose-300 tabular-nums">-{formatCurrency(totalSpent)}</span>
          </div>
          <div className="border-t border-slate-800 pt-2 flex justify-between items-center text-xs">
            <span className="text-slate-400">Safe Daily Limit:</span>
            <span className="font-extrabold text-cyan-300 tabular-nums">
              {formatCurrency(safeDailyPace)}/day <span className="text-[10px] text-slate-500 font-normal">({daysLeft}d left)</span>
            </span>
          </div>
        </div>

        {/* Target Savings Goal & Rollover */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-lime-300 mb-1">
              <PiggyBank size={15} />
              <span>Unspent Savings Rollover</span>
            </div>
            {targetGoal ? (
              <p className="text-xs text-slate-300">
                Leftover surplus transfers to <span className="font-bold text-white">{targetGoal.name}</span>
              </p>
            ) : (
              <p className="text-xs text-slate-400">No savings goal linked yet.</p>
            )}
          </div>

          <div className="mt-4">
            {remaining > 0 && targetGoal && !monthlyBudget.rollover_completed ? (
              <button
                onClick={onRolloverSavings}
                disabled={rolloverLoading || remaining <= 0}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-lime-400/15 border border-lime-400/40 px-3 py-2 text-xs font-bold text-lime-300 hover:bg-lime-400/25 transition-all disabled:opacity-50"
              >
                <Target size={14} />
                <span>Deposit {formatCurrency(remaining)} to Goal</span>
              </button>
            ) : monthlyBudget.rollover_completed ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-lime-300 rounded-xl bg-lime-400/10 p-2 border border-lime-400/20">
                <CheckCircle2 size={14} />
                <span>Savings deposited to {targetGoal?.name || 'goal'}!</span>
              </div>
            ) : (
              <button
                onClick={onOpenSetModal}
                className="w-full flex items-center justify-center gap-1 rounded-xl border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <span>Link a savings goal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar of Budget Consumed */}
      <div className="mt-5">
        <div className="flex justify-between items-center text-[11px] font-semibold text-slate-400 mb-1.5">
          <span>{spentPct.toFixed(0)}% consumed</span>
          <span>{(100 - spentPct).toFixed(0)}% remaining</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isOver
                ? 'bg-rose-500'
                : spentPct > 80
                ? 'bg-gradient-to-r from-amber-400 to-rose-400'
                : 'bg-gradient-to-r from-cyan-400 to-lime-300'
            }`}
            style={{ width: `${spentPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
