import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rtvnjyghdyiiagonjcib.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dm5qeWdoZHlpaWFnb25qY2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MzkxNjMsImV4cCI6MjA5MjIxNTE2M30.On-i9zvaj4EEDSQgoksy7zAO8z5707MiJPEqraUYKzE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function buildTradeData(accountId = 'a51e521a-2a12-42a1-bea8-840bdcb53532') {
  const start = new Date(2026, 2, 2); // Monday March 2, 2026
  const end = new Date(2026, 10, 6);  // Friday Nov 6, 2026

  const symbols = ['NQ', 'ES', 'MNQ', 'MES', 'CL', 'GC'];
  const winNotes = [
    'London liquidity sweep + 5m MSS retest, TP filled',
    'NY Open ORB breakout with heavy institutional volume',
    'FVG tap + internal range liquidity target reached',
    'PDH breakout retest with strong bullish delta',
    'VWAP bounce continuation to overnight high',
    'Morning news reaction rejection at key level',
    '4H demand zone reaction with momentum push',
    'Range high deviation and clean reclaim long',
    'Asia low sweep into key institutional order block',
    'Trendline break + confirmation pull back entry'
  ];
  const lossNotes = [
    'Choppy pre-FOMC consolidation, tight stop hit',
    'Failed breakout above previous day high',
    'Slipped on news wick, cut trade per risk plan',
    'Counter-trend test failed, disciplined stop',
    'False reclaim of VWAP, exited quickly',
    'Market stalled at major HTF supply, stopped out'
  ];

  let seed = 12993;
  function random() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  // 36 weeks total (180 weekdays)
  // 144 win days, 36 loss days (80.00% day win rate)
  const weekLosses = [];
  for (let i = 0; i < 10; i++) weekLosses.push(2);
  for (let i = 0; i < 16; i++) weekLosses.push(1);
  for (let i = 0; i < 10; i++) weekLosses.push(0);

  for (let i = weekLosses.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [weekLosses[i], weekLosses[j]] = [weekLosses[j], weekLosses[i]];
  }

  const lossDaysSet = new Set();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const lossCountByWeekday = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };

  for (let w = 0; w < 36; w++) {
    const lossCount = weekLosses[w];
    const daysInWeek = [0, 1, 2, 3, 4];
    for (let i = daysInWeek.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [daysInWeek[i], daysInWeek[j]] = [daysInWeek[j], daysInWeek[i]];
    }
    const picked = daysInWeek.slice(0, lossCount);
    picked.forEach((d) => {
      lossDaysSet.add(w * 5 + d);
      lossCountByWeekday[dayNames[d]]++;
    });
  }

  // Pick exactly 12 loss days to have 2 loss trades -> 36 + 12 = 48 losses total (48 / 240 = 20.00% losses -> 80.00% trade win rate!)
  const lossDaysArray = Array.from(lossDaysSet);
  const twoTradeLossDays = new Set(lossDaysArray.slice(0, 12));

  // 48 two-trade win days + 12 two-trade loss days = 60 two-trade days total (120 single-trade days + 60 two-trade days = 240 trades total!)
  const winDaysArray = [];
  for (let d = 0; d < 180; d++) {
    if (!lossDaysSet.has(d)) winDaysArray.push(d);
  }
  // Pick exactly 48 win days to have 2 win trades
  const twoTradeWinDays = new Set(winDaysArray.filter((_, idx) => idx % 3 === 0).slice(0, 48));

  const trades = [];
  let curr = new Date(start);
  let dayIndex = 0;

  while (curr <= end) {
    const dayOfWeek = curr.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const isLossDay = lossDaysSet.has(dayIndex);
      const isTwoTradeDay = isLossDay ? twoTradeLossDays.has(dayIndex) : twoTradeWinDays.has(dayIndex);

      if (isLossDay) {
        const sym = symbols[Math.floor(random() * symbols.length)];
        trades.push({
          account_id: accountId,
          date: dateStr,
          symbol: sym,
          direction: random() > 0.5 ? 'long' : 'short',
          entry_price: sym === 'NQ' ? 19800 + Math.round(random() * 400) : 5600 + Math.round(random() * 100),
          exit_price: 0,
          size: sym.startsWith('M') ? 10 : 2,
          fees: 4.5,
          pnl: -Math.round((820 + random() * 450) / 10) * 10,
          num_trades: 1,
          notes: lossNotes[Math.floor(random() * lossNotes.length)],
        });

        if (isTwoTradeDay) {
          const sym2 = symbols[Math.floor(random() * symbols.length)];
          trades.push({
            account_id: accountId,
            date: dateStr,
            symbol: sym2,
            direction: random() > 0.5 ? 'long' : 'short',
            entry_price: sym2 === 'NQ' ? 19800 + Math.round(random() * 400) : 5600 + Math.round(random() * 100),
            exit_price: 0,
            size: sym2.startsWith('M') ? 8 : 2,
            fees: 4.5,
            pnl: -Math.round((450 + random() * 350) / 10) * 10,
            num_trades: 1,
            notes: lossNotes[Math.floor(random() * lossNotes.length)],
          });
        }
      } else {
        // Win day
        if (isTwoTradeDay) {
          const sym1 = symbols[Math.floor(random() * symbols.length)];
          const sym2 = symbols[Math.floor(random() * symbols.length)];
          trades.push({
            account_id: accountId,
            date: dateStr,
            symbol: sym1,
            direction: random() > 0.4 ? 'long' : 'short',
            entry_price: sym1 === 'NQ' ? 19800 + Math.round(random() * 400) : 5600 + Math.round(random() * 100),
            exit_price: 0,
            size: sym1.startsWith('M') ? 8 : 2,
            fees: 4.5,
            pnl: Math.round((560 + random() * 480) / 10) * 10,
            num_trades: 1,
            notes: winNotes[Math.floor(random() * winNotes.length)],
          });
          trades.push({
            account_id: accountId,
            date: dateStr,
            symbol: sym2,
            direction: random() > 0.4 ? 'long' : 'short',
            entry_price: sym2 === 'NQ' ? 19800 + Math.round(random() * 400) : 5600 + Math.round(random() * 100),
            exit_price: 0,
            size: sym2.startsWith('M') ? 8 : 2,
            fees: 4.5,
            pnl: Math.round((500 + random() * 450) / 10) * 10,
            num_trades: 1,
            notes: winNotes[Math.floor(random() * winNotes.length)],
          });
        } else {
          const sym = symbols[Math.floor(random() * symbols.length)];
          trades.push({
            account_id: accountId,
            date: dateStr,
            symbol: sym,
            direction: random() > 0.35 ? 'long' : 'short',
            entry_price: sym === 'NQ' ? 19800 + Math.round(random() * 400) : 5600 + Math.round(random() * 100),
            exit_price: 0,
            size: sym.startsWith('M') ? 10 : 2,
            fees: 4.5,
            pnl: Math.round((820 + random() * 720) / 10) * 10,
            num_trades: 1,
            notes: winNotes[Math.floor(random() * winNotes.length)],
          });
        }
      }

      dayIndex++;
    }
    curr.setDate(curr.getDate() + 1);
  }

  return { trades, totalDays: dayIndex, lossCountByWeekday };
}

async function run() {
  const { trades, totalDays, lossCountByWeekday } = buildTradeData();
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossProfit / grossLoss;
  const winRate = (wins.length / trades.length) * 100;
  const totalPnL = grossProfit - grossLoss;

  const dayTotals = {};
  for (const t of trades) {
    dayTotals[t.date] = (dayTotals[t.date] || 0) + t.pnl;
  }
  const winDays = Object.values(dayTotals).filter((v) => v > 0).length;
  const dayWinRate = (winDays / totalDays) * 100;

  console.log('Mixed trade statistics:');
  console.log({
    totalDays,
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    tradeWinRate: winRate.toFixed(2) + '%',
    dayWinRate: dayWinRate.toFixed(2) + '%',
    profitFactor: profitFactor.toFixed(2),
    avgWin: (grossProfit / wins.length).toFixed(0),
    avgLoss: (grossLoss / losses.length).toFixed(0),
    grossProfit,
    grossLoss,
    totalPnL,
    startDate: trades[0].date,
    endDate: trades[trades.length - 1].date,
    lossCountByWeekday,
  });

  if (process.argv.includes('--upload')) {
    console.log('Clearing existing trades for account and uploading fresh mixed complete calendar...');
    const accountId = 'a51e521a-2a12-42a1-bea8-840bdcb53532';
    const { error: delErr } = await supabase.from('trades').delete().eq('account_id', accountId);
    if (delErr) {
      console.error('Delete error:', delErr);
      return;
    }
    console.log('Cleared previous trades.');

    const chunkSize = 50;
    for (let i = 0; i < trades.length; i += chunkSize) {
      const chunk = trades.slice(i, i + chunkSize);
      const { error: insErr } = await supabase.from('trades').insert(chunk);
      if (insErr) {
        console.error('Insert error at chunk ' + i + ':', insErr);
        return;
      }
      console.log(`Inserted trades ${i + 1} to ${Math.min(i + chunkSize, trades.length)} of ${trades.length}`);
    }
    console.log('Successfully uploaded all mixed trades to Supabase!');
  }
}

run();
