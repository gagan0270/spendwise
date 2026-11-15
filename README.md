# Spendwise — Student Financial Intelligence & AI Coach 🎓💰

Spendwise is an AI-powered financial management web application built specifically for students. It helps college and university students track daily expenses, monitor category budgets, achieve savings goals, and gain actionable insights into their spending habits in Indian Rupees (₹).

![Spendwise Preview](https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1200)

---

## ✨ Features

- 🚀 **Instant 1-Click Demo Mode**: Test all charts, AI insights, budgets, and savings goals immediately with pre-populated student finances — no sign-up or credit card required.
- 🤖 **AI Natural Language Quick-Logger**: Log expenses in conversational English (e.g., `"Campus canteen thali 150"` or `"Metro card recharge 200"`) with automatic category deduction and currency extraction.
- 📊 **Visual Analytics**:
  - **12-Week Cadence Heatmap**: GitHub-style daily spending activity grid.
  - **6-Week Spending Rhythm**: Bar chart visualizing weekly spending momentum.
  - **Category Mix**: Interactive donut chart breaking down your monthly expenses.
  - **Financial Health Score (0–100)**: Real-time score calculated from spending discipline, budget adherence, and savings progress.
- 🎯 **Target-Driven Savings Goals**: Set deadlines and target amounts for tech upgrades, semester breaks, or emergency funds with real-time progress bars.
- 🛡️ **Budget Guardrails**: Category-specific monthly limits with real-time progress and over-budget warnings.
- 📥 **CSV Ledger Export**: 1-click export of your complete transaction history formatted for Excel and Google Sheets.
- 🔍 **Live Search & Multi-Sort**: Search transactions by merchant or description, and sort by date or amount.
- ☁️ **Supabase Integration**: PostgreSQL backend with Row Level Security (RLS) policies and authentication support.

---

## 🛠️ Tech Stack

- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Database & Auth**: Supabase (PostgreSQL, RLS)
- **Deployment**: Vercel ready (`vercel.json` SPA configuration included)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer)
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/gagan0270/spendwise.git
   cd spendwise
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🌐 Deploy to Vercel

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/new) and import the `spendwise` repository.
3. In **Settings > Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**!

---

## 📄 License

MIT License. Built with ❤️ for students.
