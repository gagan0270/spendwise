import { useState, type FormEvent } from 'react';
import { Bot, Camera, Check, CornerDownLeft, Loader2, Lock, Sparkles } from 'lucide-react';
import { parseNaturalLanguageExpense } from '@/lib/nlpParser';
import type { NewTransaction } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface QuickExpenseBarProps {
  onAddTransaction: (entry: NewTransaction) => Promise<void>;
  hasMonthlyBudget: boolean;
  onRequireBudget: () => void;
  onOpenAiCoach?: () => void;
}

export function QuickExpenseBar({
  onAddTransaction,
  hasMonthlyBudget,
  onRequireBudget,
  onOpenAiCoach,
}: QuickExpenseBarProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!hasMonthlyBudget) {
      onRequireBudget();
      return;
    }

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

  const handleInputFocus = () => {
    if (!hasMonthlyBudget) {
      onRequireBudget();
    }
  };

  return (
    <div className="relative mb-6 rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-[#0b1a2c] p-3 sm:p-4 shadow-lg backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-cyan-300 pl-1 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
            {hasMonthlyBudget ? <Bot size={16} /> : <Lock size={15} className="text-amber-400" />}
          </div>
          <span className="text-xs font-bold uppercase tracking-wider hidden md:inline">
            {hasMonthlyBudget ? 'AI Quick Log:' : 'Step 1:'}
          </span>
        </div>

        <div className="relative flex-1 w-full" onClick={() => !hasMonthlyBudget && onRequireBudget()}>
          <input
            type="text"
            value={text}
            readOnly={!hasMonthlyBudget}
            onFocus={handleInputFocus}
            onChange={(e) => { setText(e.target.value); setError(null); }}
            placeholder={
              hasMonthlyBudget
                ? 'Try typing: "Campus coffee 120" or "Metro card recharge 200" or "Hostel rent 8000"'
                : '🔒 Click here to set your monthly budget first...'
            }
            className={`w-full rounded-xl border px-4 py-2.5 text-xs sm:text-sm text-white outline-none transition-all pr-10 ${
              hasMonthlyBudget
                ? 'border-slate-700/80 bg-slate-950/70 placeholder-slate-500 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 cursor-text'
                : 'border-amber-400/30 bg-amber-950/20 placeholder-amber-200/60 cursor-pointer hover:border-amber-400/50'
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hidden sm:block">
            <CornerDownLeft size={14} />
          </div>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2 shrink-0">
          <button
            type="submit"
            disabled={submitting}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all active:scale-95 shadow-md shrink-0 ${
              hasMonthlyBudget
                ? 'bg-cyan-300 text-slate-950 hover:bg-cyan-200 shadow-cyan-300/10'
                : 'bg-amber-300 text-slate-950 hover:bg-amber-200 shadow-amber-300/10'
            }`}
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : hasMonthlyBudget ? (
              <>
                <Sparkles size={14} />
                <span>Quick Log</span>
              </>
            ) : (
              <>
                <Lock size={14} />
                <span>Set Budget First</span>
              </>
            )}
          </button>

          {onOpenAiCoach && (
            <button
              type="button"
              onClick={onOpenAiCoach}
              title="Upload UPI screenshot or ask Spendwise AI Coach"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3.5 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-300 transition-all shrink-0 active:scale-95 shadow-sm"
            >
              <Camera size={14} />
              <span className="hidden sm:inline">Scan Receipt / AI</span>
            </button>
          )}
        </div>
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
