import { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  DollarSign,
  Wallet,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  ChevronDown,
  X,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { Payout, Trade } from '../../types';
import { formatCurrency, calcTotalPnL } from '../../lib/calculations';
import AccountsTab from '../Accounts/AccountsTab';

const today = new Date().toISOString().split('T')[0];

const FUTURES_PRESETS = [
  { symbol: 'NQ', name: 'E-mini Nasdaq', defaultSize: 2 },
  { symbol: 'ES', name: 'E-mini S&P', defaultSize: 2 },
  { symbol: 'MNQ', name: 'Micro Nasdaq', defaultSize: 10 },
  { symbol: 'MES', name: 'Micro S&P', defaultSize: 10 },
  { symbol: 'CL', name: 'Crude Oil', defaultSize: 2 },
  { symbol: 'GC', name: 'Gold', defaultSize: 2 },
];

const PNL_PRESETS = [
  { label: '+$650', value: 650, win: true },
  { label: '+$950', value: 950, win: true },
  { label: '+$1,450', value: 1450, win: true },
  { label: '-$550', value: -550, win: false },
  { label: '-$850', value: -850, win: false },
];

export default function JournalPortal() {
  const {
    state,
    selectedAccount,
    accountTrades,
    accountPayouts,
    refreshTrades,
    refreshPayouts,
    refreshAccounts,
    dispatch,
  } = useApp();

  // Active sub-tab inside /journal: 'trades' | 'payouts' | 'accounts'
  const [activeTab, setActiveTab] = useState<'trades' | 'payouts' | 'accounts'>('trades');

  // Account switcher dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New Account Modal
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [newAccountForm, setNewAccountForm] = useState({
    name: '',
    initial_balance: '50000',
    max_drawdown: '48000',
    profit_target: '3000',
  });
  const [savingAccount, setSavingAccount] = useState(false);

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);

  // --- TRADE ENTRY STATE ---
  const [tradeForm, setTradeForm] = useState({
    date: today,
    symbol: 'NQ',
    direction: 'long' as 'long' | 'short',
    entry_price: '',
    exit_price: '',
    size: '2',
    fees: '4.5',
    pnl: '',
    num_trades: '1',
    notes: '',
  });
  const [savingTrade, setSavingTrade] = useState(false);
  const [tradeError, setTradeError] = useState('');
  const [tradeSearch, setTradeSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState<'all' | 'wins' | 'losses'>('all');

  // --- PAYOUT ENTRY STATE ---
  const [payoutForm, setPayoutForm] = useState({
    requested_amount: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected',
    request_date: today,
    notes: '',
  });
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  // Handle outside click for account dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  // Calculate balance
  const totalPnL = calcTotalPnL(accountTrades);
  const initialBalance = selectedAccount?.initial_balance ?? 50000;
  const currentBalance = initialBalance + totalPnL;

  // --- SUBMIT TRADE ---
  async function handleTradeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.selectedAccountId) {
      setTradeError('Please select a trading account first');
      return;
    }
    const pnlNum = parseFloat(tradeForm.pnl);
    if (isNaN(pnlNum)) {
      setTradeError('Please enter a valid P&L amount');
      return;
    }

    setSavingTrade(true);
    setTradeError('');

    const { error: insertError } = await supabase.from('trades').insert({
      account_id: state.selectedAccountId,
      date: tradeForm.date,
      symbol: tradeForm.symbol.trim() || 'NQ',
      direction: tradeForm.direction,
      entry_price: parseFloat(tradeForm.entry_price) || 0,
      exit_price: parseFloat(tradeForm.exit_price) || 0,
      size: parseFloat(tradeForm.size) || 1,
      fees: parseFloat(tradeForm.fees) || 0,
      pnl: pnlNum,
      num_trades: parseInt(tradeForm.num_trades) || 1,
      notes: tradeForm.notes.trim(),
    });

    if (insertError) {
      setTradeError(insertError.message);
      setSavingTrade(false);
      return;
    }

    await refreshTrades();
    setSavingTrade(false);

    if (pnlNum > 0) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    }
    showToast(`Trade logged: ${pnlNum >= 0 ? '+' : ''}${formatCurrency(pnlNum)}`);

    setTradeForm({
      date: today,
      symbol: tradeForm.symbol,
      direction: 'long',
      entry_price: '',
      exit_price: '',
      size: tradeForm.size,
      fees: '4.5',
      pnl: '',
      num_trades: '1',
      notes: '',
    });
  }

  // --- DELETE TRADE ---
  async function handleDeleteTrade(id: string) {
    if (!confirm('Are you sure you want to delete this trade?')) return;
    await supabase.from('trades').delete().eq('id', id);
    await refreshTrades();
    showToast('Trade deleted successfully');
  }

  // --- SUBMIT PAYOUT ---
  async function handlePayoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.selectedAccountId) {
      setPayoutError('Please select a trading account first');
      return;
    }
    const reqAmount = parseFloat(payoutForm.requested_amount);
    if (isNaN(reqAmount) || reqAmount <= 0) {
      setPayoutError('Please enter a valid payout amount');
      return;
    }

    setSavingPayout(true);
    setPayoutError('');

    let finalizedAmount: number | null = null;
    let finalizedDate: string | null = null;

    if (payoutForm.status === 'approved') {
      finalizedAmount = Math.round(reqAmount * 0.9);
      finalizedDate = payoutForm.request_date || today;
    } else if (payoutForm.status === 'rejected') {
      finalizedAmount = 0;
      finalizedDate = payoutForm.request_date || today;
    }

    const { error: insertError } = await supabase.from('payouts').insert({
      account_id: state.selectedAccountId,
      requested_amount: reqAmount,
      finalized_amount: finalizedAmount,
      request_date: payoutForm.request_date,
      finalized_date: finalizedDate,
      status: payoutForm.status,
      notes: payoutForm.notes.trim() || 'Bi-Weekly Profit Split Request',
    });

    if (insertError) {
      setPayoutError(insertError.message);
      setSavingPayout(false);
      return;
    }

    await refreshPayouts();
    setSavingPayout(false);

    if (payoutForm.status === 'approved') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    showToast(`Payout recorded (${payoutForm.status.toUpperCase()}): ${formatCurrency(reqAmount)}`);

    setPayoutForm({
      requested_amount: '',
      status: 'pending',
      request_date: today,
      notes: '',
    });
  }

  // --- UPDATE EXISTING PAYOUT STATUS ---
  async function handleUpdatePayoutStatus(payout: Payout, newStatus: Payout['status']) {
    let finalizedAmount: number | null = null;
    let finalizedDate: string | null = null;

    if (newStatus === 'approved') {
      finalizedAmount = payout.finalized_amount || Math.round(payout.requested_amount * 0.9);
      finalizedDate = payout.finalized_date || today;
    } else if (newStatus === 'rejected') {
      finalizedAmount = 0;
      finalizedDate = today;
    }

    await supabase.from('payouts').update({
      status: newStatus,
      finalized_amount: finalizedAmount,
      finalized_date: finalizedDate,
    }).eq('id', payout.id);

    await refreshPayouts();
    showToast(`Payout updated to ${newStatus.toUpperCase()}`);
  }

  // --- DELETE PAYOUT ---
  async function handleDeletePayout(id: string) {
    if (!confirm('Are you sure you want to delete this payout record?')) return;
    await supabase.from('payouts').delete().eq('id', id);
    await refreshPayouts();
    showToast('Payout record deleted');
  }

  // --- CREATE ACCOUNT ---
  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newAccountForm.name.trim()) return;
    setSavingAccount(true);

    const { data } = await supabase.from('accounts').insert({
      name: newAccountForm.name.trim(),
      initial_balance: parseFloat(newAccountForm.initial_balance) || 50000,
      max_drawdown: parseFloat(newAccountForm.max_drawdown) || 48000,
      profit_target: parseFloat(newAccountForm.profit_target) || 3000,
      commission_per_side: 0,
    }).select().single();

    await refreshAccounts();
    if (data) {
      dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: data.id });
    }
    setSavingAccount(false);
    setShowAddAccountModal(false);
    setNewAccountForm({ name: '', initial_balance: '50000', max_drawdown: '48000', profit_target: '3000' });
    showToast(`Account "${data?.name}" created & selected!`);
  }

  // Filtered trades for table
  const filteredTrades = accountTrades.filter((t) => {
    if (tradeFilter === 'wins' && t.pnl <= 0) return false;
    if (tradeFilter === 'losses' && t.pnl >= 0) return false;
    if (tradeSearch) {
      const q = tradeSearch.toLowerCase();
      return (
        t.symbol.toLowerCase().includes(q) ||
        t.date.includes(q) ||
        t.notes.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 selection:bg-indigo-500/30 selection:text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl bg-[#121824] border border-[#10b981]/40 text-[#10b981] font-mono text-xs font-semibold shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dedicated /journal Header - Strictly Separated (No link to main dashboard) */}
      <header className="border-b border-[#1e293b] bg-[#0e1320]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Branding & Portal Tag */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#10b981] flex items-center justify-center shadow-lg shadow-purple-600/30">
                <span className="text-white font-black text-sm tracking-tighter">TZ</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-sm sm:text-base tracking-wider text-white font-mono">
                    TRADEZELLA
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                    /journal
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">Trade Logging &amp; Payout Management Portal</p>
              </div>
            </div>

            {/* Right: Account Switcher & Current Balance */}
            <div className="flex items-center gap-3 sm:gap-6">
              {/* Account Switcher */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121824] hover:bg-[#182234] border border-[#1e293b] text-xs font-mono transition-all group"
                >
                  <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="text-slate-400 group-hover:text-slate-200 font-medium">
                    {selectedAccount ? selectedAccount.name : 'Select Account'}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      className="absolute top-full right-0 mt-2 w-72 border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl z-50 p-2 bg-[#121824] backdrop-blur-xl"
                    >
                      <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold font-mono flex items-center justify-between border-b border-[#1e293b] mb-1">
                        <span>Accounts ({state.accounts.length})</span>
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-1 py-1">
                        {state.accounts.map((acc) => {
                          const isSel = acc.id === state.selectedAccountId;
                          return (
                            <button
                              key={acc.id}
                              onClick={() => {
                                dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: acc.id });
                                setDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                                isSel
                                  ? 'bg-[#10b981]/15 text-white font-semibold border border-[#10b981]/30'
                                  : 'text-slate-300 hover:bg-white/5'
                              }`}
                            >
                              <span className="font-mono">{acc.name}</span>
                              <span className="text-[11px] text-[#10b981] font-mono">
                                {formatCurrency(acc.initial_balance)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="pt-2 border-t border-[#1e293b] mt-1">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setShowAddAccountModal(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-mono transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add New Account</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Balance */}
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block">Account Balance</span>
                <span className="text-sm sm:text-base font-bold font-mono text-white">
                  {formatCurrency(currentBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Portal Sub-Navigation Tabs */}
        <div className="border-t border-[#1e293b] bg-[#0b0e14]/60">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('trades')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-semibold transition-all ${
                  activeTab === 'trades'
                    ? 'bg-[#10b981] text-black shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                    : 'bg-[#121824] hover:bg-[#182234] text-slate-400 hover:text-white border border-[#1e293b]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Log Trades</span>
                <span className="ml-1 px-1.5 py-0.2 rounded bg-black/20 text-[10px]">
                  {accountTrades.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('payouts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-semibold transition-all ${
                  activeTab === 'payouts'
                    ? 'bg-[#10b981] text-black shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                    : 'bg-[#121824] hover:bg-[#182234] text-slate-400 hover:text-white border border-[#1e293b]'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Request &amp; Manage Payouts</span>
                <span className="ml-1 px-1.5 py-0.2 rounded bg-black/20 text-[10px]">
                  {accountPayouts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('accounts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs font-semibold transition-all ${
                  activeTab === 'accounts'
                    ? 'bg-[#10b981] text-black shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                    : 'bg-[#121824] hover:bg-[#182234] text-slate-400 hover:text-white border border-[#1e293b]'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Trading Accounts</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area for /journal */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ============================================================== */}
        {/* TAB 1: LOG TRADES */}
        {/* ============================================================== */}
        {activeTab === 'trades' && (
          <div className="space-y-6">
            {/* Trade Entry Card */}
            <div className="bg-[#121824] border border-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#1e293b] mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#10b981]">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white font-mono">Log New Trade Entry</h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Account: <span className="text-[#10b981] font-semibold">{selectedAccount?.name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTradeForm((f) => ({ ...f, direction: 'long' }))}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                      tradeForm.direction === 'long'
                        ? 'bg-[#10b981] text-black shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                        : 'bg-[#0b0e14] text-slate-400 hover:text-white border border-[#1e293b]'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>LONG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeForm((f) => ({ ...f, direction: 'short' }))}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 ${
                      tradeForm.direction === 'short'
                        ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                        : 'bg-[#0b0e14] text-slate-400 hover:text-white border border-[#1e293b]'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>SHORT</span>
                  </button>
                </div>
              </div>

              {tradeError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{tradeError}</span>
                </div>
              )}

              <form onSubmit={handleTradeSubmit} className="space-y-4">
                {/* Presets & Instrument */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {FUTURES_PRESETS.map((p) => {
                    const isSelected = tradeForm.symbol === p.symbol;
                    return (
                      <button
                        key={p.symbol}
                        type="button"
                        onClick={() =>
                          setTradeForm((f) => ({ ...f, symbol: p.symbol, size: String(p.defaultSize) }))
                        }
                        className={`p-2 rounded-xl border text-center transition-all font-mono ${
                          isSelected
                            ? 'bg-emerald-500/15 border-[#10b981] text-white font-bold'
                            : 'bg-[#0b0e14] border-[#1e293b] text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-bold">{p.symbol}</div>
                        <div className="text-[10px] text-slate-500">{p.name}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                      Trade Date *
                    </label>
                    <input
                      type="date"
                      value={tradeForm.date}
                      onChange={(e) => setTradeForm({ ...tradeForm, date: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1e293b] text-white font-mono text-xs focus:border-[#10b981] outline-none"
                    />
                  </div>

                  {/* Net P&L */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                      Session Net P&amp;L ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 1140 or -980"
                      value={tradeForm.pnl}
                      onChange={(e) => setTradeForm({ ...tradeForm, pnl: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1e293b] text-white font-mono font-bold text-xs focus:border-[#10b981] outline-none"
                    />
                  </div>

                  {/* Contracts Size */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                      Contracts (Size)
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="2"
                      value={tradeForm.size}
                      onChange={(e) => setTradeForm({ ...tradeForm, size: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1e293b] text-white font-mono text-xs focus:border-[#10b981] outline-none"
                    />
                  </div>

                  {/* Number of Trades */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                      Number of Executions
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={tradeForm.num_trades}
                      onChange={(e) => setTradeForm({ ...tradeForm, num_trades: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1e293b] text-white font-mono text-xs focus:border-[#10b981] outline-none"
                    />
                  </div>
                </div>

                {/* Quick P&L Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Quick P&amp;L:</span>
                  {PNL_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setTradeForm((f) => ({ ...f, pnl: String(p.value) }))}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-all ${
                        p.win
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                    Trade Strategy &amp; Execution Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Morning liquidity sweep, clean VWAP reclaim, 2R target hit"
                    value={tradeForm.notes}
                    onChange={(e) => setTradeForm({ ...tradeForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1e293b] text-white font-mono text-xs focus:border-[#10b981] outline-none"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingTrade}
                    className="px-6 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black font-mono font-extrabold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)] disabled:opacity-50"
                  >
                    {savingTrade ? 'Saving Trade...' : '+ Log Trade Entry'}
                  </button>
                </div>
              </form>
            </div>

            {/* Recent Trades Table */}
            <div className="bg-[#121824] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 sm:p-5 border-b border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b0e14]/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold font-mono text-white text-sm">Recent Trades</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
                    {filteredTrades.length} trades
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search trades..."
                      value={tradeSearch}
                      onChange={(e) => setTradeSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-[#0b0e14] border border-[#1e293b] text-xs font-mono text-white outline-none w-40 sm:w-48"
                    />
                  </div>

                  {/* Filter Wins/Losses */}
                  <div className="flex rounded-xl bg-[#0b0e14] border border-[#1e293b] p-0.5">
                    {(['all', 'wins', 'losses'] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setTradeFilter(f)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold uppercase ${
                          tradeFilter === f ? 'bg-[#10b981] text-black' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1e293b] bg-[#0b0e14]/60 text-slate-400">
                      <th className="text-left px-5 py-3">Date</th>
                      <th className="text-left px-5 py-3">Symbol</th>
                      <th className="text-left px-5 py-3">Direction</th>
                      <th className="text-left px-5 py-3">Contracts</th>
                      <th className="text-left px-5 py-3">Net P&amp;L</th>
                      <th className="text-left px-5 py-3">Notes</th>
                      <th className="text-right px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/60">
                    {filteredTrades.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-500 font-mono">
                          No trades recorded for this account yet.
                        </td>
                      </tr>
                    ) : (
                      filteredTrades.map((t: Trade) => (
                        <tr key={t.id} className="hover:bg-[#182234] transition-colors">
                          <td className="px-5 py-3 text-slate-300">{t.date}</td>
                          <td className="px-5 py-3 text-white font-bold">{t.symbol}</td>
                          <td className="px-5 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                t.direction === 'long'
                                  ? 'bg-[#10b981]/15 text-[#10b981]'
                                  : 'bg-rose-500/15 text-rose-400'
                              }`}
                            >
                              {t.direction}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-400">{t.size}</td>
                          <td className="px-5 py-3 font-bold">
                            <span className={t.pnl >= 0 ? 'text-[#10b981]' : 'text-rose-400'}>
                              {t.pnl >= 0 ? '+' : ''}{formatCurrency(t.pnl)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-400 max-w-xs truncate">{t.notes || '—'}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleDeleteTrade(t.id)}
                              className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete Trade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: REQUEST & MANAGE PAYOUTS */}
        {/* ============================================================== */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            {/* Request Payout Form Card */}
            <div className="bg-[#121824] border border-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#1e293b] mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-[#10b981]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white font-mono">Request New Payout</h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Account: <span className="text-[#10b981] font-semibold">{selectedAccount?.name}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Available Equity</span>
                  <span className="text-sm font-bold font-mono text-[#10b981]">{formatCurrency(currentBalance)}</span>
                </div>
              </div>

              {payoutError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{payoutError}</span>
                </div>
              )}

              <form onSubmit={handlePayoutSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Requested Amount */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                      Payout Amount ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 5900"
                      value={payoutForm.requested_amount}
                      onChange={(e) => setPayoutForm({ ...payoutForm, requested_amount: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1e293b] text-white font-mono font-bold text-xs focus:border-[#10b981] outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      Estimated 90% Net: {payoutForm.requested_amount ? formatCurrency(parseFloat(payoutForm.requested_amount) * 0.9) : '$0'}
                    </span>
                  </div>

                  {/* Payout Status Selector (Accepted, Pending, Rejected) */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                      Payout Status *
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0b0e14] border border-[#1e293b] rounded-xl">
                      {/* Approved / Accepted */}
                      <button
                        type="button"
                        onClick={() => setPayoutForm({ ...payoutForm, status: 'approved' })}
                        className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                          payoutForm.status === 'approved'
                            ? 'bg-[#10b981] text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>Accepted</span>
                      </button>

                      {/* Pending */}
                      <button
                        type="button"
                        onClick={() => setPayoutForm({ ...payoutForm, status: 'pending' })}
                        className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                          payoutForm.status === 'pending'
                            ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>Pending</span>
                      </button>

                      {/* Rejected */}
                      <button
                        type="button"
                        onClick={() => setPayoutForm({ ...payoutForm, status: 'rejected' })}
                        className={`py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                          payoutForm.status === 'rejected'
                            ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <X className="w-3 h-3" />
                        <span>Rejected</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      {payoutForm.status === 'approved'
                        ? 'Will automatically record 90% payout to account'
                        : payoutForm.status === 'pending'
                        ? 'Will show as Processing / Under Review'
                        : 'Will mark this payout request as Rejected'}
                    </span>
                  </div>

                  {/* Request Date */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                      Request Date *
                    </label>
                    <input
                      type="date"
                      value={payoutForm.request_date}
                      onChange={(e) => setPayoutForm({ ...payoutForm, request_date: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1e293b] text-white font-mono text-xs focus:border-[#10b981] outline-none"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                    Notes &amp; Cycle Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bi-Weekly Cycle #19 (2-Week Profit Split: $6,500)"
                    value={payoutForm.notes}
                    onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1e293b] text-white font-mono text-xs focus:border-[#10b981] outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPayout}
                    className="px-6 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black font-mono font-extrabold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)] disabled:opacity-50"
                  >
                    {savingPayout ? 'Saving Payout...' : '+ Submit Payout Request'}
                  </button>
                </div>
              </form>
            </div>

            {/* Payout History & Status Management Table */}
            <div className="bg-[#121824] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 sm:p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#0b0e14]/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold font-mono text-white text-sm">Payout Requests &amp; Status Management</h3>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
                    {accountPayouts.length} records
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  Change status directly using the dropdown
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1e293b] bg-[#0b0e14]/60 text-slate-400">
                      <th className="text-left px-5 py-3">Request Date</th>
                      <th className="text-left px-5 py-3">Requested</th>
                      <th className="text-left px-5 py-3">Profit Split</th>
                      <th className="text-left px-5 py-3">Finalized / Paid</th>
                      <th className="text-left px-5 py-3">Status</th>
                      <th className="text-left px-5 py-3">Notes</th>
                      <th className="text-right px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/60">
                    {accountPayouts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-500 font-mono">
                          No payout requests recorded for this account yet.
                        </td>
                      </tr>
                    ) : (
                      accountPayouts.map((p: Payout) => {
                        const isApproved = p.status === 'approved';
                        const isPending = p.status === 'pending';
                        const isRejected = p.status === 'rejected';
                        const netAmount = p.finalized_amount ?? (isApproved ? p.requested_amount * 0.9 : null);

                        return (
                          <tr key={p.id} className="hover:bg-[#182234] transition-colors">
                            <td className="px-5 py-3 text-slate-300 font-semibold">{p.request_date}</td>
                            <td className="px-5 py-3 text-white font-bold">{formatCurrency(p.requested_amount)}</td>
                            <td className="px-5 py-3 text-slate-400">
                              <span className="px-2 py-0.5 rounded bg-[#0b0e14] border border-[#1e293b] text-[10px]">
                                90% Trader
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {isApproved ? (
                                <span className="font-bold text-[#10b981]">+{formatCurrency(netAmount ?? 0)}</span>
                              ) : isRejected ? (
                                <span className="text-rose-400">$0 (Rejected)</span>
                              ) : (
                                <span className="text-amber-400 italic">Pending Approval</span>
                              )}
                            </td>
                            {/* Interactive Status Changer Dropdown */}
                            <td className="px-5 py-3">
                              <select
                                value={p.status}
                                onChange={(e) =>
                                  handleUpdatePayoutStatus(p, e.target.value as Payout['status'])
                                }
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase font-mono border outline-none cursor-pointer ${
                                  isApproved
                                    ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40'
                                    : isPending
                                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                    : 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                                }`}
                              >
                                <option value="approved" className="bg-[#121824] text-[#10b981]">
                                  ACCEPTED / APPROVED
                                </option>
                                <option value="pending" className="bg-[#121824] text-amber-400">
                                  PENDING
                                </option>
                                <option value="rejected" className="bg-[#121824] text-rose-400">
                                  REJECTED
                                </option>
                              </select>
                            </td>
                            <td className="px-5 py-3 text-slate-400 max-w-xs truncate">{p.notes || '—'}</td>
                            <td className="px-5 py-3 text-right">
                              <button
                                onClick={() => handleDeletePayout(p.id)}
                                className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-colors"
                                title="Delete Payout"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: ACCOUNTS MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'accounts' && <AccountsTab />}
      </main>

      {/* Modal: Add New Account */}
      <AnimatePresence>
        {showAddAccountModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowAddAccountModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-[#1e293b] p-6 shadow-2xl relative bg-[#121824]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
                <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  Add New Trading Account
                </h3>
                <button
                  onClick={() => setShowAddAccountModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAccount} className="py-4 space-y-4 font-mono">
                <div>
                  <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1.5">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. APEX-50K-02"
                    value={newAccountForm.name}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1e293b] text-white text-xs outline-none focus:border-[#10b981]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1.5">
                      Initial Balance ($)
                    </label>
                    <input
                      type="number"
                      value={newAccountForm.initial_balance}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, initial_balance: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1e293b] text-white text-xs outline-none focus:border-[#10b981]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 uppercase tracking-wider mb-1.5">
                      Max Drawdown ($)
                    </label>
                    <input
                      type="number"
                      value={newAccountForm.max_drawdown}
                      onChange={(e) => setNewAccountForm({ ...newAccountForm, max_drawdown: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#1e293b] text-white text-xs outline-none focus:border-[#10b981]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddAccountModal(false)}
                    className="px-4 py-2 rounded-xl bg-[#0b0e14] hover:bg-white/5 border border-[#1e293b] text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAccount}
                    className="px-5 py-2 rounded-xl bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-xs"
                  >
                    {savingAccount ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
