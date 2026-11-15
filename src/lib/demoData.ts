import type { NewBudget, NewSavingsGoal, NewTransaction } from './types';
import { supabase } from './supabase';

export function getSampleTransactions(userId: string): (NewTransaction & { user_id: string })[] {
  const now = new Date();
  const getPastDate = (daysAgo: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  };

  return [
    { user_id: userId, amount: 180, category: 'Food', description: 'Campus canteen thali & chai', merchant: 'Central Canteen', spent_at: getPastDate(0) },
    { user_id: userId, amount: 350, category: 'Books', description: 'Algorithms & Data Structures notebook + pens', merchant: 'University Bookstore', spent_at: getPastDate(1) },
    { user_id: userId, amount: 85, category: 'Transport', description: 'Campus metro card recharge', merchant: 'Delhi Metro', spent_at: getPastDate(2) },
    { user_id: userId, amount: 499, category: 'Entertainment', description: 'Monthly student Netflix + Spotify bundle', merchant: 'Streaming Services', spent_at: getPastDate(3) },
    { user_id: userId, amount: 620, category: 'Food', description: 'Weekend pizza party with roommates', merchant: "Domino's Pizza", spent_at: getPastDate(4) },
    { user_id: userId, amount: 2200, category: 'Books', description: 'Operating Systems standard reference textbook', merchant: 'Amazon India', spent_at: getPastDate(6) },
    { user_id: userId, amount: 150, category: 'Food', description: 'Late night library coffee & muffins', merchant: 'Blue Tokai', spent_at: getPastDate(7) },
    { user_id: userId, amount: 120, category: 'Transport', description: 'Auto ride to robotics lab seminar', merchant: 'Uber Auto', spent_at: getPastDate(8) },
    { user_id: userId, amount: 8500, category: 'Rent', description: 'Hostel room monthly rent share', merchant: 'Student Housing Society', spent_at: getPastDate(10) },
    { user_id: userId, amount: 450, category: 'Health', description: 'Vitamins & sports recovery drink', merchant: 'Apollo Pharmacy', spent_at: getPastDate(12) },
    { user_id: userId, amount: 240, category: 'Food', description: 'South Indian breakfast at Anna canteen', merchant: 'Campus Mess 2', spent_at: getPastDate(13) },
    { user_id: userId, amount: 1200, category: 'Shopping', description: 'Ergonomic study desk lamp & mousepad', merchant: 'IKEA', spent_at: getPastDate(15) },
    { user_id: userId, amount: 160, category: 'Transport', description: 'Shared cab to inter-college hackathon', merchant: 'Ola Cabs', spent_at: getPastDate(18) },
    { user_id: userId, amount: 380, category: 'Entertainment', description: 'IMAX movie ticket - Sci-Fi Friday', merchant: 'PVR Cinemas', spent_at: getPastDate(20) },
    { user_id: userId, amount: 550, category: 'Food', description: 'Groceries & hostel snacks stockpile', merchant: 'Blinkit', spent_at: getPastDate(22) },
    { user_id: userId, amount: 1500, category: 'Tuition', description: 'Cloud Computing certification exam fee', merchant: 'AWS Academy', spent_at: getPastDate(25) },
  ];
}

export function getSampleBudgets(userId: string): (NewBudget & { user_id: string })[] {
  return [
    { user_id: userId, category: 'Food', monthly_limit: 4500 },
    { user_id: userId, category: 'Books', monthly_limit: 2500 },
    { user_id: userId, category: 'Transport', monthly_limit: 1200 },
    { user_id: userId, category: 'Entertainment', monthly_limit: 1800 },
    { user_id: userId, category: 'Rent', monthly_limit: 9000 },
    { user_id: userId, category: 'Shopping', monthly_limit: 2000 },
  ];
}

export function getSampleGoals(userId: string): (NewSavingsGoal & { user_id: string })[] {
  const getFutureDate = (daysAhead: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().slice(0, 10);
  };

  return [
    {
      user_id: userId,
      name: 'MacBook Air M3 for Coding',
      target_amount: 89900,
      saved_amount: 54000,
      target_date: getFutureDate(120),
    },
    {
      user_id: userId,
      name: 'Semester Goa Trip with Batchmates',
      target_amount: 15000,
      saved_amount: 9800,
      target_date: getFutureDate(45),
    },
    {
      user_id: userId,
      name: 'Hostel Emergency Rainy-Day Buffer',
      target_amount: 20000,
      saved_amount: 16500,
      target_date: null,
    },
  ];
}

export async function populateSampleDataForUser(userId: string): Promise<void> {
  const txns = getSampleTransactions(userId);
  const budgets = getSampleBudgets(userId);
  const goals = getSampleGoals(userId);

  await Promise.all([
    supabase.from('transactions').insert(txns),
    supabase.from('budgets').upsert(budgets, { onConflict: 'user_id,category' }),
    supabase.from('savings_goals').insert(goals),
  ]);
}

export async function resetUserDataToZero(userId: string): Promise<void> {
  await Promise.all([
    supabase.from('transactions').delete().eq('user_id', userId),
    supabase.from('budgets').delete().eq('user_id', userId),
    supabase.from('savings_goals').delete().eq('user_id', userId),
  ]);
}
