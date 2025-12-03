-- Migration: Disable Row Level Security for development
-- Purpose: Disables RLS on all tables to allow unrestricted access during development.
-- Affected tables: starting_balances, entry_series, series_exceptions, analytics_events
-- Special considerations: This should ONLY be used in development. Re-enable RLS and policies before production deployment.
-- Generated: 2025-12-03

-- Disable RLS on all tables
ALTER TABLE starting_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE entry_series DISABLE ROW LEVEL SECURITY;
ALTER TABLE series_exceptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;

-- End of migration
-- After running: supabase db push or supabase db reset to apply changes
-- WARNING: Remember to re-enable RLS and create appropriate policies before production deployment!

