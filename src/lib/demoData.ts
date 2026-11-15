import type { NewBudget, NewSavingsGoal, NewTransaction } from './types';
import { supabase } from './supabase';

export function getSampleTransactions(): NewTransaction[] {
  const now = new Date();
  const getPastDate = (daysAgo: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  };

  return [
    { amount: 180, category: 'Food', description: 'Campus canteen thali & chai', merchant: 'Central Canteen', spent_at: getPastDate(0) },
    { amount: 350, category: 'Books', description: 'Algorithms & Data Structures notebook + pens', merchant: 'University Bookstore', spent_at: getPastDate(1) },
    { amount: 85, category: 'Transport', description: 'Campus metro card recharge', merchant: 'Delhi Metro', spent_at: getPastDate(2) },
    { amount: 499, category: 'Entertainment', description: 'Monthly student Netflix + Spotify bundle', merchant: 'Streaming Services', spent_at: getPastDate(3) },
    { amount: 620, category: 'Food', description: 'Weekend pizza party with roommates', merchant: "Domino's Pizza", spent_at: getPastDate(4) },
    { amount: 2200, category: 'Books', description: 'Operating Systems standard reference textbook', merchant: 'Amazon India', spent_at: getPastDate(6) },
    { amount: 150, category: 'Food', description: 'Late night library coffee & muffins', merchant: 'Blue Tokai', spent_at: getPastDate(7) },
    { amount: 120, category: 'Transport', description: 'Auto ride to robotics lab seminar', merchant: 'Uber Auto', spent_at: getPastDate(8) },
    { amount: 8500, category: 'Rent', description: 'Hostel room monthly rent share', merchant: 'Student Housing Society', spent_at: getPastDate(10) },
    { amount: 450, category: 'Health', description: 'Vitamins & sports recovery drink', merchant: 'Apollo Pharmacy', spent_at: getPastDate(12) },
    { amount: 240, category: 'Food', description: 'South Indian breakfast at Anna canteen', merchant: 'Campus Mess 2', spent_at: getPastDate(13) },
    { amount: 1200, category: 'Shopping', description: 'Ergonomic study desk lamp & mousepad', merchant: 'IKEA', spent_at: getPastDate(15) },
    { amount: 160, category: 'Transport', description: 'Shared cab to inter-college hackathon', merchant: 'Ola Cabs', spent_at: getPastDate(18) },
    { amount: 380, category: 'Entertainment', description: 'IMAX movie ticket - Sci-Fi Friday', merchant: 'PVR Cinemas', spent_at: getPastDate(20) },
    { amount: 550, category: 'Food', description: 'Groceries & hostel snacks stockpile', merchant: 'Blinkit', spent_at: getPastDate(22) },
    { amount: 1500, category: 'Tuition', description: 'Cloud Computing certification exam fee', merchant: 'AWS Academy', spent_at: getPastDate(25) },
    { amount: 320, category: 'Food', description: 'Cold brews during midterm study week', merchant: 'Third Wave Coffee', spent_at: getPastDate(28) },
    { amount: 210, category: 'Transport', description: 'Bus pass renewal for next semester', merchant: 'City Transit', spent_at: getPastDate(32) },
    { amount: 890, category: 'Entertainment', description: 'Gaming tournament team registration', merchant: 'Steam', spent_at: getPastDate(35) },
    { amount: 420, category: 'Food', description: 'Shawarma & mocktails with study group', merchant: 'Campus Food Court', spent_at: getPastDate(42) },
    { amount: 650, category: 'Books', description: 'Engineering mathematics solved papers', merchant: 'Standard Book Co', spent_at: getPastDate(48) },
    { amount: 140, category: 'Food', description: 'Cold coffee & toasted sandwich', merchant: 'Cafe Coffee Day', spent_at: getPastDate(55) },
  ];
}

export function getSampleBudgets(): NewBudget[] {
  return [
    { category: 'Food', monthly_limit: 4500 },
    { category: 'Books', monthly_limit: 2500 },
    { category: 'Transport', monthly_limit: 1200 },
    { category: 'Entertainment', monthly_limit: 1800 },
    { category: 'Rent', monthly_limit: 9000 },
    { category: 'Shopping', monthly_limit: 2000 },
  ];
}

export function getSampleGoals(): NewSavingsGoal[] {
  const getFutureDate = (daysAhead: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().slice(0, 10);
  };

  return [
    {
      name: 'MacBook Air M3 for Coding',
      target_amount: 89900,
      saved_amount: 54000,
      target_date: getFutureDate(120),
    },
    {
      name: 'Semester Goa Trip with Batchmates',
      target_amount: 15000,
      saved_amount: 9800,
      target_date: getFutureDate(45),
    },
    {
      name: 'Hostel Emergency Rainy-Day Buffer',
      target_amount: 20000,
      saved_amount: 16500,
      target_date: null,
    },
  ];
}

export async function seedDemoDataIfEmpty(): Promise<boolean> {
  try {
    const { count } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
    if (count && count > 0) {
      return false; // Data already exists
    }

    // Insert sample data
    const txns = getSampleTransactions();
    const budgets = getSampleBudgets();
    const goals = getSampleGoals();

    await Promise.all([
      supabase.from('transactions').insert(txns),
      supabase.from('budgets').upsert(budgets, { onConflict: 'category' }),
      supabase.from('savings_goals').insert(goals),
    ]);

    return true;
  } catch (err) {
    console.warn('Could not auto-seed demo data in Supabase:', err);
    return false;
  }
}

export async function forceReseedDemoData(): Promise<void> {
  // Clear existing
  await Promise.all([
    supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('budgets').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
    supabase.from('savings_goals').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
  ]);

  // Insert fresh samples
  await Promise.all([
    supabase.from('transactions').insert(getSampleTransactions()),
    supabase.from('budgets').upsert(getSampleBudgets(), { onConflict: 'category' }),
    supabase.from('savings_goals').insert(getSampleGoals()),
  ]);
}
