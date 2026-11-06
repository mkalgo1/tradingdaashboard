import { useState } from 'react';
import { Plus, X, Check, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { Payout } from '../../types';
import { formatCurrency } from '../../lib/calculations';

const today = new Date().toISOString().split('T')[0];
const emptyForm = { requested_amount: '', request_date: today, finalized_amount: '', finalized_date: '', status: 'pending' as Payout['status'], notes: '' };

const STATUS_STYLES: Record<Payout['status'], string> = {
  pending: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  approved: 'bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20',
  rejected: 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20',
};

const STATUS_ICONS: Record<Payout['status'], React.ElementType> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

export default function PayoutsTab() {
  const { state, accountPayouts, refreshPayouts } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.selectedAccountId) return;
    setSaving(true);
    await supabase.from('payouts').insert({
      account_id: state.selectedAccountId,
      requested_amount: parseFloat(form.requested_amount) || 0,
      request_date: form.request_date,
      finalized_amount: form.finalized_amount ? parseFloat(form.finalized_amount) : null,
      finalized_date: form.finalized_date || null,
      status: form.status,
      notes: form.notes.trim(),
    });
    await refreshPayouts();
    setSaving(false);
    setShowForm(false);
    setForm(emptyForm);
  }

  async function updateStatus(id: string, status: Payout['status']) {
    await supabase.from('payouts').update({ status }).eq('id', id);
    await refreshPayouts();
  }

  async function handleDelete(id: string) {
    await supabase.from('payouts').delete().eq('id', id);
    await refreshPayouts();
  }

  const totalRequested = accountPayouts.reduce((s, p) => s + p.requested_amount, 0);
  const totalFinalized = accountPayouts.filter((p) => p.status === 'approved').reduce((s, p) => s + (p.finalized_amount ?? p.requested_amount), 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Requested</p>
          <p className="text-xl font-bold font-mono text-white">{formatCurrency(totalRequested)}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Received</p>
          <p className="text-xl font-bold font-mono text-[#22c55e]">{formatCurrency(totalFinalized)}</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Pending</p>
          <p className="text-xl font-bold font-mono text-yellow-400">
            {accountPayouts.filter((p) => p.status === 'pending').length}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Payout Requests</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Request Payout
        </button>
      </div>

      {showForm && (
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <h3 className="text-sm font-bold text-white mb-4">New Payout Request</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="field-label">Requested Amount ($) *</label>
              <input
                className="field-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.requested_amount}
                onChange={(e) => setForm({ ...form, requested_amount: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">Request Date *</label>
              <input
                className="field-input"
                type="date"
                value={form.request_date}
                onChange={(e) => setForm({ ...form, request_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="field-label">Status</label>
              <select
                className="field-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Payout['status'] })}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="field-label">Finalized Amount ($)</label>
              <input
                className="field-input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.finalized_amount}
                onChange={(e) => setForm({ ...form, finalized_amount: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Finalized Date</label>
              <input
                className="field-input"
                type="date"
                value={form.finalized_date}
                onChange={(e) => setForm({ ...form, finalized_date: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Notes</label>
              <input
                className="field-input"
                placeholder="Optional notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <div className="col-span-2 sm:col-span-3 flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                <Check className="w-4 h-4" />
                {saving ? 'Saving...' : 'Submit Request'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {accountPayouts.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center text-slate-600 text-sm">
          No payout requests yet
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Request Date', 'Requested', 'Finalized', 'Finalized Date', 'Status', 'Notes', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accountPayouts.map((p: Payout) => {
                const StatusIcon = STATUS_ICONS[p.status];
                return (
                  <tr key={p.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-slate-300 font-mono text-xs whitespace-nowrap">{p.request_date}</td>
                    <td className="px-4 py-3 text-white font-bold font-mono text-xs whitespace-nowrap">
                      {formatCurrency(p.requested_amount)}
                    </td>
                    <td className={`px-4 py-3 font-mono text-xs whitespace-nowrap ${p.finalized_amount ? 'text-[#22c55e] font-bold' : 'text-slate-600'}`}>
                      {p.finalized_amount ? formatCurrency(p.finalized_amount) : '–'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs whitespace-nowrap">
                      {p.finalized_date ?? '–'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={p.status}
                        onChange={(e) => updateStatus(p.id, e.target.value as Payout['status'])}
                        className={`text-xs px-2.5 py-1 rounded-full border font-medium cursor-pointer bg-transparent outline-none ${STATUS_STYLES[p.status]}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs max-w-[100px] truncate">{p.notes || '–'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="w-7 h-7 rounded-lg bg-white/3 hover:bg-[#ef4444]/10 flex items-center justify-center text-slate-600 hover:text-[#ef4444] transition-colors"
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
      )}
    </div>
  );
}
