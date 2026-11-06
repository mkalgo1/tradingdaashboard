export interface Account {
  id: string;
  name: string;
  initial_balance: number;
  max_drawdown: number;
  profit_target: number;
  commission_per_side: number;
  created_at: string;
}

export interface Trade {
  id: string;
  account_id: string;
  date: string;
  symbol: string;
  direction: 'long' | 'short';
  entry_price: number;
  exit_price: number;
  size: number;
  fees: number;
  pnl: number;
  num_trades: number;
  notes: string;
  created_at: string;
}

export interface Payout {
  id: string;
  account_id: string;
  requested_amount: number;
  finalized_amount: number | null;
  request_date: string;
  finalized_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  created_at: string;
}

export interface Achievement {
  id: string;
  account_id: string;
  name: string;
  date: string;
  image_url: string;
  created_at: string;
}

export type TabType = 'dashboard' | 'accounts' | 'trade-entry' | 'payouts' | 'achievements';

export interface DayStats {
  date: string;
  pnl: number;
  numTrades: number;
}

export interface EquityPoint {
  date: string;
  balance: number;
  isWeekend: boolean;
}
