import { formatCurrency } from '@/lib/format';

interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  total: number;
}

export function DonutChart({ data, total }: DonutChartProps) {
  const size = 200;
  const stroke = 28;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const totalAbs = data.reduce((a, d) => a + d.value, 0) || 1;

  let offset = 0;
  const slices = data.map((d) => {
    const fraction = d.value / totalAbs;
    const dash = fraction * circumference;
    const slice = {
      ...d,
      dash,
      gap: circumference - dash,
      offset: -offset,
    };
    offset += dash;
    return slice;
  });

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e334d"
          strokeWidth={stroke}
        />
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset}
            strokeLinecap="butt"
            className="transition-all duration-500"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">
          {formatCurrency(total).replace('.00', '')}
        </span>
        <span className="text-xs font-medium text-slate-500">this month</span>
      </div>
    </div>
  );
}
