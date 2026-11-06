import { useState, useRef, useEffect } from 'react';
import { ChevronDown, TrendingUp, Sun, Moon, ShieldCheck, Activity, Settings, BookOpen, Wallet, PlusCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { calcTodayPnL, calcMonthPnL, calcTotalPnL, formatCurrency } from '../../lib/calculations';

export default function Header() {
  const { state, selectedAccount, accountTrades, dispatch, toggleTheme } = useApp();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

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
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="border-b border-white/5 bg-[#09090b]/90 dark:bg-[#09090b]/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Account Selector & Brand */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#22c55e]/20 to-[#22c55e]/5 border border-[#22c55e]/30 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <TrendingUp className="w-5 h-5 text-[#22c55e]" />
              </div>
              <div className="hidden md:block">
                <span className="text-sm font-black tracking-wider text-white uppercase bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Apex Journal
                </span>
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30">
                  PRO
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-white/10 hidden md:block" />

            {/* Account Switcher */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
              >
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-amber-400 font-bold text-xs sm:text-sm tracking-wide font-mono">
                  {selectedAccount ? selectedAccount.name : 'No Account'}
                </span>
                {state.accounts.length > 1 && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-amber-400/60 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
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
                    className="absolute top-full left-0 mt-2 w-64 glass-panel border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 p-1"
                  >
                    <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
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
                            ? 'bg-[#22c55e]/15 text-white font-semibold border border-[#22c55e]/30'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              acc.id === state.selectedAccountId ? 'bg-[#22c55e]' : 'bg-slate-600'
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

          {/* Quick Metrics, Theme & Settings */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Account Balance */}
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3 h-3 text-[#22c55e]" />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Account Balance</p>
              </div>
              <p className="text-sm sm:text-base font-bold font-mono text-white">
                {formatCurrency(currentBalance)}
              </p>
            </div>

            <div className="w-px h-8 bg-white/10 hidden sm:block" />

            {/* Monthly P&L */}
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono mb-0.5">Month P&L</p>
              <p
                className={`text-xs sm:text-sm font-bold font-mono ${
                  monthPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                }`}
              >
                {monthPnL >= 0 ? '+' : ''}{formatCurrency(monthPnL)}
              </p>
            </div>

            <div className="w-px h-8 bg-white/10 hidden md:block" />

            {/* Today's P&L */}
            <div className="text-right hidden md:block">
              <div className="flex items-center gap-1 justify-end">
                <Activity className="w-3 h-3 text-slate-400" />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Today P&L</p>
              </div>
              <p
                className={`text-xs sm:text-sm font-bold font-mono ${
                  todayPnL >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                }`}
              >
                {todayPnL !== 0 ? (todayPnL > 0 ? '+' : '') + formatCurrency(todayPnL) : '$0'}
              </p>
            </div>

            {/* Quick Log Trade Button */}
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'trade-entry' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold font-mono transition-all ${
                state.activeTab === 'trade-entry'
                  ? 'bg-[#22c55e] text-black border-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.35)]'
                  : 'bg-[#22c55e]/10 hover:bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Trade</span>
            </button>

            {/* Settings Icon & Dropdown Menu */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen((o) => !o)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                  settingsOpen || state.activeTab === 'accounts' || state.activeTab === 'trade-entry'
                    ? 'bg-[#22c55e]/15 border-[#22c55e]/40 text-[#22c55e]'
                    : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300 hover:text-white'
                }`}
                title="Settings & Accounts"
              >
                <Settings
                  className={`w-4 h-4 transition-transform duration-300 ${settingsOpen ? 'rotate-90' : ''}`}
                />
              </button>

              <AnimatePresence>
                {settingsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 w-64 glass-panel border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 p-1.5 bg-[#121217]"
                  >
                    <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-semibold font-mono border-b border-white/5 mb-1">
                      Settings & Configurations
                    </div>

                    <button
                      onClick={() => {
                        dispatch({ type: 'SET_ACTIVE_TAB', payload: 'trade-entry' });
                        setSettingsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-3 ${
                        state.activeTab === 'trade-entry'
                          ? 'bg-[#22c55e]/15 text-white font-semibold border border-[#22c55e]/30'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e]">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">Trade Entry</div>
                        <div className="text-[10px] text-slate-400">Log & manage session trades</div>
                      </div>
                      {state.activeTab === 'trade-entry' && (
                        <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        dispatch({ type: 'SET_ACTIVE_TAB', payload: 'accounts' });
                        setSettingsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-3 mt-1 ${
                        state.activeTab === 'accounts'
                          ? 'bg-[#22c55e]/15 text-white font-semibold border border-[#22c55e]/30'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">Trading Accounts</div>
                        <div className="text-[10px] text-slate-400">Balance & drawdown limits</div>
                      </div>
                      {state.activeTab === 'accounts' && (
                        <Check className="w-3.5 h-3.5 text-[#22c55e]" />
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center transition-colors"
              title={state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {state.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
