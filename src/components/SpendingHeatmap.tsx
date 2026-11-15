import { formatCurrency } from '@/lib/format';
import type { Transaction } from '@/lib/types';

interface SpendingHeatmapProps {
  transactions: Transaction[];
}

export function SpendingHeatmap({ transactions }: SpendingHeatmapProps) {
  const today = new Date();
  const cells = Array.from({ length: 84 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (83 - index));
    const iso = date.toISOString().slice(0, 10);
    const total = transactions.filter((t) => t.spent_at === iso).reduce((sum, t) => sum + t.amount, 0);
    return { iso, total, label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) };
  });
  const max = Math.max(...cells.map((c) => c.total), 1);
  const monthLabels = cells.reduce<{ label: string; index: number }[]>((labels, cell, index) => {
    const label = new Date(cell.iso + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' });
    if (!labels.some((item) => item.label === label)) labels.push({ label, index });
    return labels;
  }, []);

  return (
    <div>
      <div className="relative overflow-x-auto pb-1">
        <div className="mb-2 ml-7 flex min-w-[560px] text-[10px] font-medium text-slate-500">
          {monthLabels.map((month) => <span key={month.label} style={{ marginLeft: month.index === 0 ? 0 : `${Math.max((month.index - 1) * 9.7, 0)}px` }}>{month.label}</span>)}
        </div>
        <div className="flex min-w-[560px] gap-1">
          <div className="flex w-6 shrink-0 flex-col justify-between py-0.5 text-[9px] text-slate-500">
            <span>Mon</span><span>Wed</span><span>Fri</span>
          </div>
          <div className="grid grid-flow-col grid-rows-7 gap-1">
            {cells.map((cell) => {
              const intensity = cell.total === 0 ? 0 : Math.max(1, Math.ceil((cell.total / max) * 4));
              return (
                <div key={cell.iso} title={`${cell.label}: ${formatCurrency(cell.total)}`} className={`h-3 w-3 rounded-[3px] transition-transform hover:scale-125 ${['bg-slate-800', 'bg-cyan-950', 'bg-cyan-800', 'bg-cyan-500', 'bg-lime-400'][intensity]}`} />
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
        <span>Less</span><span className="h-3 w-3 rounded-[3px] bg-slate-800" /><span className="h-3 w-3 rounded-[3px] bg-cyan-800" /><span className="h-3 w-3 rounded-[3px] bg-cyan-500" /><span className="h-3 w-3 rounded-[3px] bg-lime-400" /><span>More</span>
      </div>
    </div>
  );
}
