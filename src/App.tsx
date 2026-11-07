import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard';
import AccountsTab from './components/Accounts/AccountsTab';
import PayoutsTab from './components/Payouts/PayoutsTab';
import AchievementsTab from './components/Achievements/AchievementsTab';
import SmoothScroll from './components/ui/SmoothScroll';
import SliderMenu from './components/Layout/SliderMenu';
import JournalPortal from './components/JournalPortal/JournalPortal';

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
  const { state } = useApp();
  const [isJournal, setIsJournal] = useState(checkIsJournal);
  const [sliderOpen, setSliderOpen] = useState(false);

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

  if (state.loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-500/20 border-t-[#10b981] rounded-full animate-spin shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
          <p className="text-slate-400 font-mono text-xs tracking-wider uppercase">Loading TradeZella Dashboard...</p>
        </div>
      </div>
    );
  }

  // --- SEPARATE /journal PORTAL ---
  // Strictly for logging trades, requesting payouts (with amount & accepted/pending/rejected status),
  // and managing accounts. Has NO access to the main viewing dashboard.
  if (isJournal) {
    return (
      <SmoothScroll>
        <JournalPortal />
      </SmoothScroll>
    );
  }

  // --- MAIN VIEWING DASHBOARD ---
  // Strictly for viewing KPI metrics, calendar P&L, payouts history, and achievements.
  return (
    <SmoothScroll>
      <div className="min-h-screen text-slate-100 relative bg-[#0b0e14] selection:bg-indigo-500/30 selection:text-white overflow-x-hidden w-full max-w-full">
        {/* TradeZella Ambient Atmospheric Glows */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[150px] bg-indigo-600/5" />
          <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full blur-[160px] bg-emerald-500/5" />
          <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full blur-[150px] bg-purple-600/4" />
        </div>

        {/* Top Header with Three-Dots Menu Slider & Small Grey Account Switcher */}
        <Header
          showPlusButton={false}
          onOpenSlider={() => setSliderOpen(true)}
        />

        {/* Navigation Slider Drawer (Shades website behind when open) */}
        <SliderMenu
          isOpen={sliderOpen}
          onClose={() => setSliderOpen(false)}
          onNavigateToDashboard={() => {}}
        />

        <main
          className={`relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300 ${
            sliderOpen ? 'filter brightness-50 pointer-events-none' : ''
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={state.activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {state.activeTab === 'dashboard' && <Dashboard />}
              {state.activeTab === 'payouts' && <PayoutsTab />}
              {state.activeTab === 'achievements' && <AchievementsTab />}
              {state.activeTab === 'accounts' && <AccountsTab />}
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
