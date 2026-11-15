import { getCategory } from '@/lib/categories';
import { formatShortDate, formatCurrency } from '@/lib/format';
import type { Transaction } from '@/lib/types';
import { Trash2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<void>;
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const sorted = [...transactions].sort((a, b) => b.spent_at.localeCompare(a.spent_at) || b.created_at.localeCompare(a.created_at));

  return (
    <ul className="divide-y divide-slate-800">
      {sorted.map((t) => {
        const cat = getCategory(t.category);
        return (
          <li key={t.id} className="group flex items-center gap-3 py-3 transition-colors hover:bg-slate-800/40 -mx-2 px-2 rounded-lg">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${cat.color}1a` }}>
              <cat.icon size={18} style={{ color: cat.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">{t.description}</p>
              <p className="text-xs text-slate-400 truncate">
                {cat.label}
                {t.merchant ? ` · ${t.merchant}` : ''} · {formatShortDate(t.spent_at)}
              </p>
            </div>
            <span className="text-sm font-bold text-slate-100 tabular-nums">{formatCurrency(t.amount)}</span>
            <button
              onClick={() => onDelete(t.id)}
              className="ml-1 rounded-lg p-1.5 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
