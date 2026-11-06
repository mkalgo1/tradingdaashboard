import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Zap, Flame, ShieldAlert, Target } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getDayStats,
  calcTotalPnL,
  calcTradeWinRate,
  calcDayWinRate,
  calcAvgWin,
  calcAvgLoss,
  calcProfitFactor,
  calcBestDayPercent,
  calcExpectancy,
  calcStreaks,
  formatCurrency,
} from '../../lib/calculations';
import SemiCircleGauge from '../ui/SemiCircleGauge';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export default function KPICards() {
  const { accountTrades, selectedAccount } = useApp();

  const dayStats = getDayStats(accountTrades);
  const totalPnL = calcTotalPnL(accountTrades);
  const tradeWinRate = calcTradeWinRate(accountTrades);
  const dayWinRate = calcDayWinRate(dayStats);
  const avgWin = calcAvgWin(accountTrades);
  const avgLoss = calcAvgLoss(accountTrades);
  const profitFactor = calcProfitFactor(accountTrades);
  const bestDayPct = calcBestDayPercent(accountTrades, dayStats);
  const expectancy = calcExpectancy(accountTrades);
  const streaks = calcStreaks(accountTrades);

  const initialBalance = selectedAccount?.initial_balance ?? 50000;
  const roi = (totalPnL / initialBalance) * 100;

  const grossProfit = accountTrades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(accountTrades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const donutData = [
    { value: grossProfit || 1, color: '#22c55e' },
    { value: grossLoss || 0.001, color: '#ef4444' },
  ];

  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 1 : 0;
  const winLossBarPct = Math.min((winLossRatio / 2.5) * 100, 100);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Total P&L */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="relative overflow-hidden rounded-2xl p-5 flex flex-col justify-between bg-[#121824] border border-[#1e293b] hover:border-emerald-500/30 transition-all shadow-lg shadow-black/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Total Net P&L</span>
            <div className="w-7 h-7 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#10b981]" />
            </div>
          </div>
          <div className="my-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight leading-none ${
                totalPnL >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'
              }`}
              style={{
                textShadow: totalPnL >= 0 ? '0 0 24px rgba(16,185,129,0.35)' : '0 0 24px rgba(239,68,68,0.35)',
              }}
            >
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1e293b]">
            <span>{accountTrades.length} executed trades</span>
            <span className="font-mono font-semibold text-[#10b981]">
              {roi >= 0 ? '+' : ''}{roi.toFixed(1)}% ROI
            </span>
          </div>
        </motion.div>

        {/* Trade Win % */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="relative rounded-2xl p-5 flex flex-col items-center justify-between bg-[#121824] border border-[#1e293b] hover:border-emerald-500/30 transition-all shadow-lg shadow-black/30"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Trade Win %</span>
            <div className="w-7 h-7 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center">
              <Target className="w-4 h-4 text-[#10b981]" />
            </div>
          </div>
          <div className="py-1">
            <SemiCircleGauge
              value={tradeWinRate}
              color={tradeWinRate >= 70 ? '#10b981' : tradeWinRate >= 50 ? '#eab308' : '#ef4444'}
              size={120}
            />
          </div>
          <div className="flex items-center justify-between w-full text-xs text-slate-400 pt-2 border-t border-[#1e293b]">
            <span>Target: &gt;75%</span>
            <span className="font-mono text-[#10b981] font-semibold">Institutional Grade</span>
          </div>
        </motion.div>

        {/* Avg Win / Avg Loss */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="relative rounded-2xl p-5 flex flex-col justify-between bg-[#121824] border border-[#1e293b] hover:border-emerald-500/30 transition-all shadow-lg shadow-black/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Avg Win / Loss</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-center justify-between text-sm sm:text-base font-mono mb-2">
              <span className="text-[#10b981] font-bold">+{formatCurrency(avgWin)}</span>
              <span className="text-slate-500 text-xs uppercase font-sans">vs</span>
              <span className="text-[#ef4444] font-bold">-{formatCurrency(avgLoss)}</span>
            </div>
            <div className="relative h-2 bg-[#1e293b] rounded-full overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${winLossBarPct}%`,
                  background: 'linear-gradient(to right, #10b981, #059669)',
                  boxShadow: '0 0 10px rgba(16,185,129,0.4)',
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1e293b]">
            <span>Payoff Ratio</span>
            <span className="text-white font-mono font-semibold">{winLossRatio.toFixed(2)}x</span>
          </div>
        </motion.div>

        {/* TradeZella Signature: Zella Score */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="relative rounded-2xl p-5 flex flex-col justify-between bg-[#121824] border border-[#1e293b] hover:border-indigo-500/30 transition-all shadow-lg shadow-black/30"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Zella Score</span>
              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold font-mono">
                PRO
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          
          <div className="my-1 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                  96
                </span>
                <span className="text-sm font-mono text-slate-500 font-semibold">/100</span>
                <span className="ml-1 text-xs px-2 py-0.5 rounded-md bg-[#10b981]/20 text-[#10b981] font-bold font-mono">
                  GRADE A+
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-sans">
                Elite Consistency &amp; Risk Control
              </p>
            </div>

            {/* Circular Mini Gauge */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#1e293b]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#10b981]"
                  strokeDasharray="96, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.5))' }}
                />
              </svg>
              <span className="absolute text-[11px] font-bold font-mono text-white">96%</span>
            </div>
          </div>

          <div className="flex items-center justify-between w-full text-xs text-slate-400 pt-2 border-t border-[#1e293b]">
            <span>Benchmark: &gt;85</span>
            <span className="font-mono text-[#10b981] font-semibold">Top 1% Trader Tier</span>
          </div>
        </motion.div>

        {/* Profit Factor */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="relative rounded-2xl p-5 flex flex-col justify-between bg-[#121824] border border-[#1e293b] hover:border-emerald-500/30 transition-all shadow-lg shadow-black/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Profit Factor</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-center gap-4 my-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={22}
                    outerRadius={34}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1">
              <span
                className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                  profitFactor >= 2 ? 'text-[#10b981]' : profitFactor >= 1.5 ? 'text-yellow-400' : 'text-[#ef4444]'
                }`}
              >
                {profitFactor === 999 ? '∞' : profitFactor.toFixed(2)}
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <span className="text-slate-400 font-mono font-medium">+{formatCurrency(grossProfit)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
                <span className="text-slate-400 font-mono font-medium">-{formatCurrency(grossLoss)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1e293b]">
            <span>Benchmark: &gt;2.0</span>
            <span className="text-[#10b981] font-semibold font-mono">Elite Tier</span>
          </div>
        </motion.div>

        {/* Expectancy / Trade */}
        <motion.div
          variants={cardVariants}
          whileHover={{ y: -2, transition: { duration: 0.15 } }}
          className="relative rounded-2xl p-5 flex flex-col justify-between bg-[#121824] border border-[#1e293b] hover:border-emerald-500/30 transition-all shadow-lg shadow-black/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono uppercase tracking-widest">Expectancy / Trade</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="my-2">
            <span
              className="text-2xl sm:text-3xl font-extrabold font-mono text-[#10b981]"
              style={{ textShadow: '0 0 20px rgba(16,185,129,0.3)' }}
            >
              +{formatCurrency(expectancy)}
            </span>
            <div className="relative h-2 bg-[#1e293b] rounded-full overflow-hidden mt-3">
              <div
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(bestDayPct, 100)}%`,
                  background: 'linear-gradient(to right, #10b981, #059669)',
                  boxShadow: '0 0 8px rgba(16,185,129,0.4)',
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1e293b]">
            <span>Best Day: {bestDayPct.toFixed(1)}% of total</span>
            <span className="font-mono text-white">Streak: {streaks.currentStreak}W</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
