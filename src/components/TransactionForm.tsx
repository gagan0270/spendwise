import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { todayISO } from '@/lib/format';
import type { NewTransaction } from '@/lib/types';

interface TransactionFormProps {
  onSubmit: (t: NewTransaction) => Promise<void>;
  onClose: () => void;
  initial?: Partial<NewTransaction>;
  submitLabel?: string;
}

export function TransactionForm({ onSubmit, onClose, initial, submitLabel = 'Add expense' }: TransactionFormProps) {
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'Food');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [merchant, setMerchant] = useState(initial?.merchant ?? '');
  const [spentAt, setSpentAt] = useState(initial?.spent_at ?? todayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('Enter an amount greater than zero.');
      return;
    }
    if (!description.trim()) {
      setError('Add a short description.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        amount: Math.round(amt * 100) / 100,
        category,
        description: description.trim(),
        merchant: merchant.trim() || null,
        spent_at: spentAt,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:items-center sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-t-3xl bg-white sm:rounded-3xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Add expense</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-3 text-lg font-semibold text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => {
                const active = category === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setCategory(c.name)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-all ${
                      active
                        ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-100'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <c.icon size={20} style={{ color: c.color }} />
                    <span className={`text-[11px] font-medium ${active ? 'text-sky-700' : 'text-slate-600'}`}>
                      {c.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Lunch at campus cafe"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Merchant</label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Date</label>
              <input
                type="date"
                value={spentAt}
                max={todayISO()}
                onChange={(e) => setSpentAt(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 outline-none transition-all"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
