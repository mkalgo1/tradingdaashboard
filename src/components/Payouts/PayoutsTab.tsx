import { useState } from 'react';
import { Plus, X, Check, Clock, CheckCircle2, XCircle, DollarSign, ArrowUpRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { Payout } from '../../types';
import { formatCurrency } from '../../lib/calculations';

const today = new Date().toISOString().split('T')[0];
const emptyForm = {
  requested_amount: '',
  request_date: today,
  finalized_amount: '',
  finalized_date: '',
  status: 'pending' as Payout['status'],
  notes: '',
};

export default function PayoutsTab() {
  const { state, accountPayouts, refreshPayouts } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.selectedAccountId) return;
    setSaving(true);
    const reqAmount = parseFloat(form.requested_amount) || 0;
    const finAmount = form.finalized_amount ? parseFloat(form.finalized_amount) : form.status === 'approved' ? reqAmount * 0.9 : null;

    await supabase.from('payouts').insert({
      account_id: state.selectedAccountId,
      requested_amount: reqAmount,
      request_date: form.request_date,
      finalized_amount: finAmount,
      finalized_date: form.finalized_date || (form.status === 'approved' ? form.request_date : null),
      status: form.status,
      notes: form.notes.trim() || `Bi-Weekly Payout Request`,
    });
    await refreshPayouts();
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm);
  }

  async function updateStatus(id: string, status: Payout['status']) {
    const payout = accountPayouts.find((p) => p.id === id);
    let finAmount = payout?.finalized_amount;
    let finDate = payout?.finalized_date;

    if (status === 'approved') {
      finAmount = payout?.finalized_amount || (payout ? payout.requested_amount * 0.9 : 0);
      finDate = payout?.finalized_date || today;
    } else if (status === 'pending') {
      finAmount = null;
      finDate = null;
    }

    await supabase.from('payouts').update({
      status,
      finalized_amount: finAmount,
      finalized_date: finDate,
    }).eq('id', id);
    await refreshPayouts();
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this payout record?')) return;
    setDeleteId(id);
    await supabase.from('payouts').delete().eq('id', id);
    await refreshPayouts();
    setDeleteId(null);
  }

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

      {/* Header and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Bi-Weekly Payout Schedule</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 font-mono font-bold">
              18 Cycles Recorded
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic profit distribution scheduled every two trading weeks on Friday
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2.5 font-bold font-mono text-xs"
        >
          <Plus className="w-4 h-4" />
          Request New Payout
        </button>
      </div>

      {/* New Payout Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 p-6 shadow-2xl relative bg-[#121217]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#22c55e]" />
                  Submit Payout Request
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Requested Amount ($) *</label>
                    <input
                      className="field-input font-mono font-bold text-white"
                      type="number"
                      step="0.01"
                      placeholder="e.g. 5000"
                      value={form.requested_amount}
                      onChange={(e) => setForm({ ...form, requested_amount: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="field-label">Request Date *</label>
                    <input
                      className="field-input font-mono"
                      type="date"
                      value={form.request_date}
                      onChange={(e) => setForm({ ...form, request_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">Status</label>
                    <select
                      className="field-input font-mono text-xs"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as Payout['status'] })}
                    >
                      <option value="pending">PENDING</option>
                      <option value="approved">APPROVED</option>
                      <option value="rejected">REJECTED</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">Finalized Amount ($)</label>
                    <input
                      className="field-input font-mono font-bold text-[#22c55e]"
                      type="number"
                      step="0.01"
                      placeholder="Auto (90% split)"
                      value={form.finalized_amount}
                      onChange={(e) => setForm({ ...form, finalized_amount: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Cycle Notes & Period</label>
                  <input
                    className="field-input text-xs"
                    placeholder="e.g. Bi-Weekly Cycle #19 (2-Week Profit Split)"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex items-center gap-1.5 px-5 py-2 font-mono text-xs font-bold"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Confirm Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payouts Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                {['Cycle / Period', 'Request Date', 'Requested', 'Profit Split', 'Finalized / Paid', 'Status', 'Notes', ''].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3.5 text-xs text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {sortedPayouts.map((p: Payout, idx: number) => {
                const isApproved = p.status === 'approved';
                const isPending = p.status === 'pending';
                const isRejected = p.status === 'rejected';
                const netAmount = p.finalized_amount ?? (isApproved ? p.requested_amount * 0.9 : null);

                return (
                  <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                    {/* Cycle identifier */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-bold text-xs text-white">
                        Cycle #{sortedPayouts.length - idx}
                      </span>
                      {p.request_date === today && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                          CURRENT
                        </span>
                      )}
                    </td>

                    {/* Request Date */}
                    <td className="px-4 py-3.5 text-slate-300 text-xs whitespace-nowrap">
                      {p.request_date}
                    </td>

                    {/* Requested Gross Amount */}
                    <td className="px-4 py-3.5 text-white font-bold text-xs whitespace-nowrap">
                      {formatCurrency(p.requested_amount)}
                    </td>

                    {/* Profit Split */}
                    <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 text-[10px]">
                        90% Trader
                      </span>
                    </td>

                    {/* Finalized Net Amount */}
                    <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                      {netAmount !== null ? (
                        <span className="font-extrabold text-[#22c55e]">
                          +{formatCurrency(netAmount)}
                        </span>
                      ) : (
                        <span className="text-amber-400/80 italic text-[11px]">
                          Pending Approval
                        </span>
                      )}
                    </td>

                    {/* Pro Status Badge / Selector */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <select
                        value={p.status}
                        onChange={(e) => updateStatus(p.id, e.target.value as Payout['status'])}
                        className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border cursor-pointer outline-none transition-all ${
                          isApproved
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(34,197,94,0.15)]'
                            : isPending
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        <option value="approved" className="bg-[#18181b] text-emerald-400">
                          ● APPROVED
                        </option>
                        <option value="pending" className="bg-[#18181b] text-amber-400">
                          ● PROCESSING
                        </option>
                        <option value="rejected" className="bg-[#18181b] text-rose-400">
                          ● REJECTED
                        </option>
                      </select>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3.5 text-slate-400 text-xs max-w-[260px] truncate font-sans">
                      {p.notes || `Bi-Weekly Profit Split`}
                    </td>

                    {/* Delete action */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleteId === p.id}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-500/20 flex items-center justify-center text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Payout Record"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
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
