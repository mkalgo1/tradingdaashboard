import { LayoutDashboard, Wallet, BookOpen, DollarSign, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { TabType } from '../../types';

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'trade-entry', label: 'Trade Entry', icon: BookOpen },
  { id: 'payouts', label: 'Payouts', icon: DollarSign },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
];

export default function TabNav() {
  const { state, dispatch } = useApp();

  return (
    <nav className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-16 z-40">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 py-2 overflow-x-auto scrollbar-none">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = state.activeTab === id;
            return (
              <button
                key={id}
                onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: id })}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                  active
                    ? 'text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="activeTabBadge"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#22c55e]/20 via-[#22c55e]/15 to-[#22c55e]/10 border border-[#22c55e]/40 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className={`relative z-10 w-4 h-4 transition-colors ${active ? 'text-[#22c55e]' : 'text-slate-400'}`} />
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
