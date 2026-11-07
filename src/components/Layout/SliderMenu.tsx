import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TabType } from '../../types';
import { formatCurrency, calcTotalPnL } from '../../lib/calculations';

interface SliderMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToJournal?: () => void;
  onNavigateToDashboard: () => void;
}

export default function SliderMenu({
  isOpen,
  onClose,
  onNavigateToDashboard,
}: SliderMenuProps) {
  const { state, dispatch, selectedAccount, accountTrades } = useApp();

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
      description: 'KPI metrics, calendar & equity curve',
    },
    {
      id: 'payouts' as TabType,
      label: 'Payouts',
      description: 'Bi-weekly profit split tracking',
    },
    {
      id: 'achievements' as TabType,
      label: 'Achievements',
      description: 'Trader milestones & certs',
    },
    {
      id: 'accounts' as TabType,
      label: 'Accounts',
      description: 'Manage funded accounts & drawdown',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Deep Shading Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Slider Drawer (Left Side) */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] sm:w-[320px] max-w-[85vw] bg-[#0e1320] border-r border-[#1e293b] flex flex-col justify-between shadow-2xl z-50 text-slate-200"
          >
            {/* Top Branding & Close Button */}
            <div>
              <div className="p-4 sm:p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#0b0e14]/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#10b981] flex items-center justify-center shadow-lg shadow-purple-600/30">
                    <span className="text-white font-black text-sm tracking-tighter">TZ</span>
                  </div>
                  <div>
                    <h1 className="font-extrabold text-sm sm:text-base tracking-wider text-white font-mono flex items-center gap-1">
                      <span>TRADEZELLA</span>
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

              {/* Navigation Items Group (Clean, without icons/emoji or badges) */}
              <div className="p-3 sm:p-4 space-y-1.5">
                <div className="px-3 py-2 text-[10px] uppercase font-mono font-bold tracking-widest text-slate-500">
                  Navigation Menu
                </div>

                {navItems.map((item) => {
                  const isActive = state.activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabSelect(item.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-[#10b981]/15 border border-[#10b981]/30 text-white font-semibold shadow-md'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-[#151c2d] border border-transparent'
                      }`}
                    >
                      <p
                        className={`text-sm font-semibold leading-tight ${
                          isActive ? 'text-[#10b981]' : 'text-slate-200'
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-tight mt-1 font-sans">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Account & Trader Status Pill (Cleaned up, no emoji, no v2.4 badge) */}
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

              {/* User Profile Footer (Cleaned: no emoji, no v2.4 pill) */}
              <div className="flex items-center gap-2.5 pt-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-mono font-bold border border-white/10">
                  AT
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">Apex Trader</p>
                  <p className="text-[10px] text-[#10b981] font-mono font-medium">Institutional Plan</p>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
