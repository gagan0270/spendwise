import {
  AlertTriangle,
  Gauge,
  CheckCircle2,
  PieChart,
  TrendingUp,
  Store,
  Coins,
  Calendar,
  Flame,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { Insight } from '@/lib/insights';

const iconMap: Record<string, LucideIcon> = {
  'alert-triangle': AlertTriangle,
  gauge: Gauge,
  'check-circle': CheckCircle2,
  'pie-chart': PieChart,
  'trending-up': TrendingUp,
  store: Store,
  coins: Coins,
  calendar: Calendar,
  flame: Flame,
  sparkles: Sparkles,
};

const styleMap: Record<Insight['type'], { bg: string; border: string; text: string; icon: string }> = {
  alert: { bg: 'bg-rose-400/10', border: 'border-rose-400/25', text: 'text-rose-100', icon: 'text-rose-300' },
  warning: { bg: 'bg-amber-300/10', border: 'border-amber-300/25', text: 'text-amber-100', icon: 'text-amber-300' },
  tip: { bg: 'bg-cyan-300/10', border: 'border-cyan-300/25', text: 'text-cyan-50', icon: 'text-cyan-300' },
  positive: { bg: 'bg-lime-300/10', border: 'border-lime-300/25', text: 'text-lime-50', icon: 'text-lime-300' },
};

export function InsightCard({ insight }: { insight: Insight }) {
  const Icon = iconMap[insight.icon] ?? Sparkles;
  const s = styleMap[insight.type];
  return (
    <div className={`flex gap-3 rounded-2xl border ${s.border} ${s.bg} p-4 transition-transform hover:scale-[1.01]`}>
      <div className={`mt-0.5 shrink-0 ${s.icon}`}>
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <h4 className={`font-semibold text-sm ${s.text}`}>{insight.title}</h4>
        <p className={`mt-0.5 text-sm leading-relaxed ${s.text} opacity-80`}>{insight.body}</p>
      </div>
    </div>
  );
}
