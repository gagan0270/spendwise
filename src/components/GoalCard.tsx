import { CalendarDays, ChevronRight, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { SavingsGoal } from '@/lib/types';

interface GoalCardProps {
  goal: SavingsGoal;
  onUpdate: (goal: SavingsGoal) => void;
  onDelete: (id: string) => Promise<void>;
}

export function GoalCard({ goal, onUpdate, onDelete }: GoalCardProps) {
  const percent = Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100));
  const remaining = Math.max(0, goal.target_amount - goal.saved_amount);
  return (
    <div className="group rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4 transition-all hover:border-cyan-700/80 hover:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"><Target size={19} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-2"><h4 className="truncate text-sm font-bold text-white">{goal.name}</h4><span className="text-xs font-bold text-cyan-300">{percent}%</span></div>
          <p className="mt-1 text-xs text-slate-400">{formatCurrency(goal.saved_amount)} saved <span className="text-slate-600">/</span> {formatCurrency(goal.target_amount)}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-lime-300 transition-all duration-500" style={{ width: `${percent}%` }} /></div>
          <div className="mt-2 flex items-center justify-between"><span className="text-[11px] text-slate-500">{remaining > 0 ? `${formatCurrency(remaining)} to go` : 'Goal reached'}</span>{goal.target_date && <span className="flex items-center gap-1 text-[11px] text-slate-500"><CalendarDays size={12} />{new Date(goal.target_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}</div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 border-t border-slate-800 pt-3 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button onClick={() => onUpdate(goal)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-cyan-400/10 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-400/20">Update savings <ChevronRight size={13} /></button>
        <button onClick={() => onDelete(goal.id)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-rose-400/10 hover:text-rose-300">Remove</button>
      </div>
    </div>
  );
}
