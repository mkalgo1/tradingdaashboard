import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, PlusCircle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { getDayStats, formatCurrency, calcMonthTradeStats, parseDateParts } from '../../lib/calculations';
import { Trade } from '../../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarView() {
  const { state, dispatch, accountTrades } = useApp();
  const { calendarYear, calendarMonth } = state;

  const [selectedDayTrades, setSelectedDayTrades] = useState<{
    dateStr: string;
    trades: Trade[];
  } | null>(null);

  const dayStats = getDayStats(accountTrades);

  // Helper to format date string
  function getDateStr(day: number) {
    return `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  function prevMonth() {
    if (calendarMonth === 0) dispatch({ type: 'SET_CALENDAR', payload: { year: calendarYear - 1, month: 11 } });
    else dispatch({ type: 'SET_CALENDAR', payload: { year: calendarYear, month: calendarMonth - 1 } });
  }

  function nextMonth() {
    if (calendarMonth === 11) dispatch({ type: 'SET_CALENDAR', payload: { year: calendarYear + 1, month: 0 } });
    else dispatch({ type: 'SET_CALENDAR', payload: { year: calendarYear, month: calendarMonth + 1 } });
  }

  function jumpToMonth(monthIndex: number, year: number = 2026) {
    dispatch({ type: 'SET_CALENDAR', payload: { year, month: monthIndex } });
  }

  function getWeekPnL(week: (number | null)[]) {
    return week.reduce((sum, day) => {
      if (!day) return sum;
      const stats = dayStats[getDateStr(day)];
      return sum + (stats?.pnl ?? 0);
    }, 0);
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === calendarYear && today.getMonth() === calendarMonth;
  const monthStats = calcMonthTradeStats(accountTrades, calendarYear, calendarMonth);

  function handleDayClick(day: number) {
    const dateStr = getDateStr(day);
    const tradesForDay = accountTrades.filter((t) => t.date === dateStr);
    setSelectedDayTrades({ dateStr, trades: tradesForDay });
  }

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/5 shadow-xl shadow-black/20">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="hidden lg:block lg:w-64" />

        {/* Centered Month Navigator */}
        <div className="flex items-center justify-center gap-1 bg-white/5 rounded-xl p-1 border border-white/10 mx-auto">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400 hover:text-white"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-base sm:text-lg font-bold text-white px-4 font-mono min-w-[170px] text-center">
            {MONTHS[calendarMonth]} <span className="text-emerald-400">{calendarYear}</span>
          </span>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400 hover:text-white"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Month Summary Bar */}
        <div className="flex items-center justify-center sm:justify-end gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-xs font-mono">
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Month Net</span>
            <span
              className={`font-bold text-sm ${
                monthStats.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
              }`}
            >
              {monthStats.pnl >= 0 ? '+' : ''}{formatCurrency(monthStats.pnl)}
            </span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Win Rate</span>
            <span className="font-bold text-sm text-white">
              {monthStats.winRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Trades</span>
            <span className="font-bold text-sm text-slate-300">
              {monthStats.tradesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: '700px' }}>
          {/* Day headers */}
          <div className="grid grid-cols-8 gap-1.5 mb-2">
            {DAYS.map((d) => (
              <div
                key={d}
                className={`text-center text-xs font-semibold uppercase tracking-wider py-1.5 ${
                  d === 'Sun' || d === 'Sat' ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {d}
              </div>
            ))}
            <div className="text-center text-xs font-bold text-emerald-400 uppercase tracking-wider py-1.5">
              Week Total
            </div>
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => {
            const weekPnL = getWeekPnL(week);
            return (
              <div key={wi} className="grid grid-cols-8 gap-1.5 mb-1.5">
                {week.map((day, di) => {
                  if (!day) {
                    return (
                      <div
                        key={di}
                        className="h-20 rounded-xl bg-white/[0.01] border border-white/[0.03]"
                      />
                    );
                  }
                  const dateStr = getDateStr(day);
                  const stats = dayStats[dateStr];
                  const isToday = isCurrentMonth && today.getDate() === day;
                  const pnl = stats?.pnl ?? null;
                  const numTrades = stats?.numTrades ?? null;
                  const isWeekend = di === 0 || di === 6;

                  return (
                    <motion.div
                      key={di}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDayClick(day)}
                      className={`h-20 rounded-xl flex flex-col justify-between p-2 cursor-pointer transition-all duration-200 relative group overflow-hidden ${
                        isToday
                          ? 'border-2 border-[#22c55e] bg-[#22c55e]/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                          : pnl !== null
                          ? pnl > 0
                            ? 'bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/30'
                            : pnl < 0
                            ? 'bg-rose-950/20 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/30'
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          : isWeekend
                          ? 'bg-white/[0.02] border border-white/5 opacity-50'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {/* Day Number and Today Tag */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-mono font-medium ${
                            isToday
                              ? 'text-[#22c55e] font-bold'
                              : isWeekend
                              ? 'text-slate-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {day}
                        </span>
                        {isToday && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#22c55e] text-black font-bold">
                            TODAY
                          </span>
                        )}
                      </div>

                      {/* Day P&L and small number of trades directly below */}
                      <div className="my-auto text-center flex flex-col items-center justify-center">
                        {pnl !== null ? (
                          <>
                            <span
                              className={`text-xs sm:text-sm font-bold font-mono leading-tight block ${
                                pnl > 0
                                  ? 'text-[#22c55e]'
                                  : pnl < 0
                                  ? 'text-[#ef4444]'
                                  : 'text-slate-400'
                              }`}
                            >
                              {pnl > 0 ? '+' : ''}{formatCurrency(pnl)}
                            </span>
                            {numTrades !== null && numTrades > 0 && (
                              <span className="text-[10px] text-slate-400 font-mono leading-tight block mt-0.5">
                                {numTrades}
                              </span>
                            )}
                          </>
                        ) : isWeekend ? (
                          <span className="text-[10px] text-slate-600 font-mono">CLOSED</span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono">--</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Weekly Total Box */}
                <div
                  className={`h-20 rounded-xl flex flex-col items-center justify-center p-2 border transition-all ${
                    weekPnL > 0
                      ? 'bg-gradient-to-br from-[#22c55e]/15 to-transparent border-[#22c55e]/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                      : weekPnL < 0
                      ? 'bg-gradient-to-br from-[#ef4444]/15 to-transparent border-[#ef4444]/30'
                      : 'bg-white/2 border-white/5'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-mono font-medium">
                    Week Net
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-extrabold font-mono ${
                      weekPnL > 0
                        ? 'text-[#22c55e]'
                        : weekPnL < 0
                        ? 'text-[#ef4444]'
                        : 'text-slate-500'
                    }`}
                  >
                    {weekPnL !== 0 ? (weekPnL > 0 ? '+' : '') + formatCurrency(weekPnL) : '$0'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Modal */}
      <AnimatePresence>
        {selectedDayTrades && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedDayTrades(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 p-6 shadow-2xl relative bg-[#121217]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-[#22c55e]" />
                    {selectedDayTrades.dateStr}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedDayTrades.trades.length} trade{selectedDayTrades.trades.length === 1 ? '' : 's'} logged
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDayTrades(null)}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Day Trades List */}
              <div className="py-4 space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {selectedDayTrades.trades.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    No trades recorded for this day.
                  </div>
                ) : (
                  selectedDayTrades.trades.map((t, idx) => (
                    <div
                      key={t.id || idx}
                      className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-white">
                            {t.symbol}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                              t.direction === 'long'
                                ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30'
                                : 'bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30'
                            }`}
                          >
                            {t.direction}
                          </span>
                          {t.size > 0 && (
                            <span className="text-xs text-slate-400 font-mono">
                              {t.size} cts
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 font-mono">
                          {t.pnl >= 0 ? (
                            <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                          ) : (
                            <XCircle className="w-4 h-4 text-[#ef4444]" />
                          )}
                          <span
                            className={`font-bold text-sm ${
                              t.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'
                            }`}
                          >
                            {t.pnl >= 0 ? '+' : ''}{formatCurrency(t.pnl)}
                          </span>
                        </div>
                      </div>

                      {t.notes && (
                        <p className="text-xs text-slate-400 italic bg-black/20 p-2 rounded-lg border border-white/5">
                          "{t.notes}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div className="text-xs font-mono text-slate-400">
                  Day Net:{' '}
                  <span
                    className={`font-bold ${
                      selectedDayTrades.trades.reduce((s, t) => s + t.pnl, 0) >= 0
                        ? 'text-[#22c55e]'
                        : 'text-[#ef4444]'
                    }`}
                  >
                    {formatCurrency(selectedDayTrades.trades.reduce((s, t) => s + t.pnl, 0))}
                  </span>
                </div>

                <button
                  onClick={() => {
                    dispatch({ type: 'SET_ACTIVE_TAB', payload: 'trade-entry' });
                    setSelectedDayTrades(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold text-xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log Trade</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
