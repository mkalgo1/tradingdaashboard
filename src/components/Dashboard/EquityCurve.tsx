import { useState } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Shield, ArrowUpRight, BarChart3 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { buildEquityCurve, formatCurrency } from '../../lib/calculations';

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { payload: { balance: number; drawdownLine: number; dailyPnL?: number; highestBalance: number } }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  const balance = data.balance;
  const ddLine = data.drawdownLine;
  const dailyPnL = data.dailyPnL;
  const cushion = balance - ddLine;

  return (
    <div className="glass-panel border border-white/10 rounded-xl p-3.5 text-xs shadow-2xl bg-[#09090b]/95 backdrop-blur-xl font-mono min-w-[190px]">
      <p className="text-slate-400 font-semibold mb-2 text-[11px] border-b border-white/5 pb-1">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">Balance:</span>
          <span className="font-bold text-white text-sm">{formatCurrency(balance)}</span>
        </div>
        {dailyPnL !== undefined && dailyPnL !== 0 && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">Daily P&L:</span>
            <span className={`font-semibold ${dailyPnL > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
              {dailyPnL > 0 ? '+' : ''}{formatCurrency(dailyPnL)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="text-slate-400">Drawdown Floor:</span>
          <span className="text-amber-400 font-semibold">{formatCurrency(ddLine)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/5 text-[10px]">
          <span className="text-slate-400">Buffer:</span>
          <span className="text-[#22c55e] font-semibold">+{formatCurrency(cushion)}</span>
        </div>
      </div>
    </div>
  );
}

export default function EquityCurve() {
  const { accountTrades, selectedAccount } = useApp();
  const [filterRange, setFilterRange] = useState<'all' | '90d' | '30d'>('all');

  const initialBalance = selectedAccount?.initial_balance ?? 50000;
  const maxDrawdown = selectedAccount?.max_drawdown ?? 48000;
  const profitTarget = selectedAccount?.profit_target ?? 3000;

  const points = buildEquityCurve(accountTrades, initialBalance, maxDrawdown, profitTarget);

  let filteredPoints = points;
  if (filterRange === '30d') {
    filteredPoints = points.slice(-30);
  } else if (filterRange === '90d') {
    filteredPoints = points.slice(-90);
  }

  const chartData = filteredPoints.map((p) => ({
    date: p.date,
    balance: p.balance,
    drawdownLine: p.drawdownLine,
    isWeekend: p.isWeekend,
    dailyPnL: p.dailyPnL,
    highestBalance: p.highestBalance,
  }));

  const allBalances = chartData.map((p) => p.balance);
  const allDDLines = chartData.map((p) => p.drawdownLine);
  const minVal = Math.min(...allBalances, ...allDDLines, initialBalance);
  const maxVal = Math.max(...allBalances, initialBalance);
  const yMin = Math.floor((minVal - 2000) / 5000) * 5000;
  const yMax = Math.ceil((maxVal + 2000) / 5000) * 5000;

  const currentBalance = points.length > 0 ? points[points.length - 1].balance : initialBalance;
  const peakBalance = points.length > 0 ? Math.max(...points.map((p) => p.balance)) : initialBalance;
  const currentDrawdownFloor = points.length > 0 ? points[points.length - 1].drawdownLine : maxDrawdown;
  const cushion = currentBalance - currentDrawdownFloor;
  const returnPct = ((currentBalance - initialBalance) / initialBalance) * 100;

  const formatXAxis = (date: string) => {
    const parts = date.split('-');
    return `${parts[1]}/${parts[2]}`;
  };

  const formatYAxis = (value: number) => {
    return `$${Math.round(value / 1000)}k`;
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-white/5 shadow-xl shadow-black/20">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#22c55e]" />
              Account Equity Curve
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 text-[10px] font-mono font-bold">
              +{returnPct.toFixed(1)}% Return
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Institutional trailing drawdown tracking & growth trajectory
          </p>
        </div>

        {/* Legend & Filter Controls */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-slate-300">Equity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-amber-400" />
              <span className="text-slate-400">Drawdown Floor</span>
            </div>
          </div>

          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
            {(['all', '90d', '30d'] as const).map((rng) => (
              <button
                key={rng}
                onClick={() => setFilterRange(rng)}
                className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-semibold transition-colors ${
                  filterRange === rng
                    ? 'bg-[#22c55e] text-black font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {rng}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-3 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-xs">
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Peak ATH</span>
          <span className="text-white font-bold text-sm sm:text-base">
            {formatCurrency(peakBalance)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Current Equity</span>
          <span className="text-[#22c55e] font-bold text-sm sm:text-base">
            {formatCurrency(currentBalance)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Drawdown Lock</span>
          <span className="text-amber-400 font-bold text-sm sm:text-base">
            {formatCurrency(currentDrawdownFloor)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Drawdown Buffer</span>
          <span className="text-emerald-400 font-bold text-sm sm:text-base">
            +{formatCurrency(cushion)}
          </span>
        </div>
      </div>

      {/* Chart */}
      {chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm">
          <BarChart3 className="w-8 h-8 mb-2 opacity-50" />
          <span>No trade data available</span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={290}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                <stop offset="60%" stopColor="#22c55e" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={25}
            />
            <YAxis
              domain={[yMin, yMax]}
              tickFormatter={formatYAxis}
              tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#22c55e"
              strokeWidth={2.5}
              fill="url(#equityGradient)"
              activeDot={{ r: 6, fill: '#22c55e', stroke: '#ffffff', strokeWidth: 2 }}
            />
            <Line
              type="stepAfter"
              dataKey="drawdownLine"
              stroke="#fbbf24"
              strokeWidth={1.8}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
