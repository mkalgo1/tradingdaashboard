
/*
  # Add profit_target to accounts and num_trades to trades

  ## Changes

  ### accounts table
  - Add `profit_target` column (numeric, default 3000)
    - The profit target defines when the drawdown line "locks" at the starting balance
    - Example: balance 50,000, drawdown 48,000, target 3,000
    - Once balance exceeds 53,000 (50,000 + 3,000), the drawdown line locks at 50,000

  ### trades table
  - Add `num_trades` column (integer, default 1)
    - Manual entry for how many trades were taken in a session
    - Displayed on calendar cells below the P&L

  ## Important notes
  1. Uses IF NOT EXISTS checks for safe migration
  2. Default values are set so existing rows are not affected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'profit_target'
  ) THEN
    ALTER TABLE accounts ADD COLUMN profit_target numeric NOT NULL DEFAULT 3000;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trades' AND column_name = 'num_trades'
  ) THEN
    ALTER TABLE trades ADD COLUMN num_trades integer NOT NULL DEFAULT 1;
  END IF;
END $$;
