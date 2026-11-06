import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Layout/Header';
import TabNav from './components/Layout/TabNav';
import Dashboard from './components/Dashboard';
import AccountsTab from './components/Accounts/AccountsTab';
import TradeEntryTab from './components/TradeEntry/TradeEntryTab';
import PayoutsTab from './components/Payouts/PayoutsTab';
import AchievementsTab from './components/Achievements/AchievementsTab';
import SmoothScroll from './components/ui/SmoothScroll';

function AppContent() {
  const { state } = useApp();

  if (state.loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-[#10b981] rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
          <p className="text-slate-400 font-mono text-xs tracking-wider uppercase">Loading TradeZella Journal...</p>
        </div>
      </div>
    );
  }

  return (
    <SmoothScroll>
      <div className="min-h-screen text-slate-100 relative bg-[#0b0e14] selection:bg-indigo-500/30 selection:text-white">
        {/* TradeZella Ambient Atmospheric Glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[150px] bg-indigo-600/5" />
          <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full blur-[160px] bg-emerald-500/5" />
          <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full blur-[150px] bg-purple-600/4" />
        </div>

        <Header />
        <TabNav />

        <main className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {state.activeTab === 'dashboard' && <Dashboard />}
              {state.activeTab === 'accounts' && <AccountsTab />}
              {state.activeTab === 'trade-entry' && <TradeEntryTab />}
              {state.activeTab === 'payouts' && <PayoutsTab />}
              {state.activeTab === 'achievements' && <AchievementsTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </SmoothScroll>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
