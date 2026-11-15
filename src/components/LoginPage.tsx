import { useState, type FormEvent } from 'react';
import { Bot, CheckCircle2, CircleDollarSign, Loader2, Lock, Mail, Sparkles, User, Zap } from 'lucide-react';
import { signInWithDemo, signInWithEmail, signUpWithEmail, type UserProfile } from '@/lib/auth';

interface LoginPageProps {
  onSuccess: (user: UserProfile) => void;
}

export function LoginPage({ onSuccess }: LoginPageProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      const user = signInWithDemo();
      onSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not launch demo.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }
    if (tab === 'signup' && !name.trim()) {
      setError('Please provide your name.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (tab === 'signin') {
        const user = await signInWithEmail(email.trim(), password);
        onSuccess(user);
      } else {
        const user = await signUpWithEmail(email.trim(), password, name.trim());
        onSuccess(user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-cyan-300 selection:text-slate-950 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-lime-400/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-xl shadow-cyan-300/20 mb-4 animate-bounce-subtle">
            <CircleDollarSign size={32} />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">Spendwise</h1>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-400 mt-1">Student Financial Intelligence</p>
          <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
            Take control of your college spending, savings goals, and daily budgets with live AI guidance.
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl border border-slate-800 bg-[#0b1a2c]/90 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl">
          {/* Instant Demo Access Button */}
          <div className="mb-6">
            <div className="rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-400/15 to-emerald-400/10 p-4">
              <div className="flex items-center gap-2 mb-2 text-cyan-300">
                <Sparkles size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Fast Preview</span>
              </div>
              <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                Test all charts, budgets, AI insights, and heatmaps pre-populated with realistic student finances.
              </p>
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={demoLoading || loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-lime-300 px-4 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-cyan-300/20 transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
              >
                {demoLoading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                Explore Demo Account
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold uppercase tracking-widest text-slate-600">or sign in with email</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Form Tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-900/80 p-1 mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => { setTab('signin'); setError(null); }}
              className={`rounded-lg py-2 text-xs font-bold transition-all ${tab === 'signin' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setTab('signup'); setError(null); }}
              className={`rounded-lg py-2 text-xs font-bold transition-all ${tab === 'signup' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Chen"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.99] disabled:opacity-50 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {tab === 'signin' ? 'Sign In to Account' : 'Create Free Account'}
            </button>
          </form>

          {/* Highlights */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-lime-400 shrink-0" />
              <span>Real-time Indian Rupee (₹) currency tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-cyan-400 shrink-0" />
              <span>Automated weekly spending pace & AI insights</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot size={14} className="text-amber-400 shrink-0" />
              <span>Natural language quick expense logger</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
