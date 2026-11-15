import type { Transaction, Budget } from './types';
import { formatCurrency } from './format';
import { getCategory, CATEGORIES } from './categories';

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'tip' | 'alert';
  icon: string;
  title: string;
  body: string;
}

export interface SpendingSummary {
  total: number;
  byCategory: { category: string; total: number; pct: number }[];
  byDay: { day: string; total: number }[];
  avgPerDay: number;
  topMerchant: { name: string; total: number } | null;
  transactionCount: number;
}

const sum = (txns: Transaction[]): number => txns.reduce((a, t) => a + t.amount, 0);

export function summarize(transactions: Transaction[], monthKey: string): SpendingSummary {
  const monthTxns = transactions.filter((t) => t.spent_at.slice(0, 7) === monthKey);
  const total = sum(monthTxns);
  const totalAbs = monthTxns.reduce((a, t) => a + Math.abs(t.amount), 0) || 1;

  const catTotals = new Map<string, number>();
  for (const t of monthTxns) {
    catTotals.set(t.category, (catTotals.get(t.category) ?? 0) + t.amount);
  }
  const byCategory = [...catTotals.entries()]
    .map(([category, t]) => ({ category, total: t, pct: (t / totalAbs) * 100 }))
    .sort((a, b) => b.total - a.total);

  const dayTotals = new Map<string, number>();
  for (const t of monthTxns) {
    dayTotals.set(t.spent_at, (dayTotals.get(t.spent_at) ?? 0) + t.amount);
  }
  const byDay = [...dayTotals.entries()]
    .map(([day, t]) => ({ day, total: t }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const daysInMonth = new Date(Number(monthKey.slice(0, 4)), Number(monthKey.slice(5, 7)), 0).getDate();
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === Number(monthKey.slice(0, 4)) &&
    today.getMonth() + 1 === Number(monthKey.slice(5, 7));
  const elapsedDays = isCurrentMonth ? today.getDate() : daysInMonth;
  const avgPerDay = elapsedDays > 0 ? total / elapsedDays : 0;

  const merchantTotals = new Map<string, number>();
  for (const t of monthTxns) {
    if (t.merchant) merchantTotals.set(t.merchant, (merchantTotals.get(t.merchant) ?? 0) + t.amount);
  }
  const topMerchantEntry = [...merchantTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  const topMerchant = topMerchantEntry
    ? { name: topMerchantEntry[0], total: topMerchantEntry[1] }
    : null;

  return { total, byCategory, byDay, avgPerDay, topMerchant, transactionCount: monthTxns.length };
}

export function generateInsights(
  transactions: Transaction[],
  budgets: Budget[],
  summary: SpendingSummary,
  monthKey: string,
): Insight[] {
  const insights: Insight[] = [];
  if (transactions.length === 0) return insights;

  // Budget alerts — over / near limit
  for (const b of budgets) {
    const spent = summary.byCategory.find((c) => c.category === b.category)?.total ?? 0;
    if (b.monthly_limit <= 0) continue;
    const pct = (spent / b.monthly_limit) * 100;
    if (pct >= 100) {
      insights.push({
        id: `over-${b.category}`,
        type: 'alert',
        icon: 'alert-triangle',
        title: `Over budget on ${getCategory(b.category).label}`,
        body: `You've spent ${formatCurrency(spent)} in ${getCategory(b.category).label}, which is ${formatCurrency(spent - b.monthly_limit)} over your ${formatCurrency(b.monthly_limit)} monthly limit.`,
      });
    } else if (pct >= 80) {
      insights.push({
        id: `near-${b.category}`,
        type: 'warning',
        icon: 'gauge',
        title: `Approaching limit on ${getCategory(b.category).label}`,
        body: `You're at ${pct.toFixed(0)}% of your ${formatCurrency(b.monthly_limit)} budget for ${getCategory(b.category).label}. ${formatCurrency(b.monthly_limit - spent)} left this month.`,
      });
    } else if (pct < 50 && spent > 0) {
      insights.push({
        id: `good-${b.category}`,
        type: 'positive',
        icon: 'check-circle',
        title: `Staying lean on ${getCategory(b.category).label}`,
        body: `Only ${pct.toFixed(0)}% of your ${getCategory(b.category).label} budget used. Great discipline — you have ${formatCurrency(b.monthly_limit - spent)} to spare.`,
      });
    }
  }

  // Top category concentration
  const topCat = summary.byCategory[0];
  if (topCat && topCat.pct >= 40 && summary.total > 0) {
    insights.push({
      id: 'concentration',
      type: 'tip',
      icon: 'pie-chart',
      title: `${getCategory(topCat.category).label} dominates your spending`,
      body: `${getCategory(topCat.category).label} makes up ${topCat.pct.toFixed(0)}% of your month. If that's not essential, trimming it by 15% would save ${formatCurrency(topCat.total * 0.15)}.`,
    });
  }

  // Pace / projected spend
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === Number(monthKey.slice(0, 4)) &&
    today.getMonth() + 1 === Number(monthKey.slice(5, 7));
  if (isCurrentMonth && summary.avgPerDay > 0) {
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const projected = summary.avgPerDay * daysInMonth;
    const remaining = daysInMonth - today.getDate();
    insights.push({
      id: 'pace',
      type: projected > summary.total * 1.1 ? 'warning' : 'positive',
      icon: 'trending-up',
      title: `Spending pace: ${formatCurrency(summary.avgPerDay)}/day`,
      body: `At this rate you'll spend about ${formatCurrency(projected)} this month. You have ${remaining} days left and have spent ${formatCurrency(summary.total)} so far.`,
    });
  }

  // Top merchant loyalty
  if (summary.topMerchant && summary.topMerchant.total >= 30) {
    insights.push({
      id: 'merchant',
      type: 'tip',
      icon: 'store',
      title: `Frequent spending at ${summary.topMerchant.name}`,
      body: `You've spent ${formatCurrency(summary.topMerchant.total)} at ${summary.topMerchant.name} this month. Looking for a student discount or cheaper alternative could add up.`,
    });
  }

  // Small frequent purchases
  const smallFrequent = transactions
    .filter((t) => t.spent_at.slice(0, 7) === monthKey && t.amount > 0 && t.amount <= 10);
  if (smallFrequent.length >= 10) {
    const smallTotal = sum(smallFrequent);
    insights.push({
      id: 'small-frequent',
      type: 'tip',
      icon: 'coins',
      title: `Small purchases add up to ${formatCurrency(smallTotal)}`,
      body: `${smallFrequent.length} sub-$10 buys this month. These often slip under the radar — bundling or cutting a few could free up real cash.`,
    });
  }

  // Weekend vs weekday pattern
  const monthTxns = transactions.filter((t) => t.spent_at.slice(0, 7) === monthKey);
  const weekend = monthTxns.filter((t) => {
    const d = new Date(t.spent_at + 'T00:00:00').getDay();
    return d === 0 || d === 6;
  });
  if (weekend.length >= 5) {
    const weekendTotal = sum(weekend);
    const weekdayTotal = summary.total - weekendTotal;
    if (weekendTotal > weekdayTotal && summary.total > 0) {
      insights.push({
        id: 'weekend',
        type: 'tip',
        icon: 'calendar',
        title: 'Weekends are your spendiest days',
        body: `You spend more on weekends (${formatCurrency(weekendTotal)}) than weekdays (${formatCurrency(weekdayTotal)}). A small weekend budget could keep this in check.`,
      });
    }
  }

  // Unused categories — you have a budget but no spend
  for (const b of budgets) {
    const spent = summary.byCategory.find((c) => c.category === b.category)?.total ?? 0;
    if (spent === 0) {
      insights.push({
        id: `unused-${b.category}`,
        type: 'positive',
        icon: 'sparkles',
        title: `Zero spent on ${getCategory(b.category).label}`,
        body: `You budgeted ${formatCurrency(b.monthly_limit)} for ${getCategory(b.category).label} but haven't touched it. Either you don't need it, or the month just started.`,
      });
    }
  }

  // Most expensive single day
  if (summary.byDay.length > 0) {
    const peak = [...summary.byDay].sort((a, b) => b.total - a.total)[0];
    if (peak.total >= 50) {
      insights.push({
        id: 'peak-day',
        type: 'warning',
        icon: 'flame',
        title: `Biggest day: ${formatCurrency(peak.total)}`,
        body: `On ${new Date(peak.day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} you spent the most this month. Worth a look at what drove it.`,
      });
    }
  }

  // Sort: alerts first, then warnings, tips, positive
  const order: Record<Insight['type'], number> = { alert: 0, warning: 1, tip: 2, positive: 3 };
  return insights.sort((a, b) => order[a.type] - order[b.type]);
}

export function weeklyTrend(transactions: Transaction[], weeks = 6): { label: string; total: number }[] {
  const out: { label: string; total: number }[] = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const ref = new Date(now);
    ref.setDate(now.getDate() - i * 7);
    const start = new Date(ref);
    start.setDate(ref.getDate() - ref.getDay()); // Sunday
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startIso = start.toISOString().slice(0, 10);
    const endIso = end.toISOString().slice(0, 10);
    const total = sum(
      transactions.filter((t) => t.spent_at >= startIso && t.spent_at <= endIso),
    );
    out.push({ label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, total });
  }
  return out;
}

export function categoryTotals(
  transactions: Transaction[],
  monthKey: string,
): { category: string; total: number; color: string }[] {
  const monthTxns = transactions.filter((t) => t.spent_at.slice(0, 7) === monthKey);
  const totals = new Map<string, number>();
  for (const t of monthTxns) totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  return CATEGORIES.map((c) => ({
    category: c.name,
    total: totals.get(c.name) ?? 0,
    color: c.color,
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
}
