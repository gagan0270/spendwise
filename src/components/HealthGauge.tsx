import { ShieldCheck } from 'lucide-react';

interface HealthGaugeProps {
  score: number;
}

export function HealthGauge({ score }: HealthGaugeProps) {
  const radius = 62;
  const circumference = Math.PI * radius;
  const progress = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'On track' : score >= 40 ? 'Needs attention' : 'Start small';
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#38bdf8' : score >= 40 ? '#fbbf24' : '#fb7185';

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="112" viewBox="0 0 180 112" className="overflow-visible">
        <path d="M 28 92 A 62 62 0 0 1 152 92" fill="none" stroke="#23324b" strokeWidth="14" strokeLinecap="round" />
        <path d="M 28 92 A 62 62 0 0 1 152 92" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${progress} ${circumference}`} className="transition-all duration-700" />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={15} style={{ color }} />
          <span className="font-display text-3xl font-extrabold text-white">{score}</span>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}
