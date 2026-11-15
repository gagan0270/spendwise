import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowUpDown,
  ArrowUpRight,
  Bot,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Download,
  LayoutDashboard,
  ListFilter,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  WalletCards,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getCurrentUser, signOutUser, type UserProfile } from '@/lib/auth';
import { populateSampleDataForUser, resetUserDataToZero } from '@/lib/demoData';
import { exportTransactionsToCsv } from '@/lib/exportCsv';
import type { Budget, NewBudget, NewSavingsGoal, NewTransaction, SavingsGoal, Transaction } from '@/lib/types';
import { currentMonthKey, formatCurrency, formatMonth } from '@/lib/format';
import { categoryTotals, generateInsights, summarize, weeklyTrend } from '@/lib/insights';
import { calculateHealthScore } from '@/lib/health';
import { CATEGORIES, getCategory } from '@/lib/categories';
import { BarChart } from '@/components/BarChart';
import { BudgetModal } from '@/components/BudgetModal';
import { BudgetProgress } from '@/components/BudgetProgress';
import { DonutChart } from '@/components/DonutChart';
import { GoalCard } from '@/components/GoalCard';
import { GoalModal } from '@/components/GoalModal';
import { HealthGauge } from '@/components/HealthGauge';
import { InsightCard } from '@/components/InsightCard';
import { LoginPage } from '@/components/LoginPage';
import { QuickExpenseBar } from '@/components/QuickExpenseBar';
import { SpendingHeatmap } from '@/components/SpendingHeatmap';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';

type View = 'overview' | 'insights' | 'goals' | 'history';

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Command center', icon: LayoutDashboard },
  { id: 'insights', label: 'AI signals', icon: Bot },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'history', label: 'Transactions', icon: WalletCards },
];

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [view, setView] = useState<View>('overview');
  const [loading, setLoading] = useState(true);
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExpense, setShowExpense] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null | undefined>(undefined);

  // Filter & Search states
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const monthKey = currentMonthKey();
  const monthLabel = useMemo(() => {
    const [year, month] = monthKey.split('-').map(Number);
    return formatMonth(year, month - 1);
  }, [monthKey]);

  // Check authentication session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const activeUser = await getCurrentUser();
        setUser(activeUser);
      } catch (err) {
        console.warn('Auth check error:', err);
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Connect the database to start tracking your money.');
      setLoading(false);
      return;
    }
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Always query only data that belongs to the current user
      const [tx, bud, goal] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).order('spent_at', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('savings_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      if (tx.error) throw tx.error;
      if (bud.error) throw bud.error;
      if (goal.error) throw goal.error;

      setTransactions((tx.data as Transaction[]) ?? []);
      setBudgets((bud.data as Budget[]) ?? []);
      setGoals((goal.data as SavingsGoal[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your money data.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleLoginSuccess = async (loggedUser: UserProfile) => {
    setUser(loggedUser);
    // Starts with ZERO by default
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setView('overview');
  };

  const handlePopulateSample = async () => {
    if (!user) return;
    setSeedingLoading(true);
    try {
      await populateSampleDataForUser(user.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sample data.');
    } finally {
      setSeedingLoading(false);
    }
  };

  const handleResetToZero = async () => {
    if (!user) return;
    setSeedingLoading(true);
    try {
      await resetUserDataToZero(user.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset data to zero.');
    } finally {
      setSeedingLoading(false);
    }
  };

  const addTransaction = useCallback(
    async (entry: NewTransaction) => {
      if (!user) return;
      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert({ ...entry, user_id: user.id })
        .select()
        .maybeSingle();
      if (insertError || !data) throw insertError ?? new Error('Could not save expense.');
      setTransactions((current) => [data as Transaction, ...current]);
    },
    [user]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!user) return;
      const previous = transactions;
      setTransactions((current) => current.filter((item) => item.id !== id));
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (deleteError) {
        setTransactions(previous);
        throw deleteError;
      }
    },
    [transactions, user]
  );

  const saveBudget = useCallback(
    async (budget: NewBudget) => {
      if (!user) return;
      const { data, error: saveError } = await supabase
        .from('budgets')
        .upsert({ ...budget, user_id: user.id }, { onConflict: 'user_id,category' })
        .select()
        .maybeSingle();
      if (saveError || !data) throw saveError ?? new Error('Could not save budget.');
      setBudgets((current) => {
        const index = current.findIndex((item) => item.category === budget.category);
        if (index < 0) return [...current, data as Budget];
        const next = [...current];
        next[index] = data as Budget;
        return next;
      });
    },
    [user]
  );

  const deleteBudget = useCallback(
    async (category: string) => {
      if (!user) return;
      await supabase.from('budgets').delete().eq('user_id', user.id).eq('category', category);
      setBudgets((current) => current.filter((item) => item.category !== category));
    },
    [user]
  );

  const saveGoal = useCallback(
    async (goal: NewSavingsGoal, id?: string) => {
      if (!user) return;
      const result = id
        ? await supabase
            .from('savings_goals')
            .update(goal)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .maybeSingle()
        : await supabase
            .from('savings_goals')
            .insert({ ...goal, user_id: user.id })
            .select()
            .maybeSingle();
      if (result.error || !result.data) throw result.error ?? new Error('Could not save goal.');
      setGoals((current) =>
        id ? current.map((item) => (item.id === id ? (result.data as SavingsGoal) : item)) : [result.data as SavingsGoal, ...current]
      );
    },
    [user]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      if (!user) return;
      await supabase.from('savings_goals').delete().eq('id', id).eq('user_id', user.id);
      setGoals((current) => current.filter((item) => item.id !== id));
    },
    [user]
  );

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((item) => {
        const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
        const matchesQuery =
          !searchQuery.trim() ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.merchant && item.merchant.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCat && matchesQuery;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return b.spent_at.localeCompare(a.spent_at);
        if (sortBy === 'date-asc') return a.spent_at.localeCompare(b.spent_at);
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
      });
  }, [transactions, categoryFilter, searchQuery, sortBy]);

  const summary = useMemo(() => summarize(transactions, monthKey), [transactions, monthKey]);
  const insights = useMemo(() => generateInsights(transactions, budgets, summary, monthKey), [transactions, budgets, summary, monthKey]);
  const score = useMemo(() => calculateHealthScore(summary, budgets, goals), [summary, budgets, goals]);
  const trend = useMemo(() => weeklyTrend(transactions, 6), [transactions]);
  const donutData = useMemo(
    () => categoryTotals(transactions, monthKey).map((item) => ({ label: getCategory(item.category).label, value: item.total, color: item.color })),
    [transactions, monthKey]
  );
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.monthly_limit, 0);
  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved_amount, 0);

  const change = useMemo(() => {
    const date = new Date();
    const previous = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const key = `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}`;
    const last = transactions.filter((item) => item.spent_at.startsWith(key)).reduce((sum, item) => sum + item.amount, 0);
    return last ? Math.round(((summary.total - last) / last) * 100) : null;
  }, [transactions, summary.total]);

  // If checking authentication
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#07111f] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="animate-spin text-cyan-400 mb-3" size={32} />
        <p className="text-sm font-semibold tracking-wide">Starting Spendwise...</p>
      </div>
    );
  }

  // If no user is authenticated, render the Login/Demo screen
  if (!user) {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 selection:bg-cyan-300 selection:text-slate-950">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-800/80 bg-[#091525] px-5 py-7 lg:flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/10">
              <CircleDollarSign size={22} />
            </div>
            <div>
              <p className="font-display text-sm font-extrabold tracking-tight text-white">Spendwise</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400">Student edition</p>
            </div>
          </div>

          <div className="mt-10">
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">Workspace</p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all ${
                      view === item.id ? 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/10' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon size={17} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Card, Sample Data Actions & Sign Out */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={handlePopulateSample}
              disabled={seedingLoading}
              title="Populate realistic demo transactions to test charts"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-2 text-[11px] font-bold text-cyan-300 hover:bg-cyan-400/20 transition-all disabled:opacity-50"
            >
              <RefreshCw size={12} className={seedingLoading ? 'animate-spin' : ''} />
              <span>Sample Data</span>
            </button>
            <button
              onClick={handleResetToZero}
              disabled={seedingLoading}
              title="Clear all data and reset to zero"
              className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 p-2 text-slate-400 hover:text-rose-400 hover:border-rose-400/30 transition-all disabled:opacity-50"
            >
              <Trash2 size={13} />
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-300">
                <User size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.isDemo ? 'Demo Mode' : user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#07111f]/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300 text-slate-950">
                <CircleDollarSign size={18} />
              </div>
              <div>
                <span className="font-display text-sm font-extrabold text-white">Spendwise</span>
                {user.isDemo && (
                  <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-cyan-400 border border-cyan-400/30 rounded px-1.5 py-0.5">
                    Demo
                  </span>
                )}
              </div>
            </div>

            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{monthLabel}</p>
              <p className="mt-1 font-display text-lg font-bold text-white">Welcome, {user.name.split(' ')[0]}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBudget(true)}
                className="hidden items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition-colors hover:border-cyan-400 hover:text-cyan-300 sm:flex"
              >
                <Settings2 size={14} /> Budget rules
              </button>
              <button
                onClick={() => setShowExpense(true)}
                className="flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-extrabold text-slate-950 transition-all hover:bg-cyan-200 hover:shadow-lg hover:shadow-cyan-300/10"
              >
                <Plus size={15} /> Log expense
              </button>
              <button
                onClick={handleSignOut}
                className="lg:hidden p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-7 pb-28 sm:px-8 lg:py-10">
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-200">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* AI Quick Expense Bar */}
          <QuickExpenseBar onAddTransaction={addTransaction} />

          {loading ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center text-slate-500">
              <Loader2 className="animate-spin text-cyan-400" size={28} />
              <p className="mt-3 text-sm">Loading your money data…</p>
            </div>
          ) : (
            <>
              {view === 'overview' && (
                <Overview
                  summary={summary}
                  change={change}
                  score={score}
                  trend={trend}
                  donutData={donutData}
                  transactions={transactions}
                  budgets={budgets}
                  totalBudget={totalBudget}
                  monthKey={monthKey}
                  onSeeInsights={() => setView('insights')}
                  onSeeHistory={() => setView('history')}
                  onEditBudget={() => setShowBudget(true)}
                  onDelete={deleteTransaction}
                  onPopulateSample={handlePopulateSample}
                  onResetToZero={handleResetToZero}
                  seedingLoading={seedingLoading}
                />
              )}

              {view === 'insights' && (
                <section className="animate-rise">
                  <PageHeading
                    eyebrow="Pattern recognition"
                    title="AI signals"
                    detail="Small observations that make your next money decision easier."
                    icon={Bot}
                  />
                  <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <MetricCard label="Health score" value={`${score}/100`} detail="Based on your current habits" accent="cyan" />
                    <MetricCard label="This month" value={formatCurrency(summary.total)} detail={`${summary.transactionCount} logged transactions`} accent="lime" />
                    <MetricCard label="Daily pace" value={formatCurrency(summary.avgPerDay)} detail="Average spending per day" accent="amber" />
                  </div>
                  {insights.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {insights.map((item) => (
                        <InsightCard key={item.id} insight={item} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No signals yet"
                      text="Log a few expenses above and your AI coach will start spotting patterns and giving actionable tips."
                    />
                  )}
                </section>
              )}

              {view === 'goals' && (
                <section className="animate-rise">
                  <PageHeading
                    eyebrow="Build your future"
                    title="Savings goals"
                    detail="Turn the things you want into a visible plan."
                    icon={Target}
                    action={
                      <button
                        onClick={() => setEditingGoal(null)}
                        className="flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-lime-200"
                      >
                        <Plus size={15} /> New goal
                      </button>
                    }
                  />
                  <div className="mb-6 rounded-3xl border border-lime-300/20 bg-gradient-to-br from-lime-300/10 to-cyan-300/5 p-5 sm:p-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-lime-300">Total saved across goals</p>
                        <p className="mt-2 font-display text-4xl font-extrabold text-white">{formatCurrency(totalSaved)}</p>
                      </div>
                      <p className="text-sm text-slate-400">
                        {goals.length} active {goals.length === 1 ? 'goal' : 'goals'}
                      </p>
                    </div>
                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-lime-300 to-cyan-300 transition-all duration-700"
                        style={{
                          width: `${Math.min(
                            100,
                            (totalSaved / Math.max(1, goals.reduce((sum, goal) => sum + goal.target_amount, 0))) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  {goals.length ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {goals.map((goal) => (
                        <GoalCard key={goal.id} goal={goal} onUpdate={setEditingGoal} onDelete={deleteGoal} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Give your money somewhere to go"
                      text="Create a goal for something meaningful (like a new laptop or trip), then track your progress as you save."
                      action={
                        <button onClick={() => setEditingGoal(null)} className="rounded-xl bg-lime-300 px-4 py-2.5 text-xs font-bold text-slate-950">
                          Create your first goal
                        </button>
                      }
                    />
                  )}
                </section>
              )}

              {view === 'history' && (
                <section className="animate-rise">
                  <PageHeading
                    eyebrow="Your ledger"
                    title="Transactions"
                    detail="Every rupee, in one calm place."
                    icon={WalletCards}
                    action={
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => exportTransactionsToCsv(filteredTransactions)}
                          disabled={!filteredTransactions.length}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-40"
                        >
                          <Download size={15} /> Export CSV
                        </button>
                        <button
                          onClick={() => setShowExpense(true)}
                          className="flex items-center gap-1.5 rounded-xl bg-cyan-300 px-3.5 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-cyan-200 transition-all"
                        >
                          <Plus size={15} /> Add expense
                        </button>
                      </div>
                    }
                  />

                  <div className="rounded-3xl border border-slate-800 bg-[#0b1a2c] p-5 sm:p-6">
                    {/* Search & Filter Bar */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                      {/* Search Input */}
                      <div className="relative flex-1 max-w-md">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search description, cafe, book..."
                          className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-colors"
                        />
                      </div>

                      {/* Filters & Sorting */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
                          <ListFilter size={13} className="text-slate-400" />
                          <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-transparent text-xs font-semibold outline-none cursor-pointer"
                          >
                            <option value="All" className="bg-slate-900 text-white">All categories</option>
                            {CATEGORIES.map((c) => (
                              <option key={c.name} value={c.name} className="bg-slate-900 text-white">
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">
                          <ArrowUpDown size={13} className="text-slate-400" />
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc')}
                            className="bg-transparent text-xs font-semibold outline-none cursor-pointer"
                          >
                            <option value="date-desc" className="bg-slate-900 text-white">Newest first</option>
                            <option value="date-asc" className="bg-slate-900 text-white">Oldest first</option>
                            <option value="amount-desc" className="bg-slate-900 text-white">Highest amount</option>
                            <option value="amount-asc" className="bg-slate-900 text-white">Lowest amount</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs font-bold text-slate-400 mb-3">
                      Showing {filteredTransactions.length} of {transactions.length} entries
                    </p>

                    {filteredTransactions.length ? (
                      <TransactionList transactions={filteredTransactions} onDelete={deleteTransaction} />
                    ) : (
                      <EmptyState
                        title="No matching transactions"
                        text={searchQuery || categoryFilter !== 'All' ? 'Try clearing your search or category filter.' : 'Log your first expense to start your ledger.'}
                      />
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-800 bg-[#091525]/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-bold ${
                view === item.id ? 'text-cyan-300' : 'text-slate-500'
              }`}
            >
              <Icon size={18} />
              {item.label.split(' ')[0]}
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      {showExpense && <TransactionForm onSubmit={addTransaction} onClose={() => setShowExpense(false)} />}
      {showBudget && <BudgetModal budgets={budgets} onSave={saveBudget} onDelete={deleteBudget} onClose={() => setShowBudget(false)} />}
      {editingGoal !== undefined && <GoalModal goal={editingGoal} onSave={saveGoal} onClose={() => setEditingGoal(undefined)} />}
    </div>
  );
}

function PageHeading({ eyebrow, title, detail, icon: Icon, action }: { eyebrow: string; title: string; detail: string; icon: typeof Bot; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
          <Icon size={19} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">{eyebrow}</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{detail}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function MetricCard({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: 'cyan' | 'lime' | 'amber' }) {
  const colors = { cyan: 'text-cyan-300', lime: 'text-lime-300', amber: 'text-amber-300' };
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0b1a2c] p-4">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className={`mt-2 font-display text-2xl font-extrabold ${colors[accent]}`}>{value}</p>
      <p className="mt-1 text-[11px] text-slate-600">{detail}</p>
    </div>
  );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-800 bg-[#0b1a2c] px-6 py-14 text-center">
      <Sparkles size={28} className="mx-auto text-slate-700" />
      <p className="mt-4 text-sm font-bold text-slate-300">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Overview({
  summary,
  change,
  score,
  trend,
  donutData,
  transactions,
  budgets,
  totalBudget,
  monthKey,
  onSeeInsights,
  onSeeHistory,
  onEditBudget,
  onDelete,
  onPopulateSample,
  onResetToZero,
  seedingLoading,
}: {
  summary: ReturnType<typeof summarize>;
  change: number | null;
  score: number;
  trend: { label: string; total: number }[];
  donutData: { label: string; value: number; color: string }[];
  transactions: Transaction[];
  budgets: Budget[];
  totalBudget: number;
  monthKey: string;
  onSeeInsights: () => void;
  onSeeHistory: () => void;
  onEditBudget: () => void;
  onDelete: (id: string) => Promise<void>;
  onPopulateSample: () => Promise<void>;
  onResetToZero: () => Promise<void>;
  seedingLoading: boolean;
}) {
  return (
    <section className="animate-rise">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400">Student Money Intelligence</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Make your rupees work harder.</h2>
          <p className="mt-2 text-sm text-slate-500">Live, transparent view of what is happening across your budget and goals.</p>
        </div>
        <button onClick={onSeeInsights} className="flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-cyan-200">
          Open AI signals <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-[#0d2940] via-[#0b1d31] to-[#0b1a2c] p-6 sm:p-7">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {formatMonth(new Date().getFullYear(), new Date().getMonth())} spending
              </p>
              <p className="mt-2 font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{formatCurrency(summary.total)}</p>
              <div className="mt-3 flex items-center gap-2">
                {change !== null && (
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                      change > 0 ? 'bg-rose-400/10 text-rose-300' : 'bg-lime-300/10 text-lime-300'
                    }`}
                  >
                    {change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(change)}% vs last month
                  </span>
                )}
                <span className="text-xs text-slate-500">{summary.transactionCount} transactions logged</span>
              </div>
            </div>
            <HealthGauge score={score} />
          </div>
          <div className="relative mt-6 grid grid-cols-3 gap-3 border-t border-slate-700/60 pt-5">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Daily pace</p>
              <p className="mt-1 text-sm font-bold text-white">{formatCurrency(summary.avgPerDay)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Budgeted</p>
              <p className="mt-1 text-sm font-bold text-white">{formatCurrency(totalBudget)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Top category</p>
              <p className="mt-1 truncate text-sm font-bold text-white">
                {summary.byCategory[0] ? getCategory(summary.byCategory[0].category).label : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0b1a2c] p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Where it goes</p>
              <p className="mt-1 text-sm font-bold text-white">Category breakdown</p>
            </div>
            <Target size={17} className="text-slate-600" />
          </div>
          <div className="mt-2 flex justify-center">
            <DonutChart data={donutData} total={summary.total} />
          </div>
          {donutData.length > 0 ? (
            donutData.slice(0, 3).map((item) => (
              <div key={item.label} className="mb-2 flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="flex-1 truncate text-slate-500">{item.label}</span>
                <span className="font-bold text-slate-300">{formatCurrency(item.value)}</span>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-slate-500 mt-2">No category spends logged yet</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-[#0b1a2c] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Momentum</p>
              <h3 className="mt-1 text-sm font-bold text-white">6-week spending rhythm</h3>
            </div>
            <Activity size={17} className="text-cyan-400" />
          </div>
          <BarChart data={trend} color="#22d3ee" />
          <div className="mt-4 flex justify-between text-xs">
            <span className="text-slate-600">Weekly view</span>
            <span className="font-bold text-cyan-300">{formatCurrency(trend[trend.length - 1]?.total ?? 0)} this week</span>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0b1a2c] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Guardrails</p>
              <h3 className="mt-1 text-sm font-bold text-white">Budget tracking</h3>
            </div>
            <button onClick={onEditBudget} className="text-xs font-bold text-cyan-300 hover:text-cyan-200">
              {budgets.length} rules
            </button>
          </div>
          <BudgetProgress budgets={budgets} transactions={transactions} monthKey={monthKey} />
        </div>
      </div>

      {/* 12-week spending cadence heatmap */}
      <div className="mt-4 rounded-3xl border border-slate-800 bg-[#0b1a2c] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cadence</p>
            <h3 className="mt-1 text-sm font-bold text-white">Daily spending frequency (12 weeks)</h3>
          </div>
          <CalendarDays size={17} className="text-cyan-400" />
        </div>
        <SpendingHeatmap transactions={transactions} />
      </div>

      {/* Recent transactions or starter banner */}
      <div className="mt-4 rounded-3xl border border-slate-800 bg-[#0b1a2c] p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Latest activity</p>
            <h3 className="mt-1 text-sm font-bold text-white">Recent transactions</h3>
          </div>
          {transactions.length > 0 && (
            <button onClick={onSeeHistory} className="flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-cyan-200">
              View full ledger <ChevronRight size={14} />
            </button>
          )}
        </div>
        {transactions.length ? (
          <TransactionList transactions={transactions.slice(0, 5)} onDelete={onDelete} />
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center">
            <Sparkles size={28} className="mx-auto text-cyan-400 mb-3" />
            <h4 className="text-base font-bold text-white">Fresh Start — ₹0 Spent</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Your account starts completely clean with zero expenses. Use the AI Quick Log bar above (e.g. "Canteen lunch 120") to record your first spend.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={onPopulateSample}
                disabled={seedingLoading}
                className="flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 transition-all disabled:opacity-50"
              >
                <RefreshCw size={13} className={seedingLoading ? 'animate-spin' : ''} />
                Load Sample Data
              </button>
              {transactions.length > 0 && (
                <button
                  onClick={onResetToZero}
                  disabled={seedingLoading}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-all disabled:opacity-50"
                >
                  Clear to Zero
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default App;
