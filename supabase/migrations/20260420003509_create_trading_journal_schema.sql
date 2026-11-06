
/*
  # Trading Journal Schema

  ## Overview
  Creates all tables required for the institutional-grade trading journal application.

  ## New Tables

  ### accounts
  - Stores trading account configurations
  - `id` (uuid, PK), `name`, `initial_balance`, `max_drawdown`, `commission_per_side`, `created_at`

  ### trades
  - Individual trade log entries with manual P&L input
  - `id` (uuid, PK), `account_id` (FK), `date`, `symbol`, `direction` (long/short), `entry_price`, `exit_price`, `size`, `fees`, `pnl` (manual), `notes`, `created_at`

  ### payouts
  - Tracks requested vs finalized payouts per account
  - `id` (uuid, PK), `account_id` (FK), `requested_amount`, `finalized_amount`, `request_date`, `finalized_date`, `status` (pending/approved/rejected), `notes`, `created_at`

  ### achievements
  - User achievements with name, date, and optional image URL
  - `id` (uuid, PK), `account_id` (FK), `name`, `date`, `image_url`, `created_at`

  ## Security
  - RLS enabled on all tables
  - Anon read/write policies (no auth required for this journal app)

  ## Storage
  - `achievements` public bucket for achievement images
*/

-- accounts
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  initial_balance numeric NOT NULL DEFAULT 50000,
  max_drawdown numeric NOT NULL DEFAULT 48000,
  commission_per_side numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can select accounts"
  ON accounts FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert accounts"
  ON accounts FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update accounts"
  ON accounts FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete accounts"
  ON accounts FOR DELETE TO anon USING (true);

-- trades
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  date date NOT NULL,
  symbol text NOT NULL DEFAULT '',
  direction text NOT NULL DEFAULT 'long' CHECK (direction IN ('long', 'short')),
  entry_price numeric NOT NULL DEFAULT 0,
  exit_price numeric NOT NULL DEFAULT 0,
  size numeric NOT NULL DEFAULT 0,
  fees numeric NOT NULL DEFAULT 0,
  pnl numeric NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can select trades"
  ON trades FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert trades"
  ON trades FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update trades"
  ON trades FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete trades"
  ON trades FOR DELETE TO anon USING (true);

-- payouts
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  requested_amount numeric NOT NULL DEFAULT 0,
  finalized_amount numeric,
  request_date date NOT NULL,
  finalized_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can select payouts"
  ON payouts FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert payouts"
  ON payouts FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update payouts"
  ON payouts FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete payouts"
  ON payouts FOR DELETE TO anon USING (true);

-- achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date NOT NULL,
  image_url text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can select achievements"
  ON achievements FOR SELECT TO anon USING (true);

CREATE POLICY "Anon can insert achievements"
  ON achievements FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update achievements"
  ON achievements FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Anon can delete achievements"
  ON achievements FOR DELETE TO anon USING (true);

-- Storage bucket for achievement images
INSERT INTO storage.buckets (id, name, public)
VALUES ('achievements', 'achievements', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read achievements storage"
  ON storage.objects FOR SELECT TO anon USING (bucket_id = 'achievements');

CREATE POLICY "Anon upload achievements storage"
  ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'achievements');

CREATE POLICY "Anon delete achievements storage"
  ON storage.objects FOR DELETE TO anon USING (bucket_id = 'achievements');
