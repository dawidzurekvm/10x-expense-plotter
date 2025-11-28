-- Migration: Drop all RLS policies for 10x Expense Plotter tables
-- Purpose: Disables all previously defined RLS policies on starting_balances, entry_series, series_exceptions, and analytics_events tables.
-- Affected tables: starting_balances, entry_series, series_exceptions, analytics_events
-- Special considerations: Uses IF EXISTS to prevent errors if policies don't exist; RLS remains enabled but without policies, access will be denied by default.
-- Generated: 2025-11-28

-- Drop policies for starting_balances
DROP POLICY IF EXISTS starting_balances_select_anon ON starting_balances;
DROP POLICY IF EXISTS starting_balances_insert_anon ON starting_balances;
DROP POLICY IF EXISTS starting_balances_update_anon ON starting_balances;
DROP POLICY IF EXISTS starting_balances_delete_anon ON starting_balances;
DROP POLICY IF EXISTS starting_balances_select_authenticated ON starting_balances;
DROP POLICY IF EXISTS starting_balances_insert_authenticated ON starting_balances;
DROP POLICY IF EXISTS starting_balances_update_authenticated ON starting_balances;
DROP POLICY IF EXISTS starting_balances_delete_authenticated ON starting_balances;

-- Drop policies for entry_series
DROP POLICY IF EXISTS entry_series_select_anon ON entry_series;
DROP POLICY IF EXISTS entry_series_insert_anon ON entry_series;
DROP POLICY IF EXISTS entry_series_update_anon ON entry_series;
DROP POLICY IF EXISTS entry_series_delete_anon ON entry_series;
DROP POLICY IF EXISTS entry_series_select_authenticated ON entry_series;
DROP POLICY IF EXISTS entry_series_insert_authenticated ON entry_series;
DROP POLICY IF EXISTS entry_series_update_authenticated ON entry_series;
DROP POLICY IF EXISTS entry_series_delete_authenticated ON entry_series;

-- Drop policies for series_exceptions
DROP POLICY IF EXISTS series_exceptions_select_anon ON series_exceptions;
DROP POLICY IF EXISTS series_exceptions_insert_anon ON series_exceptions;
DROP POLICY IF EXISTS series_exceptions_update_anon ON series_exceptions;
DROP POLICY IF EXISTS series_exceptions_delete_anon ON series_exceptions;
DROP POLICY IF EXISTS series_exceptions_select_authenticated ON series_exceptions;
DROP POLICY IF EXISTS series_exceptions_insert_authenticated ON series_exceptions;
DROP POLICY IF EXISTS series_exceptions_update_authenticated ON series_exceptions;
DROP POLICY IF EXISTS series_exceptions_delete_authenticated ON series_exceptions;

-- Drop policies for analytics_events
DROP POLICY IF EXISTS analytics_events_select_anon ON analytics_events;
DROP POLICY IF EXISTS analytics_events_insert_anon ON analytics_events;
DROP POLICY IF EXISTS analytics_events_update_anon ON analytics_events;
DROP POLICY IF EXISTS analytics_events_delete_anon ON analytics_events;
DROP POLICY IF EXISTS analytics_events_select_authenticated ON analytics_events;
DROP POLICY IF EXISTS analytics_events_insert_authenticated ON analytics_events;
DROP POLICY IF EXISTS analytics_events_update_authenticated ON analytics_events;
DROP POLICY IF EXISTS analytics_events_delete_authenticated ON analytics_events;

-- End of migration
-- After running: supabase db push; Verify policies are dropped with \d+ table_name in psql; Note that RLS is still enabled, so recreate policies if needed or disable RLS with ALTER TABLE ... DISABLE ROW LEVEL SECURITY;
