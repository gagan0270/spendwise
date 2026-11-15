import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { todayISO } from '@/lib/format';
import type { NewSavingsGoal, SavingsGoal } from '@/lib/types';

interface GoalModalProps {
  goal?: SavingsGoal | null;
  onSave: (goal: NewSavingsGoal, id?: string) => Promise<void>;
  onClose: () => void;
}

export function GoalModal({ goal, onSave, onClose }: GoalModalProps) {
  const [name, setName] = useState(goal?.name ?? '');
  const [target, setTarget] = useState(goal?.target_amount.toString() ?? '');
  const [saved, setSaved] = useState(goal?.saved_amount.toString() ?? '0');
  const [date, setDate] = useState(goal?.target_date ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const targetAmount = Number(target);
    const savedAmount = Number(saved);
    if (!name.trim() || !targetAmount || targetAmount <= 0 || savedAmount < 0) { setError('Add a goal name and valid amounts.'); return; }
    if (savedAmount > targetAmount) { setError('Saved amount cannot be more than the target.'); return; }
    setSaving(true); setError(null);
    try { await onSave({ name: name.trim(), target_amount: targetAmount, saved_amount: savedAmount, target_date: date || null }, goal?.id); onClose(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not save the goal.'); }
    finally { setSaving(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"><div className="w-full max-w-md rounded-t-3xl border border-slate-700 bg-slate-950 p-6 shadow-2xl sm:rounded-3xl">
    <div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-400">Savings system</p><h3 className="mt-1 font-display text-xl font-extrabold text-white">{goal ? 'Update goal' : 'Create a goal'}</h3></div><button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-800 hover:text-white"><X size={18} /></button></div>
    <form onSubmit={submit} className="space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">Goal name</span><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="New laptop, trip, emergency fund" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400" /></label>
      <div className="grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">Target (₹)</span><input type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="50000" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">Already saved (₹)</span><input type="number" min="0" value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0" className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400" /></label></div>
      <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-400">Target date <span className="font-normal text-slate-600">(optional)</span></span><input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400" /></label>
      {error && <p className="text-sm font-medium text-rose-300">{error}</p>}<div className="flex gap-3 pt-2"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-semibold text-slate-400 hover:bg-slate-900">Cancel</button><button disabled={saving} className="flex-1 rounded-xl bg-cyan-400 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50">{saving ? 'Saving…' : goal ? 'Save changes' : 'Create goal'}</button></div>
    </form></div></div>;
}
