import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react';
import {
  Bot,
  Camera,
  Check,
  ChevronDown,
  Key,
  Loader2,
  Lock,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {
  askSpendwiseAi,
  parseReceiptWithVision,
  getGeminiApiKey,
  setGeminiApiKey,
  hasGeminiApiKey,
  type FinancialContext,
  type ChatMessage,
  type ExtractedReceipt,
} from '@/lib/gemini';
import { formatCurrency } from '@/lib/format';
import type { NewTransaction } from '@/lib/types';

interface AiChatbotProps {
  financialContext: FinancialContext;
  onAddTransaction: (entry: NewTransaction) => Promise<void>;
  hasMonthlyBudget: boolean;
  onRequireBudget: () => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

const QUICK_PROMPTS = [
  'Can I afford a ₹800 weekend treat?',
  'Where did most of my money go this month?',
  'How can I save ₹1,500 more for my goal?',
  'What is my safe daily limit right now?',
];

export function AiChatbot({
  financialContext,
  onAddTransaction,
  hasMonthlyBudget,
  onRequireBudget,
  isOpen: externalIsOpen,
  onToggle,
}: AiChatbotProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const setIsOpen = (next: boolean) => {
    if (onToggle) onToggle(next);
    setInternalIsOpen(next);
  };
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        `Hi! I'm your **Spendwise Financial Coach** 🎓💰.\n\nI can analyze your budget, verify whether you can afford an upcoming spend, or **scan your UPI payment screenshots** (Google Pay, PhonePe, Paytm, etc.) to log expenses automatically!\n\n*Note: I am strictly restricted to answering student finance & budget questions.*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());
  const [addedReceiptIds, setAddedReceiptIds] = useState<Set<string>>(new Set());
  const [uploadLoading, setUploadLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    if (!hasMonthlyBudget) {
      onRequireBudget();
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await askSpendwiseAi(text, messages, financialContext);
      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: 'I had trouble connecting to the AI brain. Please check your network or try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!hasMonthlyBudget) {
      onRequireBudget();
      return;
    }

    setUploadLoading(true);
    const reader = new FileReader();

    reader.onload = async () => {
      const base64Url = reader.result as string;
      // Strip "data:image/xyz;base64," prefix
      const base64Data = base64Url.split(',')[1];
      const mimeType = file.type || 'image/jpeg';

      const userMsg: ChatMessage = {
        id: `user-img-${Date.now()}`,
        role: 'user',
        content: `📷 Uploaded receipt / UPI payment screenshot (${file.name})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const { textExplanation, extracted } = await parseReceiptWithVision(
          base64Data,
          mimeType,
          financialContext
        );

        const aiMsg: ChatMessage = {
          id: `ai-receipt-${Date.now()}`,
          role: 'assistant',
          content: textExplanation,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          extractedTransaction: extracted || undefined,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch (err) {
        console.error('Vision analysis error:', err);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-err-${Date.now()}`,
            role: 'assistant',
            content: 'Could not extract transaction from this image. Please ensure the payment details (amount and merchant) are clearly visible.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } finally {
        setUploadLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  const handleAddExtractedExpense = async (receipt: ExtractedReceipt, msgId: string) => {
    try {
      await onAddTransaction({
        amount: receipt.amount,
        category: receipt.category,
        description: receipt.description,
        merchant: receipt.merchant,
        spent_at: receipt.spent_at,
      });
      setAddedReceiptIds((prev) => new Set([...prev, msgId]));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not add transaction.');
    }
  };

  const handleSaveApiKey = (e: FormEvent) => {
    e.preventDefault();
    setGeminiApiKey(apiKeyInput.trim());
    setShowSettings(false);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Conversation cleared. How can I help with your budget, expenses, or savings goals today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-lime-300 p-3.5 sm:px-5 sm:py-3.5 text-slate-950 font-extrabold shadow-2xl shadow-cyan-400/30 hover:scale-105 active:scale-95 transition-all group"
          title="Open Spendwise AI Coach"
        >
          <div className="relative">
            <Bot size={22} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-700"></span>
            </span>
          </div>
          <span className="hidden sm:inline text-xs uppercase tracking-wider font-display font-black">
            Ask AI Coach
          </span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:inset-y-auto sm:bottom-6 sm:right-6 sm:w-[440px] sm:h-[620px] rounded-none sm:rounded-3xl border border-slate-700/80 bg-[#071322]/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 bg-[#09182b] px-4 py-3.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-lime-300 text-slate-950 shadow-md">
                <Bot size={20} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-extrabold text-white">Spendwise AI</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-cyan-400 font-semibold tracking-wide">
                  Student Financial Advisor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
                title="AI Settings & API Key"
              >
                <Key size={16} className={hasGeminiApiKey() ? 'text-lime-300' : 'text-slate-400'} />
              </button>
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-rose-400 transition-colors"
                title="Clear Chat"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-white transition-colors ml-1"
                title="Close Chat"
              >
                <ChevronDown size={20} />
              </button>
            </div>
          </div>

          {/* Settings Sub-Panel */}
          {showSettings && (
            <div className="border-b border-slate-800 bg-[#06101d] p-4 text-xs animate-fade-in shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Key size={14} className="text-cyan-400" />
                  Google Gemini API Key
                </span>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                Add your free Gemini API key to enable live vision OCR for UPI screenshots and personalized financial coaching.
              </p>
              <form onSubmit={handleSaveApiKey} className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-600 outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-300 px-3 py-1.5 font-bold text-slate-950 hover:bg-cyan-200 transition-colors"
                >
                  Save
                </button>
              </form>
            </div>
          )}

          {/* Guardrail Policy Pill */}
          <div className="bg-cyan-950/40 border-b border-cyan-500/10 px-3 py-1.5 flex items-center justify-between text-[10px] text-cyan-300 font-medium shrink-0">
            <span className="flex items-center gap-1">
              <Lock size={11} className="text-cyan-400" />
              Restricted exclusively to personal budget & spending analysis
            </span>
            <span className="text-slate-400">₹ Active</span>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 font-medium shadow-md'
                        : 'border border-slate-800 bg-slate-900/90 text-slate-200 shadow-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {/* Extracted Receipt Card for 1-Click Adding */}
                    {m.extractedTransaction && (
                      <div className="mt-3 rounded-xl border border-cyan-400/30 bg-[#071322] p-3 text-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                            Extracted Transaction
                          </span>
                          <span className="font-extrabold text-sm text-lime-300">
                            {formatCurrency(m.extractedTransaction.amount)}
                          </span>
                        </div>
                        <div className="space-y-1 text-[11px] text-slate-300 mb-3">
                          <p><span className="text-slate-500">Merchant:</span> {m.extractedTransaction.merchant || 'Unknown'}</p>
                          <p><span className="text-slate-500">Category:</span> {m.extractedTransaction.category}</p>
                          <p><span className="text-slate-500">Note:</span> {m.extractedTransaction.description}</p>
                        </div>

                        {addedReceiptIds.has(m.id) ? (
                          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-lime-400/20 py-1.5 text-[11px] font-bold text-lime-300 border border-lime-400/30">
                            <Check size={13} />
                            <span>Logged to Expenses!</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddExtractedExpense(m.extractedTransaction!, m.id)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-300 to-lime-300 py-1.5 text-[11px] font-extrabold text-slate-950 hover:opacity-95 transition-all shadow-sm"
                          >
                            <Plus size={13} />
                            <span>Confirm & Add to Ledger</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-[9px] text-slate-600 px-1">{m.timestamp}</span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <Loader2 size={15} className="animate-spin text-cyan-300" />
                <span>Spendwise AI is calculating your budget numbers…</span>
              </div>
            )}

            {uploadLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <Loader2 size={15} className="animate-spin text-lime-300" />
                <span>Scanning UPI payment screenshot with Vision AI…</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-1.5 border-t border-slate-800/80 bg-[#06101d] overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5 shrink-0">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt)}
                disabled={loading || uploadLoading}
                className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 text-[10px] font-medium text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition-colors shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Footer Input Bar */}
          <div className="p-3 border-t border-slate-800 bg-[#09182b] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploadLoading}
                title="Upload UPI screenshot or receipt"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 text-cyan-300 hover:border-cyan-400 hover:bg-slate-800 transition-colors"
              >
                <Camera size={17} />
              </button>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your budget or upload receipt..."
                  disabled={loading || uploadLoading}
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-3.5 pr-8 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading || uploadLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-300 hover:text-cyan-200 disabled:opacity-30 transition-opacity"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
