import {
  UtensilsCrossed,
  BookOpen,
  Bus,
  Clapperboard,
  Home,
  ShoppingCart,
  HeartPulse,
  GraduationCap,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface CategoryDef {
  name: string;
  label: string;
  icon: LucideIcon;
  color: string; // hex for charts
  hint: string;
}

export const CATEGORIES: CategoryDef[] = [
  { name: 'Food', label: 'Food & Drink', icon: UtensilsCrossed, color: '#f97316', hint: 'Cafes, groceries, takeout' },
  { name: 'Books', label: 'Books & Supplies', icon: BookOpen, color: '#0ea5e9', hint: 'Textbooks, stationery' },
  { name: 'Transport', label: 'Transport', icon: Bus, color: '#10b981', hint: 'Bus, train, rideshare' },
  { name: 'Entertainment', label: 'Entertainment', icon: Clapperboard, color: '#ec4899', hint: 'Movies, games, events' },
  { name: 'Rent', label: 'Rent & Bills', icon: Home, color: '#6366f1', hint: 'Housing, utilities' },
  { name: 'Shopping', label: 'Shopping', icon: ShoppingCart, color: '#a855f7', hint: 'Clothes, gadgets' },
  { name: 'Health', label: 'Health', icon: HeartPulse, color: '#ef4444', hint: 'Pharmacy, medical' },
  { name: 'Tuition', label: 'Tuition & Fees', icon: GraduationCap, color: '#14b8a6', hint: 'Course fees, lab fees' },
  { name: 'Other', label: 'Other', icon: Sparkles, color: '#64748b', hint: 'Everything else' },
];

export const categoryMap = new Map(CATEGORIES.map((c) => [c.name, c]));

export const getCategory = (name: string): CategoryDef =>
  categoryMap.get(name) ?? CATEGORIES[CATEGORIES.length - 1];
