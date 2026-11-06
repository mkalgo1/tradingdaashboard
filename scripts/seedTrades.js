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

  const trades = [];
  let curr = new Date(start);
  let dayIndex = 0;

  let seed = 998877;
  function random() {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  // 180 total weekdays.
  // 60 two-trade days, 120 one-trade days = 240 trades.
  // We want 192 wins (80.0%) and 48 losses (20.0%).
  // And 144 win days (80.0%) and 36 loss days (20.0%).
  while (curr <= end) {
    const dayOfWeek = curr.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // 180 days / 5 = 36 blocks of 5 days.
      // In each 5-day block (indexes 0, 1, 2, 3, 4):
      // Day 4 is the loss day (36 loss days out of 180 = exactly 80.0% win days).
      const isLossDay = (dayIndex % 5 === 4);
      const isTwoTradeDay = (dayIndex % 3 === 1);

      if (isLossDay) {
        // Loss day: single trade or if 2-trade day, both or net loss
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
          pnl: -Math.round((820 + random() * 450) / 10) * 10, // -$820 to -$1,270
          num_trades: 1,
          notes: lossNotes[Math.floor(random() * lossNotes.length)]
        });
        if (isTwoTradeDay) {
          // Additional loss trade on 12 of the 36 loss days (36 + 12 = 48 losses total!)
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
            notes: lossNotes[Math.floor(random() * lossNotes.length)]
          });
        }
      } else {
        // Win day!
        if (isTwoTradeDay) {
          // 2 win trades
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
            notes: winNotes[Math.floor(random() * winNotes.length)]
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
            notes: winNotes[Math.floor(random() * winNotes.length)]
          });
        } else {
          // 1 win trade
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
            pnl: Math.round((820 + random() * 720) / 10) * 10, // +$820 to +$1,540
            num_trades: 1,
            notes: winNotes[Math.floor(random() * winNotes.length)]
          });
        }
      }

      dayIndex++;
    }
    curr.setDate(curr.getDate() + 1);
  }

  return { trades, totalDays: dayIndex };
}

async function run() {
  const { trades, totalDays } = buildTradeData();
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossProfit / grossLoss;
  const winRate = (wins.length / trades.length) * 100;
  const totalPnL = grossProfit - grossLoss;

  const dayTotals = {};
  for (const t of trades) {
    dayTotals[t.date] = (dayTotals[t.date] || 0) + t.pnl;
  }
  const winDays = Object.values(dayTotals).filter(v => v > 0).length;
  const dayWinRate = (winDays / totalDays) * 100;

  console.log('Calibrated trade statistics:');
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
    endDate: trades[trades.length - 1].date
  });

  if (process.argv.includes('--upload')) {
    console.log('Clearing existing trades for account and uploading fresh complete calendar...');
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
    console.log('Successfully uploaded all trades to Supabase!');
  }
}

run();
