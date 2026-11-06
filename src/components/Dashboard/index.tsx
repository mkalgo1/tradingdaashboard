import CalendarView from './CalendarView';
import KPICards from './KPICards';
import EquityCurve from './EquityCurve';
import { useApp } from '../../context/AppContext';

export default function Dashboard() {
  const { state } = useApp();

  if (!state.selectedAccountId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">No Account Selected</h3>
        <p className="text-slate-500 text-sm">Go to the Accounts tab to create your first trading account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <CalendarView />
      <KPICards />
      <EquityCurve />
    </div>
  );
}
