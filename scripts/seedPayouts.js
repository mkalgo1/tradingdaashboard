import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rtvnjyghdyiiagonjcib.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dm5qeWdoZHlpaWFnb25qY2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MzkxNjMsImV4cCI6MjA5MjIxNTE2M30.On-i9zvaj4EEDSQgoksy7zAO8z5707MiJPEqraUYKzE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const accountId = 'a51e521a-2a12-42a1-bea8-840bdcb53532';

async function run() {
  const { data: trades } = await supabase.from('trades').select('*').order('date', { ascending: true });
  const dayPnL = {};
  for (const t of trades) {
    dayPnL[t.date] = (dayPnL[t.date] || 0) + t.pnl;
  }
  const dates = Object.keys(dayPnL).sort();

  const payouts = [];
  // 18 cycles of 10 trading days (2 weeks)
  for (let i = 0; i < dates.length; i += 10) {
    const cycleDates = dates.slice(i, i + 10);
    const cycleIndex = (i / 10) + 1;
    const cyclePnL = cycleDates.reduce((s, d) => s + dayPnL[d], 0);
    const fridayDate = cycleDates[cycleDates.length - 1]; // The Friday at the end of the 2 weeks

    const isLatest = (cycleIndex === 18); // Cycle 18 is today (Nov 6, 2026)

    // Requested amount is proportional to cycle P&L (approx 65% - 75% of profits)
    let requested = Math.max(Math.round((cyclePnL * 0.7) / 100) * 100, 100);
    if (cyclePnL <= 500) requested = 100;
    
    // 90% profit split
    const finalized = isLatest ? null : Math.round(requested * 0.9);
    const status = isLatest ? 'pending' : 'approved';
    const finalizedDate = isLatest ? null : fridayDate;

    payouts.push({
      account_id: accountId,
      requested_amount: requested,
      finalized_amount: finalized,
      request_date: fridayDate,
      finalized_date: finalizedDate,
      status: status,
      notes: `Bi-Weekly Cycle #${cycleIndex} (2-Week Profit Split: $${cyclePnL.toLocaleString()})`,
    });
  }

  console.log(`Generated ${payouts.length} bi-weekly payouts:`);
  console.table(payouts.map(p => ({
    date: p.request_date,
    req: p.requested_amount,
    fin: p.finalized_amount,
    status: p.status,
    notes: p.notes
  })));

  if (process.argv.includes('--upload')) {
    console.log('Clearing old payouts...');
    await supabase.from('payouts').delete().eq('account_id', accountId);

    console.log('Inserting new bi-weekly payouts...');
    const { error } = await supabase.from('payouts').insert(payouts);
    if (error) {
      console.error('Insert error:', error);
    } else {
      console.log('Successfully saved all 18 bi-weekly payouts to Supabase!');
    }
  }
}

run();
