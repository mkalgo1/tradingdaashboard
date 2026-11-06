import { useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { Account } from '../../types';
import { formatCurrency } from '../../lib/calculations';

const emptyForm = { name: '', initial_balance: '50000', max_drawdown: '48000', profit_target: '3000', commission_per_side: '0' };

export default function AccountsTab() {
  const { state, dispatch, refreshAccounts } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function startCreate() {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
    setError('');
  }

  function startEdit(acc: Account) {
    setForm({
      name: acc.name,
      initial_balance: String(acc.initial_balance),
      max_drawdown: String(acc.max_drawdown),
      profit_target: String(acc.profit_target),
      commission_per_side: String(acc.commission_per_side),
    });
    setEditId(acc.id);
    setShowForm(true);
    setError('');
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Account name is required'); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      initial_balance: parseFloat(form.initial_balance) || 50000,
      max_drawdown: parseFloat(form.max_drawdown) || 48000,
      profit_target: parseFloat(form.profit_target) || 3000,
      commission_per_side: parseFloat(form.commission_per_side) || 0,
    };
    if (editId) {
      await supabase.from('accounts').update(payload).eq('id', editId);
    } else {
      const { data } = await supabase.from('accounts').insert(payload).select().single();
      if (data && !state.selectedAccountId) {
        dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: data.id });
      }
    }
    await refreshAccounts();
    setSaving(false);
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this account and all its trades/data?')) return;
    await supabase.from('accounts').delete().eq('id', id);
    if (state.selectedAccountId === id) {
      const remaining = state.accounts.filter((a) => a.id !== id);
      dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: remaining[0]?.id ?? null });
    }
    await refreshAccounts();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Accounts</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage your trading accounts</p>
        </div>
        <button onClick={startCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Account
        </button>
      </div>

      {showForm && (
        <div className="glass-panel rounded-2xl p-5 border border-white/10">
          <h3 className="text-sm font-bold text-white mb-4">{editId ? 'Edit Account' : 'New Account'}</h3>
          {error && <p className="text-[#ef4444] text-xs mb-3">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="field-label">Account Name</label>
              <input
                className="field-input"
                placeholder="e.g. APEX Evaluation"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Initial Balance ($)</label>
              <input
                className="field-input"
                type="number"
                value={form.initial_balance}
                onChange={(e) => setForm({ ...form, initial_balance: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Max Drawdown Limit ($)</label>
              <input
                className="field-input"
                type="number"
                value={form.max_drawdown}
                onChange={(e) => setForm({ ...form, max_drawdown: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Profit Target ($)</label>
              <input
                className="field-input"
                type="number"
                value={form.profit_target}
                onChange={(e) => setForm({ ...form, profit_target: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Commission Per Side ($)</label>
              <input
                className="field-input"
                type="number"
                step="0.01"
                value={form.commission_per_side}
                onChange={(e) => setForm({ ...form, commission_per_side: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
              <Check className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost flex items-center gap-2">
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {state.accounts.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center text-slate-500 text-sm">
          No accounts yet. Create one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {state.accounts.map((acc) => (
            <div
              key={acc.id}
              className={`glass-panel rounded-2xl p-5 border transition-colors ${
                acc.id === state.selectedAccountId ? 'border-[#22c55e]/30' : 'border-white/5'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1 ${
                      acc.id === state.selectedAccountId ? 'bg-[#22c55e]' : 'bg-slate-600'
                    }`}
                  />
                  <div>
                    <h3 className="font-bold text-white">{acc.name}</h3>
                    {acc.id === state.selectedAccountId && (
                      <span className="text-[10px] text-[#22c55e] font-medium uppercase tracking-wider">Active</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dispatch({ type: 'SET_SELECTED_ACCOUNT', payload: acc.id })}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      acc.id === state.selectedAccountId
                        ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {acc.id === state.selectedAccountId ? 'Selected' : 'Select'}
                  </button>
                  <button
                    onClick={() => startEdit(acc)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#ef4444]/10 flex items-center justify-center text-slate-400 hover:text-[#ef4444] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Initial Balance</p>
                  <p className="text-sm font-mono font-bold text-white">{formatCurrency(acc.initial_balance)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Max Drawdown</p>
                  <p className="text-sm font-mono font-bold text-[#ef4444]">{formatCurrency(acc.max_drawdown)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Profit Target</p>
                  <p className="text-sm font-mono font-bold text-[#22c55e]">{formatCurrency(acc.profit_target)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Commission</p>
                  <p className="text-sm font-mono font-bold text-slate-300">${acc.commission_per_side}/side</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
