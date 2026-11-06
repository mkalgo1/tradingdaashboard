import { ShieldCheck, DollarSign, Clock, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Payout } from '../../types';
import { formatCurrency } from '../../lib/calculations';

export default function PayoutsTab() {
  const { accountPayouts } = useApp();

  const approvedPayouts = accountPayouts.filter((p) => p.status === 'approved');
  const pendingPayouts = accountPayouts.filter((p) => p.status === 'pending');
  const totalRequested = accountPayouts.reduce((s, p) => s + p.requested_amount, 0);
  const totalFinalized = approvedPayouts.reduce(
    (s, p) => s + (p.finalized_amount ?? p.requested_amount * 0.9),
    0
  );
  const totalPendingAmount = pendingPayouts.reduce((s, p) => s + p.requested_amount, 0);
  const avgPayout = approvedPayouts.length > 0 ? totalFinalized / approvedPayouts.length : 0;

  // Sort payouts by date descending (latest first)
  const sortedPayouts = [...accountPayouts].sort((a, b) => b.request_date.localeCompare(a.request_date));

  return (
    <div className="space-y-6">
      {/* Institutional Treasury Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Received */}
        <div className="glass-panel relative rounded-2xl p-5 border border-white/5 shadow-xl shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Total Paid Out</span>
            <div className="w-7 h-7 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
            </div>
          </div>
          <div className="my-2">
            <span
              className="text-2xl sm:text-3xl font-extrabold font-mono text-[#22c55e]"
              style={{ textShadow: '0 0 20px rgba(34,197,94,0.3)' }}
            >
              {formatCurrency(totalFinalized)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5 font-mono">
            <span>{approvedPayouts.length} Approved Cycles</span>
            <span className="text-[#22c55e] font-semibold">90% Split</span>
          </div>
        </div>

        {/* Total Requested */}
        <div className="glass-panel relative rounded-2xl p-5 border border-white/5 shadow-xl shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Gross Requested</span>
            <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {formatCurrency(totalRequested)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5 font-mono">
            <span>All Bi-Weekly Cycles</span>
            <span className="text-white font-semibold">100% Eligible</span>
          </div>
        </div>

        {/* Pending Payout */}
        <div className="glass-panel relative rounded-2xl p-5 border border-white/5 shadow-xl shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Pending Processing</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
          </div>
          <div className="my-2">
            <span
              className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400"
              style={{ textShadow: '0 0 20px rgba(251,191,36,0.25)' }}
            >
              {formatCurrency(totalPendingAmount)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5 font-mono">
            <span>{pendingPayouts.length} Active Request</span>
            <span className="text-amber-400 font-semibold">Under Review</span>
          </div>
        </div>

        {/* Average Bi-Weekly Payout */}
        <div className="glass-panel relative rounded-2xl p-5 border border-white/5 shadow-xl shadow-black/20 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Avg 2-Week Payout</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {formatCurrency(avgPayout)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5 font-mono">
            <span>Every 2nd Friday</span>
            <span className="text-emerald-400 font-semibold">Consistent</span>
          </div>
        </div>
      </div>

      {/* Payouts Table (View Only) */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {['Request Date', 'Requested', 'Profit Split', 'Finalized / Paid', 'Status'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3.5 text-xs text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {sortedPayouts.map((p: Payout) => {
                const isApproved = p.status === 'approved';
                const isPending = p.status === 'pending';
                const netAmount = p.finalized_amount ?? (isApproved ? p.requested_amount * 0.9 : null);

                return (
                  <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                    {/* Request Date */}
                    <td className="px-5 py-4 text-slate-300 text-xs whitespace-nowrap font-semibold">
                      {p.request_date}
                    </td>

                    {/* Requested Gross Amount */}
                    <td className="px-5 py-4 text-white font-bold text-xs whitespace-nowrap">
                      {formatCurrency(p.requested_amount)}
                    </td>

                    {/* Profit Split */}
                    <td className="px-5 py-4 text-slate-400 text-xs whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[11px]">
                        90% Trader
                      </span>
                    </td>

                    {/* Finalized Net Amount */}
                    <td className="px-5 py-4 text-xs whitespace-nowrap">
                      {netAmount !== null ? (
                        <span className="font-extrabold text-[#22c55e] text-sm">
                          +{formatCurrency(netAmount)}
                        </span>
                      ) : (
                        <span className="text-amber-400/80 italic text-xs font-sans">
                          Pending Approval
                        </span>
                      )}
                    </td>

                    {/* Read-Only Pro Status Badge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full border ${
                          isApproved
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(34,197,94,0.15)]'
                            : isPending
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isApproved
                              ? 'bg-emerald-400'
                              : isPending
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-rose-400'
                          }`}
                        />
                        {isApproved ? 'APPROVED' : isPending ? 'PROCESSING' : 'REJECTED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
