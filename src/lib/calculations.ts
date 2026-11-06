import { Trade, DayStats, EquityPoint } from '../types';

export function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-');
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10) - 1, // 0-indexed month
    day: parseInt(parts[2], 10),
  };
}

export function getDayStats(trades: Trade[]): Record<string, DayStats> {
  const stats: Record<string, DayStats> = {};
  for (const trade of trades) {
    if (!stats[trade.date]) {
      stats[trade.date] = { date: trade.date, pnl: 0, numTrades: 0 };
    }
    stats[trade.date].pnl += trade.pnl;
    stats[trade.date].numTrades += trade.num_trades || 1;
  }
  return stats;
}

export function calcTotalPnL(trades: Trade[]): number {
  return trades.reduce((sum, t) => sum + t.pnl, 0);
}

export function calcTradeWinRate(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const wins = trades.filter((t) => t.pnl > 0).length;
  return (wins / trades.length) * 100;
}

export function calcDayWinRate(dayStats: Record<string, DayStats>): number {
  const days = Object.values(dayStats);
  if (days.length === 0) return 0;
  const winDays = days.filter((d) => d.pnl > 0).length;
  return (winDays / days.length) * 100;
}

export function calcAvgWin(trades: Trade[]): number {
  const wins = trades.filter((t) => t.pnl > 0);
  if (wins.length === 0) return 0;
  return wins.reduce((s, t) => s + t.pnl, 0) / wins.length;
}

export function calcAvgLoss(trades: Trade[]): number {
  const losses = trades.filter((t) => t.pnl < 0);
  if (losses.length === 0) return 0;
  return Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length);
}

export function calcProfitFactor(trades: Trade[]): number {
  const grossProfit = trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  if (grossLoss === 0) return grossProfit > 0 ? 999 : 0;
  return grossProfit / grossLoss;
}

export function calcBestDayPercent(trades: Trade[], dayStats: Record<string, DayStats>): number {
  const totalPnL = calcTotalPnL(trades);
  if (totalPnL <= 0) return 0;
  const days = Object.values(dayStats);
  if (days.length === 0) return 0;
  const bestDay = Math.max(...days.map((d) => d.pnl));
  if (bestDay <= 0) return 0;
  return (bestDay / totalPnL) * 100;
}

export function calcTodayPnL(trades: Trade[]): number {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  return trades.filter((t) => t.date === todayStr).reduce((s, t) => s + t.pnl, 0);
}

export function calcMonthPnL(trades: Trade[], year: number, month: number): number {
  return trades
    .filter((t) => {
      const { year: y, month: m } = parseDateParts(t.date);
      return y === year && m === month;
    })
    .reduce((s, t) => s + t.pnl, 0);
}

export function calcMonthTradeStats(trades: Trade[], year: number, month: number) {
  const monthTrades = trades.filter((t) => {
    const { year: y, month: m } = parseDateParts(t.date);
    return y === year && m === month;
  });

  const pnl = monthTrades.reduce((s, t) => s + t.pnl, 0);
  const wins = monthTrades.filter((t) => t.pnl > 0).length;
  const losses = monthTrades.filter((t) => t.pnl < 0).length;
  const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;

  return {
    tradesCount: monthTrades.length,
    pnl,
    wins,
    losses,
    winRate,
  };
}

export function calcExpectancy(trades: Trade[]): number {
  if (trades.length === 0) return 0;
  const winRate = calcTradeWinRate(trades) / 100;
  const lossRate = 1 - winRate;
  const avgWin = calcAvgWin(trades);
  const avgLoss = calcAvgLoss(trades);
  return (winRate * avgWin) - (lossRate * avgLoss);
}

export function calcStreaks(trades: Trade[]) {
  if (trades.length === 0) return { currentStreak: 0, maxWinStreak: 0, maxLossStreak: 0, isWinStreak: true };
  
  // Sort trades chronologically
  const sorted = [...trades].sort((a, b) => a.date.localeCompare(b.date));
  let currentStreak = 0;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let lastWasWin = sorted[0].pnl > 0;

  for (const t of sorted) {
    if (t.pnl > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      lastWasWin = true;
    } else if (t.pnl < 0) {
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      lastWasWin = false;
    }
  }

  currentStreak = lastWasWin ? currentWinStreak : currentLossStreak;

  return {
    currentStreak,
    maxWinStreak,
    maxLossStreak,
    isWinStreak: lastWasWin,
  };
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export interface EquityPointExt extends EquityPoint {
  drawdownLine: number;
  highestBalance: number;
  dailyPnL?: number;
}

export function buildEquityCurve(
  trades: Trade[],
  initialBalance: number,
  maxDrawdown: number,
  profitTarget: number
): EquityPointExt[] {
  if (trades.length === 0) return [];

  const dayStats = getDayStats(trades);
  const sortedDates = Object.keys(dayStats).sort();
  if (sortedDates.length === 0) return [];

  const { year: sy, month: sm, day: sd } = parseDateParts(sortedDates[0]);
  const { year: ey, month: em, day: ed } = parseDateParts(sortedDates[sortedDates.length - 1]);
  const startDate = new Date(sy, sm, sd);
  const endDate = new Date(ey, em, ed);

  const drawdownAmount = initialBalance - maxDrawdown;
  const lockThreshold = initialBalance + profitTarget;

  const points: EquityPointExt[] = [];
  let balance = initialBalance;
  let highestBalance = initialBalance;
  let drawdownLine = maxDrawdown;
  const current = new Date(startDate);

  while (current <= endDate) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const weekend = isWeekend(current);

    let dayPnL = 0;
    if (!weekend && dayStats[dateStr]) {
      dayPnL = dayStats[dateStr].pnl;
      balance += dayPnL;
    }

    if (balance > highestBalance) {
      highestBalance = balance;
    }

    const profitAboveInitial = Math.max(highestBalance - initialBalance, 0);

    if (highestBalance >= lockThreshold) {
      drawdownLine = initialBalance;
    } else {
      drawdownLine = maxDrawdown + Math.min(profitAboveInitial, drawdownAmount);
    }

    points.push({
      date: dateStr,
      balance: Math.max(balance, maxDrawdown),
      isWeekend: weekend,
      drawdownLine,
      highestBalance,
      dailyPnL: dayPnL,
    });

    current.setDate(current.getDate() + 1);
  }

  return points;
}

export function formatCurrency(value: number): string {
  const isNegative = value < 0;
  const abs = Math.abs(value);
  return `${isNegative ? '-' : ''}$${abs.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
