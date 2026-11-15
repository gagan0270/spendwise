import type { Transaction } from './types';

export function exportTransactionsToCsv(transactions: Transaction[]): void {
  const headers = ['Date', 'Description', 'Category', 'Merchant', 'Amount (INR)'];
  const rows = transactions.map((t) => [
    t.spent_at,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.merchant || '').replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `spendwise-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
