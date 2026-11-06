import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Layout/Header';
import TabNav from './components/Layout/TabNav';
import Dashboard from './components/Dashboard';
import AccountsTab from './components/Accounts/AccountsTab';
import TradeEntryTab from './components/TradeEntry/TradeEntryTab';
import PayoutsTab from './components/Payouts/PayoutsTab';
import AchievementsTab from './components/Achievements/AchievementsTab';
import SmoothScroll from './components/ui/SmoothScroll';

function checkIsJournal() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  return (
    path.startsWith('/journal') ||
    hash.startsWith('#/journal') ||
    hash === '#journal' ||
    search.get('page') === 'journal' ||
    search.get('route') === 'journal'
  );
}

function AppContent() {
  const { state, dispatch } = useApp();
  const [isJournal, setIsJournal] = useState(checkIsJournal);

  useEffect(() => {
    function handleLocation() {
      setIsJournal(checkIsJournal());
    }
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
    };
  }, []);

  function navigateTo(path: string) {
    window.history.pushState({}, '', path);
    setIsJournal(checkIsJournal());
    if (path === '/' || path === '') {
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'dashboard' });
    }
  }

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
      <div className="min-h-screen text-slate-100 relative bg-[#0b0e14] selection:bg-indigo-500/30 selection:text-white overflow-x-hidden w-full max-w-full">
        {/* TradeZella Ambient Atmospheric Glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[150px] bg-indigo-600/5" />
          <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full blur-[160px] bg-emerald-500/5" />
          <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full blur-[150px] bg-purple-600/4" />
        </div>

        {/* Top Header: show "+" action button only on /journal */}
        <Header showPlusButton={isJournal} />

        {/* If on /journal, show dedicated top sub-bar with Back to Dashboard button */}
        {isJournal ? (
          <nav className="border-b border-[#1e293b] bg-[#0b0e14]/90 backdrop-blur-md sticky top-16 z-40">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold font-mono">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>/journal</span>
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:inline font-mono">
                    Trade Execution Log &amp; Entry Portal
                  </span>
                </div>

                <button
                  onClick={() => navigateTo('/')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#121824] hover:bg-[#182234] text-slate-200 hover:text-white border border-[#1e293b] text-xs font-mono transition-colors shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#10b981]" />
                  <span>Back to Dashboard</span>
                </button>
              </div>
            </div>
          </nav>
        ) : (
          /* Clean viewing dashboard navigation (Dashboard, Payouts, Achievements) */
          <TabNav />
        )}

        <main className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={isJournal ? 'journal-view' : state.activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {isJournal ? (
                state.activeTab === 'accounts' ? <AccountsTab /> : <TradeEntryTab />
              ) : (
                <>
                  {state.activeTab === 'dashboard' && <Dashboard />}
                  {state.activeTab === 'payouts' && <PayoutsTab />}
                  {state.activeTab === 'achievements' && <AchievementsTab />}
                  {state.activeTab === 'accounts' && <AccountsTab />}
                </>
              )}
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
