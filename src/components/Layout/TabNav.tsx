import { LayoutDashboard, DollarSign, Trophy, ArrowLeft, BookOpen, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { TabType } from '../../types';

const PRIMARY_TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'payouts', label: 'Payouts', icon: DollarSign },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
];

export default function TabNav() {
  const { state, dispatch } = useApp();

  const isSettingsTab = state.activeTab === 'accounts';

  return (
    <nav className="border-b border-[#1e293b] bg-[#0b0e14]/90 backdrop-blur-md sticky top-16 z-40">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          {/* Main Navigation Tabs */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
            {PRIMARY_TABS.map(({ id, label, icon: Icon }) => {
              const active = state.activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: id })}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                    active
                      ? 'text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121824]'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTabBadge"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/15 to-emerald-500/10 border border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon className={`relative z-10 w-4 h-4 transition-colors ${active ? 'text-[#10b981]' : 'text-slate-400'}`} />
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}

            {/* When Accounts is active, show its active badge */}
            {isSettingsTab && (
              <div className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-500/20 via-emerald-500/15 to-emerald-500/10 border border-emerald-500/35 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                <Wallet className="w-4 h-4 text-[#10b981]" />
                <span>Accounts</span>
              </div>
            )}
          </div>

          {/* Quick Back to Dashboard button when viewing Accounts */}
          {isSettingsTab && (
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'dashboard' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121824] hover:bg-[#182234] text-slate-300 hover:text-white border border-[#1e293b] text-xs font-mono transition-colors shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
