import { formatCurrency } from '@/lib/format';

interface BarChartProps {
  data: { label: string; total: number }[];
  color?: string;
  height?: number;
}

export function BarChart({ data, color = '#0ea5e9', height = 140 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.total / max) * (height - 24);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className="w-full max-w-[28px] rounded-t-md transition-all duration-500 ease-out hover:opacity-80"
                style={{ height: `${Math.max(h, 2)}px`, backgroundColor: color }}
                title={`${d.label}: ${formatCurrency(d.total)}`}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-400 truncate w-full text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
