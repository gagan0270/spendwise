export const formatCurrency = (value: number, opts?: { sign?: boolean }): string => {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  if (opts?.sign) {
    return value < 0 ? `-${formatted}` : `+${formatted}`;
  }
  return value < 0 ? `-${formatted}` : formatted;
};

export const formatShortDate = (iso: string): string =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export const formatMonth = (year: number, month: number): string =>
  new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

export const todayISO = (): string => {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

export const monthKey = (iso: string): string => iso.slice(0, 7);

export const currentMonthKey = (): string => todayISO().slice(0, 7);
