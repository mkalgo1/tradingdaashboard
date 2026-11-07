import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LayoutDashboard,
  DollarSign,
  Trophy,
  BookOpen,
  Wallet,
  Plus,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TabType } from '../../types';
import { formatCurrency, calcTotalPnL } from '../../lib/calculations';

interface SliderMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToJournal: () => void;
  onNavigateToDashboard: () => void;
}

export default function SliderMenu({
  isOpen,
  onClose,
  onNavigateToJournal,
  onNavigateToDashboard,
}: SliderMenuProps) {
  const { state, dispatch, selectedAccount, accountTrades, accountPayouts } = useApp();

  const totalPnL = calcTotalPnL(accountTrades);
  const initialBalance = selectedAccount?.initial_balance ?? 50000;
  const currentBalance = initialBalance + totalPnL;

  function handleTabSelect(tab: TabType) {
    onNavigateToDashboard();
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
    onClose();
  }

  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: 'PRO',
      badgeColor: 'bg-emerald-500/20 text-[#10b981] border-[#10b981]/30',
      description: 'KPI metrics, calendar & equity curve',
    },
    {
      id: 'payouts' as TabType,
      label: 'Payouts',
      icon: DollarSign,
      badge: `${accountPayouts.length} cycles`,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      description: 'Bi-weekly profit split tracking',
    },
    {
      id: 'achievements' as TabType,
      label: 'Achievements',
      icon: Trophy,
      badge: `${state.achievements.length}`,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      description: 'Trader milestones & certs',
    },
    {
      id: 'accounts' as TabType,
      label: 'Accounts',
      icon: Wallet,
      badge: `${state.accounts.length}`,
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      description: 'Manage funded accounts & drawdown',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Slider Drawer (Left Side) */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 left-0 bottom-0 w-[300px] sm:w-[340px] max-w-[85vw] bg-[#0e1320] border-r border-[#1e293b] flex flex-col justify-between shadow-2xl z-50 text-slate-200"
          >
            {/* Top Branding & Close Button */}
            <div>
              <div className="p-4 sm:p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#0b0e14]/50">
                <div className="flex items-center gap-2.5">
                  {/* TradeZella Gradient Logo Icon */}
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#10b981] flex items-center justify-center shadow-lg shadow-purple-600/30">
                    <span className="text-white font-black text-sm tracking-tighter">TZ</span>
                  </div>
                  <div>
                    <h1 className="font-extrabold text-sm sm:text-base tracking-wider text-white font-mono flex items-center gap-1">
                      <span>TRADEZELLA</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                        PRO
                      </span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-mono">Institutional Journal</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  title="Close Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* TradeZella Signature: "+ Add Trade" Button */}
              <div className="p-4 sm:p-5 pb-2">
                <button
                  onClick={() => {
                    onNavigateToJournal();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#6366f1] hover:from-[#6d28d9] hover:to-[#4f46e5] text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all transform active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Add Trade / Journal</span>
                </button>
              </div>

              {/* Navigation Items Group */}
              <div className="p-3 sm:p-4 space-y-1">
                <div className="px-3 py-1.5 text-[10px] uppercase font-mono font-bold tracking-widest text-slate-500">
                  Navigation Menu
                </div>

                {navItems.map((item) => {
                  const isActive = state.activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabSelect(item.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/15 via-[#121824] to-[#121824] border border-[#10b981]/30 text-white font-semibold shadow-md'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-[#151c2d] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isActive
                              ? 'bg-[#10b981]/20 text-[#10b981]'
                              : 'bg-white/5 text-slate-400 group-hover:text-white'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-tight">{item.label}</p>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5 font-sans">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </button>
                  );
                })}

                {/* Sided URL: Daily Journal shortcut */}
                <button
                  onClick={() => {
                    onNavigateToJournal();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-[#151c2d] border border-transparent transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-tight text-slate-300">Daily Journal</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5 font-mono">/journal route</p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Bottom Account & Trader Status Pill */}
            <div className="p-4 sm:p-5 border-t border-[#1e293b] bg-[#0b0e14]/60 space-y-3">
              {/* Account Quick Glance */}
              <div className="p-3 rounded-xl bg-[#121824] border border-[#1e293b] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      {selectedAccount?.name ?? 'LIVE ACCOUNT'}
                    </span>
                  </div>
                  <p className="text-sm font-bold font-mono text-white mt-0.5">
                    {formatCurrency(currentBalance)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-400 block">Net P&L</span>
                  <span
                    className={`text-xs font-bold font-mono ${
                      totalPnL >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                    }`}
                  >
                    {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                  </span>
                </div>
              </div>

              {/* User Profile Footer (TradeZella Style: 'Trading Queen' / Pro Trader) */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold border border-white/10">
                    👑
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white leading-tight">Apex Trader</p>
                    <p className="text-[10px] text-[#10b981] font-mono font-medium">Institutional Plan</p>
                  </div>
                </div>

                <div className="px-2 py-1 rounded-lg bg-[#121824] border border-[#1e293b] text-[10px] font-mono text-slate-400">
                  v2.4
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
