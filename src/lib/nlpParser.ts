import { todayISO } from './format';
import type { NewTransaction } from './types';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ['canteen', 'food', 'pizza', 'burger', 'coffee', 'chai', 'tea', 'cafe', 'swiggy', 'zomato', 'blinkit', 'dinner', 'lunch', 'breakfast', 'snack', 'restaurant', 'meal', 'mess', 'groceries', 'drink', 'subway', 'mcdonalds', 'starbucks', 'biryani'],
  Books: ['book', 'textbook', 'notes', 'stationery', 'pen', 'notebook', 'xerox', 'print', 'photocopy', 'supplies', 'paper', 'binder', 'amazon', 'library'],
  Transport: ['metro', 'bus', 'uber', 'ola', 'auto', 'train', 'flight', 'cab', 'transit', 'ticket', 'petrol', 'fuel', 'rapido', 'rickshaw'],
  Entertainment: ['netflix', 'spotify', 'movie', 'cinema', 'game', 'gaming', 'steam', 'party', 'concert', 'event', 'youtube', 'pvr', 'prime'],
  Rent: ['rent', 'hostel', 'pg', 'room', 'flat', 'apartment', 'electricity', 'water', 'wifi', 'utility', 'maintenance'],
  Shopping: ['shopping', 'clothes', 'shoes', 'myntra', 'zara', 'h&m', 'flipkart', 'gadget', 'headphones', 'keyboard', 'mouse', 'ikea'],
  Health: ['pharmacy', 'medicine', 'meds', 'doctor', 'clinic', 'hospital', 'dental', 'gym', 'workout', 'protein', 'vitamins', 'apollo'],
  Tuition: ['tuition', 'fee', 'fees', 'exam', 'college', 'course', 'coursera', 'udemy', 'certification', 'admission', 'semester'],
};

export function parseNaturalLanguageExpense(input: string): NewTransaction | null {
  const text = input.trim();
  if (!text) return null;

  // Match numbers (allowing commas and decimals, e.g. 450, 450.50, ₹500, 1,200)
  const numberRegex = /(?:₹|\$|rs\.?|inr)?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i;
  const match = text.match(numberRegex);
  if (!match) return null;

  const rawAmountStr = match[1].replace(/,/g, '');
  const amount = parseFloat(rawAmountStr);
  if (isNaN(amount) || amount <= 0) return null;

  // Text without the matched amount part
  const cleanDescription = text
    .replace(match[0], '')
    .replace(/^(paid|spent|bought|for|at|to)\s+/i, '')
    .trim() || 'Expense';

  // Detect category from description keywords
  const lower = text.toLowerCase();
  let detectedCategory = 'Other';

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      detectedCategory = cat;
      break;
    }
  }

  // Capitalize description nicely
  const capitalizedDesc = cleanDescription.charAt(0).toUpperCase() + cleanDescription.slice(1);

  return {
    amount,
    category: detectedCategory,
    description: capitalizedDesc,
    merchant: null,
    spent_at: todayISO(),
  };
}
