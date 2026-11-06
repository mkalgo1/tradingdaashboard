import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ShieldCheck,
  Activity,
  Plus,
  BookOpen,
  Wallet,
  DollarSign,
  Clock,
  X,
  Check,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { calcTodayPnL, calcMonthPnL, calcTotalPnL, formatCurrency } from '../../lib/calculations';
import { Payout } from '../../types';

const today = new Date().toISOString().split('T')[0];

interface HeaderProps {
  showPlusButton?: boolean;
}

export default function Header({ showPlusButton = false }: HeaderProps) {
  const { state, selectedAccount, accountTrades, accountPayouts, refreshPayouts, dispatch } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [showRequestPayoutModal, setShowRequestPayoutModal] = useState(false);
  const [showManagePayoutsModal, setShowManagePayoutsModal] = useState(false);

  // Form state for Request Payout modal
  const [payoutForm, setPayoutForm] = useState({
    requested_amount: '',
    request_date: today,
    notes: '',
  });
  const [savingPayout, setSavingPayout] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const monthPnL = calcMonthPnL(accountTrades, now.getFullYear(), now.getMonth());
  const todayPnL = calcTodayPnL(accountTrades);
  const totalPnL = calcTotalPnL(accountTrades);
  const initialBalance = selectedAccount?.initial_balance ?? 50000;
  const currentBalance = initialBalance + totalPnL;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleRequestPayoutSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.selectedAccountId) return;
    setSavingPayout(true);
    const reqAmount = parseFloat(payoutForm.requested_amount) || 0;
    await supabase.from('payouts').insert({
      account_id: state.selectedAccountId,
      requested_amount: reqAmount,
      request_date: payoutForm.request_date,
      finalized_amount: null,
      finalized_date: null,
      status: 'pending',
      notes: payoutForm.notes.trim() || 'Bi-Weekly Profit Split Request',
    });
    await refreshPayouts();
    setSavingPayout(false);
    setShowRequestPayoutModal(false);
    setPayoutForm({ requested_amount: '', request_date: today, notes: '' });
  }

  async function updatePayoutStatus(id: string, status: Payout['status']) {
    const payout = accountPayouts.find((p) => p.id === id);
    let finAmount = payout?.finalized_amount;
    let finDate = payout?.finalized_date;

    if (status === 'approved') {
      finAmount = payout?.finalized_amount || (payout ? Math.round(payout.requested_amount * 0.9) : 0);
      finDate = payout?.finalized_date || today;
    } else if (status === 'pending') {
      finAmount = null;
      finDate = null;
    }

    await supabase.from('payouts').update({
      status,
      finalized_amount: finAmount,
      finalized_date: finDate,
    }).eq('id', id);
    await refreshPayouts();
  }

  async function handleDeletePayout(id: string) {
    if (!confirm('Are you sure you want to remove this payout record?')) return;
    await supabase.from('payouts').delete().eq('id', id);
    await refreshPayouts();
  }

  return (
    <header className="border-b border-[#1e293b] bg-[#0b0e14]/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Top-Left: Clean Account Switcher Only (APEX logo removed per user request) */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#121824] hover:bg-[#182234] border border-[#1e293b] transition-all group shadow-sm"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-amber-400 font-bold text-sm sm:text-base tracking-wide font-mono">
                  {selectedAccount ? selectedAccount.name : 'No Account'}
                </span>
                {state.accounts.length > 1 && (
                  <ChevronDown
                    className={`w-4 h-4 text-amber-400/70 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              <AnimatePresence>
                {dropdownOpen && state.accounts.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-64 border border-[#1e293b] rounded-xl overflow-hidden shadow-2xl z-50 p-1.5 bg-[#121824]"
                  >
                    <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold font-mono">
                      Select Account
                    </div>
                    {state.accounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => {
                          dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: acc.id });
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                          acc.id === state.selectedAccountId
                            ? 'bg-[#10b981]/15 text-white font-semibold border border-[#10b981]/30'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              acc.id === state.selectedAccountId ? 'bg-[#10b981]' : 'bg-slate-600'
                            }`}
                          />
                          <span className="font-mono">{acc.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatCurrency(acc.initial_balance)}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center / Right: Metrics & + Action Button */}
          <div className="flex items-center gap-4 sm:gap-7">
            {/* Account Balance */}
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1.5 justify-end">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-medium">Account Balance</p>
              </div>
              <p className="text-base sm:text-lg font-bold font-mono text-white">
                {formatCurrency(currentBalance)}
              </p>
            </div>

            <div className="w-px h-8 bg-[#1e293b] hidden sm:block" />

            {/* Monthly P&L */}
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-0.5">Month P&L</p>
              <p
                className={`text-sm sm:text-base font-bold font-mono ${
                  monthPnL >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}
              >
                {monthPnL >= 0 ? '+' : ''}{formatCurrency(monthPnL)}
              </p>
            </div>

            <div className="w-px h-8 bg-[#1e293b] hidden md:block" />

            {/* Today's P&L */}
            <div className="text-right hidden md:block">
              <div className="flex items-center gap-1.5 justify-end">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-medium">Today P&L</p>
              </div>
              <p
                className={`text-sm sm:text-base font-bold font-mono ${
                  todayPnL >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                }`}
              >
                {todayPnL !== 0 ? (todayPnL > 0 ? '+' : '') + formatCurrency(todayPnL) : '$0'}
              </p>
            </div>

            {/* Top-Right: "+" Action Button (Only visible on /journal) */}
            {showPlusButton && (
              <div className="relative" ref={plusMenuRef}>
                <button
                  onClick={() => setPlusMenuOpen((o) => !o)}
                  className="w-10 h-10 rounded-xl bg-[#10b981] hover:bg-[#059669] text-[#0b0e14] font-extrabold flex items-center justify-center transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)] active:scale-95"
                  title="Actions Menu"
                >
                  <Plus
                    className={`w-5 h-5 transition-transform duration-200 ${plusMenuOpen ? 'rotate-45' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {plusMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-72 border border-[#1e293b] rounded-2xl overflow-hidden shadow-2xl z-50 p-2 bg-[#121824]"
                    >
                      <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold font-mono border-b border-white/5 mb-1.5">
                        Quick Operations
                      </div>

                      {/* 1. Log New Trade */}
                      <button
                        onClick={() => {
                          dispatch({ type: 'SET_ACTIVE_TAB', payload: 'trade-entry' });
                          setPlusMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-3 ${
                          state.activeTab === 'trade-entry'
                            ? 'bg-[#22c55e]/15 text-white font-semibold border border-[#22c55e]/30'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center text-[#22c55e]">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">Log Trade</div>
                          <div className="text-[10px] text-slate-400">Add session futures trade</div>
                        </div>
                      </button>

                      {/* 2. Request Payout */}
                      <button
                        onClick={() => {
                          setShowRequestPayoutModal(true);
                          setPlusMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-3 text-slate-300 hover:bg-white/5 mt-1"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">Request Payout</div>
                          <div className="text-[10px] text-slate-400">Submit new profit distribution</div>
                        </div>
                      </button>

                      {/* 3. Manage Payout Status */}
                      <button
                        onClick={() => {
                          setShowManagePayoutsModal(true);
                          setPlusMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-3 text-slate-300 hover:bg-white/5 mt-1"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">Payout Status & Management</div>
                          <div className="text-[10px] text-slate-400">Approve or update payout status</div>
                        </div>
                      </button>

                      <div className="h-px bg-white/5 my-1.5" />

                      {/* 4. Trading Accounts */}
                      <button
                        onClick={() => {
                          dispatch({ type: 'SET_ACTIVE_TAB', payload: 'accounts' });
                          setPlusMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-3 ${
                          state.activeTab === 'accounts'
                            ? 'bg-[#22c55e]/15 text-white font-semibold border border-[#22c55e]/30'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-500/15 border border-slate-500/30 flex items-center justify-center text-slate-300">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">Trading Accounts</div>
                          <div className="text-[10px] text-slate-400">Balance & drawdown limits</div>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Request Payout Modal (Triggered from "+" button) */}
      <AnimatePresence>
        {showRequestPayoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowRequestPayoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl relative bg-[#121217]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#22c55e]" />
                  Request New Payout
                </h3>
                <button
                  onClick={() => setShowRequestPayoutModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRequestPayoutSubmit} className="py-4 space-y-4">
                <div>
                  <label className="field-label">Requested Amount ($) *</label>
                  <input
                    className="field-input font-mono font-bold text-white"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={payoutForm.requested_amount}
                    onChange={(e) => setPayoutForm({ ...payoutForm, requested_amount: e.target.value })}
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    Estimated 90% Trader Net: {payoutForm.requested_amount ? formatCurrency(parseFloat(payoutForm.requested_amount) * 0.9) : '$0'}
                  </span>
                </div>

                <div>
                  <label className="field-label">Request Date *</label>
                  <input
                    className="field-input font-mono"
                    type="date"
                    value={payoutForm.request_date}
                    onChange={(e) => setPayoutForm({ ...payoutForm, request_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Notes & Cycle Reference</label>
                  <input
                    className="field-input text-xs"
                    placeholder="e.g. Bi-Weekly Profit Split"
                    value={payoutForm.notes}
                    onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestPayoutModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPayout}
                    className="btn-primary flex items-center gap-1.5 px-5 py-2 font-mono text-xs font-bold"
                  >
                    <Check className="w-4 h-4" />
                    {savingPayout ? 'Submitting...' : 'Confirm Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manage Payout Status Modal (Triggered from "+" button) */}
      <AnimatePresence>
        {showManagePayoutsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowManagePayoutsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel w-full max-w-2xl rounded-2xl border border-white/10 p-6 shadow-2xl relative bg-[#121217] max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Payout Status Management
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Update payout approval status, mark as completed, or delete records
                  </p>
                </div>
                <button
                  onClick={() => setShowManagePayoutsModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable list of payouts for management */}
              <div className="py-4 space-y-2.5 overflow-y-auto flex-1 pr-1 font-mono">
                {accountPayouts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No payout records found.
                  </div>
                ) : (
                  [...accountPayouts]
                    .sort((a, b) => b.request_date.localeCompare(a.request_date))
                    .map((p) => {
                      const isApproved = p.status === 'approved';
                      const isPending = p.status === 'pending';
                      return (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{p.request_date}</span>
                              <span className="text-slate-400 font-semibold">
                                {formatCurrency(p.requested_amount)}
                              </span>
                              {p.finalized_amount && (
                                <span className="text-[#22c55e] font-bold">
                                  (Net: {formatCurrency(p.finalized_amount)})
                                </span>
                              )}
                            </div>
                            {p.notes && (
                              <p className="text-[11px] text-slate-400 font-sans mt-0.5">{p.notes}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Pro Status Selector */}
                            <select
                              value={p.status}
                              onChange={(e) => updatePayoutStatus(p.id, e.target.value as Payout['status'])}
                              className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border cursor-pointer outline-none ${
                                isApproved
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : isPending
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              <option value="approved" className="bg-[#18181b] text-emerald-400">
                                ● APPROVED
                              </option>
                              <option value="pending" className="bg-[#18181b] text-amber-400">
                                ● PROCESSING
                              </option>
                              <option value="rejected" className="bg-[#18181b] text-rose-400">
                                ● REJECTED
                              </option>
                            </select>

                            <button
                              onClick={() => handleDeletePayout(p.id)}
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-500/20 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-colors"
                              title="Delete Payout"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setShowManagePayoutsModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
