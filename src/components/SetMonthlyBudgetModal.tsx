import { useState, type FormEvent } from 'react';
import { CircleDollarSign, Sparkles, Target, Trash2, X } from 'lucide-react';
import type { SavingsGoal, UserMonthlyBudget } from '@/lib/types';
import { formatCurrency, formatMonth } from '@/lib/format';

interface SetMonthlyBudgetModalProps {
  currentBudget?: UserMonthlyBudget | null;
  goals: SavingsGoal[];
  monthKey: string;
  onSave: (amount: number, targetGoalId: string | null) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const PRESET_AMOUNTS = [3000, 5000, 8000, 10000, 15000];

export function SetMonthlyBudgetModal({
  currentBudget,
  goals,
  monthKey,
  onSave,
  onDelete,
  onClose,
}: SetMonthlyBudgetModalProps) {
  const [amount, setAmount] = useState(currentBudget ? currentBudget.total_budget.toString() : '5000');
  const [targetGoalId, setTargetGoalId] = useState<string>(currentBudget?.target_goal_id ?? (goals[0]?.id || ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [year, month] = monthKey.split('-').map(Number);
  const monthName = formatMonth(year, month - 1);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid monthly budget greater than zero.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(Math.round(parsed * 100) / 100, targetGoalId || null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save monthly budget.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-t-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
              <CircleDollarSign size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Monthly Allowance</p>
              <h3 className="mt-0.5 font-display text-xl font-extrabold text-white">
                {currentBudget ? `Update ${monthName} Budget` : `Set ${monthName} Budget`}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Set your total spending budget for this month. Every expense you log will subtract from this balance in real time, and any leftover money will become savings for your goals!
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Total Spending Budget (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(null); }}
                placeholder="5000"
                autoFocus
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-9 pr-4 py-3 text-lg font-bold text-white placeholder-slate-600 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
              />
            </div>

            {/* Quick preset chips */}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => { setAmount(preset.toString()); setError(null); }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                    amount === preset.toString()
                      ? 'bg-cyan-300 text-slate-950 font-bold shadow-sm'
                      : 'border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {formatCurrency(preset).replace('.00', '')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1.5">
              <Target size={14} className="text-lime-300" />
              <span>Target Savings Goal for Unspent Money</span>
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Any rupees left unspent at the end of the month will be credited to this goal.
            </p>

            {goals.length > 0 ? (
              <select
                value={targetGoalId}
                onChange={(e) => setTargetGoalId(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-200 outline-none focus:border-cyan-400"
              >
                <option value="">None (Just track unspent balance)</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — Target: {formatCurrency(g.target_amount)} (Saved: {formatCurrency(g.saved_amount)})
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400 flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400 shrink-0" />
                <span>You don't have any savings goals yet. You can create one in the Goals tab!</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {currentBudget && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onDelete();
                    onClose();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Could not delete budget.');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition-colors"
                title="Remove monthly budget"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 py-3 text-xs font-bold text-slate-400 hover:bg-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-gradient-to-r from-cyan-300 to-lime-300 py-3 text-xs font-extrabold text-slate-950 hover:opacity-95 disabled:opacity-50 shadow-lg shadow-cyan-300/10 transition-all"
            >
              {saving ? 'Saving…' : currentBudget ? 'Update Budget' : 'Set Monthly Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
