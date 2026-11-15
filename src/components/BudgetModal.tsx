import { useState, type FormEvent } from 'react';
import { X, Trash2 } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { formatCurrency } from '@/lib/format';
import type { Budget, NewBudget } from '@/lib/types';

interface BudgetModalProps {
  budgets: Budget[];
  onSave: (b: NewBudget) => Promise<void>;
  onDelete: (category: string) => Promise<void>;
  onClose: () => void;
}

export function BudgetModal({ budgets, onSave, onDelete, onClose }: BudgetModalProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const b of budgets) map[b.category] = b.monthly_limit.toString();
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      for (const c of CATEGORIES) {
        const val = drafts[c.name];
        if (val && parseFloat(val) > 0) {
          await onSave({ category: c.name, monthly_limit: Math.round(parseFloat(val) * 100) / 100 });
        }
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save budgets.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:items-center sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-t-3xl bg-white sm:rounded-3xl shadow-2xl animate-slide-up max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Monthly budgets</h3>
            <p className="text-xs text-slate-500">Set a per-category limit. We'll track against them.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={save} className="px-6 py-5 space-y-3 overflow-y-auto">
          {CATEGORIES.map((c) => {
            const existing = budgets.find((b) => b.category === c.name);
            return (
              <div key={c.name} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${c.color}1a` }}>
                  <c.icon size={18} style={{ color: c.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{c.label}</p>
                  <p className="text-xs text-slate-400 truncate">{c.hint}</p>
                </div>
                <div className="relative w-28">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="1"
                    min="0"
                    value={drafts[c.name] ?? ''}
                    onChange={(e) => setDrafts({ ...drafts, [c.name]: e.target.value })}
                    placeholder="—"
                    className="w-full rounded-lg border border-slate-200 pl-6 pr-2 py-2 text-sm font-medium text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
                  />
                </div>
                {existing && (
                  <button
                    type="button"
                    onClick={() => {
                      setDrafts({ ...drafts, [c.name]: '' });
                      onDelete(c.name);
                    }}
                    className="rounded-lg p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                    title={`Remove ${c.label} budget`}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-white">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save budgets'}
            </button>
          </div>
        </form>
        {budgets.length > 0 && (
          <div className="px-6 pb-4 border-t border-slate-100 pt-3 shrink-0">
            <p className="text-xs text-slate-400">
              Total budgeted: <span className="font-semibold text-slate-600">
                {formatCurrency(budgets.reduce((a, b) => a + b.monthly_limit, 0))}
              </span>/mo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
