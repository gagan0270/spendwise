import { useState, type FormEvent } from 'react';
import { Bot, Check, CornerDownLeft, Loader2, Sparkles } from 'lucide-react';
import { parseNaturalLanguageExpense } from '@/lib/nlpParser';
import type { NewTransaction } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface QuickExpenseBarProps {
  onAddTransaction: (entry: NewTransaction) => Promise<void>;
}

export function QuickExpenseBar({ onAddTransaction }: QuickExpenseBarProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const parsed = parseNaturalLanguageExpense(text);
    if (!parsed) {
      setError('Please include an amount, e.g. "Canteen lunch 150" or "Textbook 800"');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onAddTransaction(parsed);
      setLastAdded(`Logged ${parsed.description} (${formatCurrency(parsed.amount)}) under ${parsed.category}`);
      setText('');
      setTimeout(() => setLastAdded(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log expense.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative mb-6 rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-[#0b1a2c] p-3 sm:p-4 shadow-lg backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-cyan-300 pl-1 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
            <Bot size={16} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">AI Quick Log:</span>
        </div>

        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={text}
            onChange={(e) => { setText(e.target.value); setError(null); }}
            placeholder='Try typing: "Campus coffee 120" or "Metro card recharge 200" or "Hostel rent 8000"'
            className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all pr-10"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hidden sm:block">
            <CornerDownLeft size={14} />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-extrabold text-slate-950 transition-all hover:bg-cyan-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-cyan-300/10 shrink-0"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          <span>Quick Log</span>
        </button>
      </form>

      {lastAdded && (
        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-lime-300 animate-fade-in pl-1">
          <Check size={14} />
          <span>{lastAdded}</span>
        </div>
      )}

      {error && (
        <div className="mt-2.5 text-xs font-medium text-amber-300 animate-fade-in pl-1">
          {error}
        </div>
      )}
    </div>
  );
}
