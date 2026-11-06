import { useState, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Search, Filter, Sparkles, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';
import { Trade } from '../../types';
import { formatCurrency } from '../../lib/calculations';

const today = new Date().toISOString().split('T')[0];

const emptyForm = {
  date: today,
  symbol: 'NQ',
  direction: 'long' as 'long' | 'short',
  entry_price: '',
  exit_price: '',
  size: '2',
  fees: '4.5',
  pnl: '',
  num_trades: '1',
  notes: '',
};

const FUTURES_PRESETS = [
  { symbol: 'NQ', name: 'E-mini Nasdaq', defaultSize: 2 },
  { symbol: 'ES', name: 'E-mini S&P', defaultSize: 2 },
  { symbol: 'MNQ', name: 'Micro Nasdaq', defaultSize: 10 },
  { symbol: 'MES', name: 'Micro S&P', defaultSize: 10 },
  { symbol: 'CL', name: 'Crude Oil', defaultSize: 2 },
  { symbol: 'GC', name: 'Gold', defaultSize: 2 },
];

const PNL_PRESETS = [
  { label: '+$650', value: 650, win: true },
  { label: '+$950', value: 950, win: true },
  { label: '+$1,450', value: 1450, win: true },
  { label: '-$550', value: -550, win: false },
  { label: '-$850', value: -850, win: false },
];

export default function TradeEntryTab() {
  const { state, accountTrades, refreshTrades } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'wins' | 'losses'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.selectedAccountId) {
      setError('No account selected');
      return;
    }
    if (!form.pnl) {
      setError('P&L amount is required');
      return;
    }

    setSaving(true);
    setError('');

    const pnlVal = parseFloat(form.pnl);

    const { error: insertError } = await supabase.from('trades').insert({
      account_id: state.selectedAccountId,
      date: form.date,
      symbol: form.symbol.trim().toUpperCase() || 'NQ',
      direction: form.direction,
      entry_price: parseFloat(form.entry_price) || 0,
      exit_price: parseFloat(form.exit_price) || 0,
      size: parseFloat(form.size) || 1,
      fees: parseFloat(form.fees) || 0,
      pnl: pnlVal,
      num_trades: parseInt(form.num_trades) || 1,
      notes: form.notes.trim(),
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    if (pnlVal > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#10b981', '#34d399', '#ffffff'],
        });
      } catch (err) {
        // Confetti fallback
      }
    }

    setSuccessToast(`Trade logged successfully! (${pnlVal >= 0 ? '+' : ''}${formatCurrency(pnlVal)})`);
    setTimeout(() => setSuccessToast(null), 3500);

    await refreshTrades();
    setForm({ ...emptyForm, date: form.date });
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this trade?')) return;
    setDeleteId(id);
    await supabase.from('trades').delete().eq('id', id);
    await refreshTrades();
    setDeleteId(null);
  }

  // Filtered & Paginated Trades
  const filteredTrades = useMemo(() => {
    return [...accountTrades]
      .filter((t) => {
        if (filterType === 'wins' && t.pnl <= 0) return false;
        if (filterType === 'losses' && t.pnl >= 0) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchSym = t.symbol.toLowerCase().includes(q);
          const matchDate = t.date.includes(q);
          const matchNotes = t.notes.toLowerCase().includes(q);
          return matchSym || matchDate || matchNotes;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [accountTrades, filterType, searchQuery]);

  const totalPages = Math.ceil(filteredTrades.length / pageSize) || 1;
  const paginatedTrades = filteredTrades.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2 shadow-lg"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Container */}
      <div className="bg-[#121824] rounded-2xl p-5 sm:p-6 border border-[#1e293b] shadow-xl shadow-black/30">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#10b981]" />
              TradeZella Fast Trade Logger
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Log new futures executions (auto-syncs to TradeZella Journal &amp; Calendar)
            </p>
          </div>
        </div>

        {error && (
          <p className="text-[#ef4444] text-xs mb-4 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-3 py-2.5">
            {error}
          </p>
        )}

        {/* Futures Contract Quick Presets */}
        <div className="mb-4">
          <label className="field-label text-slate-400 mb-2">Futures Presets</label>
          <div className="flex flex-wrap gap-2">
            {FUTURES_PRESETS.map((fp) => (
              <button
                key={fp.symbol}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    symbol: fp.symbol,
                    size: String(fp.defaultSize),
                  })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                  form.symbol === fp.symbol
                    ? 'bg-[#10b981] text-[#0b0e14] font-bold shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                    : 'bg-[#0b0e14] text-slate-300 hover:bg-[#182234] border border-[#1e293b]'
                }`}
              >
                {fp.symbol} <span className="text-[10px] opacity-70">({fp.name})</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="field-label">Date *</label>
            <input
              className="field-input font-mono"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="field-label">Symbol *</label>
            <input
              className="field-input font-mono uppercase font-bold"
              placeholder="NQ, ES, MNQ, GC..."
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div>
            <label className="field-label">Direction</label>
            <div className="flex h-10 rounded-xl overflow-hidden border border-white/10 bg-white/5 p-1 gap-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, direction: 'long' })}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-all ${
                  form.direction === 'long'
                    ? 'bg-[#22c55e] text-black font-bold shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Long
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, direction: 'short' })}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg transition-all ${
                  form.direction === 'short'
                    ? 'bg-[#ef4444] text-white font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                Short
              </button>
            </div>
          </div>

          <div>
            <label className="field-label">P&L ($) *</label>
            <input
              className={`field-input font-mono font-extrabold ${
                form.pnl ? (parseFloat(form.pnl) >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]') : ''
              }`}
              type="number"
              step="0.01"
              placeholder="e.g. 850.00 or -450"
              value={form.pnl}
              onChange={(e) => setForm({ ...form, pnl: e.target.value })}
              required
            />
          </div>

          {/* Quick P&L Pills */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-4 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono mr-1">Quick P&L:</span>
            {PNL_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setForm({ ...form, pnl: String(p.value) })}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  p.win
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div>
            <label className="field-label">Entry Price</label>
            <input
              className="field-input font-mono"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.entry_price}
              onChange={(e) => setForm({ ...form, entry_price: e.target.value })}
            />
          </div>

          <div>
            <label className="field-label">Exit Price</label>
            <input
              className="field-input font-mono"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={form.exit_price}
              onChange={(e) => setForm({ ...form, exit_price: e.target.value })}
            />
          </div>

          <div>
            <label className="field-label">Contracts / Size</label>
            <input
              className="field-input font-mono"
              type="number"
              step="0.1"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
            />
          </div>

          <div>
            <label className="field-label">Fees & Commission ($)</label>
            <input
              className="field-input font-mono"
              type="number"
              step="0.01"
              value={form.fees}
              onChange={(e) => setForm({ ...form, fees: e.target.value })}
            />
          </div>

          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <label className="field-label">Notes & Trade Execution Review</label>
            <textarea
              className="field-input resize-none h-20"
              placeholder="e.g. London sweep + 5m MSS retest. Took profit at previous day high..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <button
              type="submit"
              disabled={saving || !state.selectedAccountId}
              className="btn-primary flex items-center gap-2 px-6 py-3 font-bold"
            >
              <Plus className="w-4 h-4" />
              {saving ? 'Saving Trade...' : 'Log Trade Entry'}
            </button>
          </div>
        </form>
      </div>

      {/* Trade History Table */}
      <div className="bg-[#121824] rounded-2xl overflow-hidden border border-[#1e293b] shadow-xl shadow-black/30">
        <div className="p-4 sm:p-5 border-b border-[#1e293b] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Executed Trade Log</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                {filteredTrades.length} trades
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive trading history from March to current session
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search symbol, notes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 pr-3 py-1.5 rounded-xl bg-[#0b0e14] border border-[#1e293b] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <div className="flex items-center bg-[#0b0e14] p-1 rounded-xl border border-[#1e293b] text-xs">
              {(['all', 'wins', 'losses'] as const).map((ft) => (
                <button
                  key={ft}
                  onClick={() => {
                    setFilterType(ft);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-mono font-semibold transition-colors ${
                    filterType === ft
                      ? 'bg-[#10b981] text-[#0b0e14] font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredTrades.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No trades match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-[#1e293b] bg-[#0b0e14]/60">
                  {['Date', 'Symbol', 'Dir', 'Size', 'Fees', 'Net P&L', 'Notes', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]/60">
                {paginatedTrades.map((trade: Trade) => (
                  <tr key={trade.id} className="hover:bg-[#182234] transition-colors">
                    <td className="px-4 py-3 text-slate-300 text-xs whitespace-nowrap">
                      {trade.date}
                    </td>
                    <td className="px-4 py-3 text-white font-bold text-xs">{trade.symbol}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          trade.direction === 'long'
                            ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                            : 'bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30'
                        }`}
                      >
                        {trade.direction === 'long' ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {trade.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{trade.size || '1'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">${trade.fees}</td>
                    <td
                      className={`px-4 py-3 font-bold text-xs whitespace-nowrap ${
                        trade.pnl >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
                      }`}
                    >
                      {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-[240px] truncate font-sans">
                      {trade.notes || '–'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(trade.id)}
                        disabled={deleteId === trade.id}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-rose-500/20 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Trade"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
