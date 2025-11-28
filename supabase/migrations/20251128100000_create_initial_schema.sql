-- Migration: Create initial database schema for 10x Expense Plotter
-- Purpose: Sets up all necessary database structures for user balances, entry series, exceptions, analytics, with security and computation functions.
-- Affected tables: starting_balances, entry_series, series_exceptions, analytics_events
-- Special considerations: Enables RLS on all tables; creates granular policies for anon and authenticated roles; includes triggers for data integrity.
-- Generated: 2025-11-28

-- 1. Enable required extensions
-- These extensions provide UUID generation, encryption utilities, and GiST indexing for range exclusions.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Create enums
-- Enums define fixed sets of values for entry types, recurrence patterns, and exception handling.
CREATE TYPE entry_type AS ENUM ('income', 'expense');
CREATE TYPE recurrence_type AS ENUM ('one_time', 'weekly', 'monthly');
CREATE TYPE exception_type AS ENUM ('skip', 'override');

-- 3. Create tables

-- 3.1 starting_balances table
-- Stores the single starting balance record per user with an effective date.
-- Enforces one record per user via UNIQUE constraint on user_id.
CREATE TABLE starting_balances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    effective_date date NOT NULL,
    amount numeric(12,2) NOT NULL CHECK (amount >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.2 entry_series table
-- Stores both one-time and recurring income/expense entries.
-- Uses generated effective_range for overlap exclusion constraints.
-- parent_series_id tracks splits from "this and future" edits.
CREATE TABLE entry_series (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_series_id uuid NULL REFERENCES entry_series(id) ON DELETE SET NULL,
    entry_type entry_type NOT NULL,
    recurrence_type recurrence_type NOT NULL,
    title text NOT NULL CHECK (char_length(title) <= 120 AND char_length(title) > 0),
    description text NULL CHECK (description IS NULL OR char_length(description) <= 500),
    amount numeric(12,2) NOT NULL CHECK (amount > 0),
    start_date date NOT NULL,
    end_date date NULL CHECK (end_date IS NULL OR end_date >= start_date),
    weekday integer NULL CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6)),
    day_of_month integer NULL CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
    effective_range daterange GENERATED ALWAYS AS (daterange(start_date, end_date, '[]')) STORED,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.3 series_exceptions table
-- Stores exceptions (skip or override) for specific dates in recurring series.
-- Denormalizes user_id for RLS performance; synced via trigger.
CREATE TABLE series_exceptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    series_id uuid NOT NULL REFERENCES entry_series(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exception_date date NOT NULL,
    exception_type exception_type NOT NULL,
    title text NULL CHECK (title IS NULL OR (char_length(title) <= 120 AND char_length(title) > 0)),
    description text NULL CHECK (description IS NULL OR char_length(description) <= 500),
    amount numeric(12,2) NULL CHECK (amount IS NULL OR amount > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.4 analytics_events table
-- Stores append-only event logs for user interactions and telemetry.
-- No updated_at as it's insert-only for users.
CREATE TABLE analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    event_metadata jsonb NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Add table constraints

-- 4.1 Recurrence field validation for entry_series
-- Ensures appropriate fields are set based on recurrence_type.
ALTER TABLE entry_series ADD CONSTRAINT recurrence_fields_one_time 
    CHECK (
        recurrence_type != 'one_time' OR 
        (weekday IS NULL AND day_of_month IS NULL)
    );

ALTER TABLE entry_series ADD CONSTRAINT recurrence_fields_weekly 
    CHECK (
        recurrence_type != 'weekly' OR 
        (weekday IS NOT NULL AND day_of_month IS NULL)
    );

ALTER TABLE entry_series ADD CONSTRAINT recurrence_fields_monthly 
    CHECK (
        recurrence_type != 'monthly' OR 
        (weekday IS NULL AND day_of_month IS NOT NULL)
    );

-- 4.2 Prevent overlapping date ranges in entry_series lineage
-- Uses GiST exclusion to avoid overlaps within the same user and series lineage.
ALTER TABLE entry_series ADD CONSTRAINT no_overlapping_series_ranges
    EXCLUDE USING gist (
        user_id WITH =,
        COALESCE(parent_series_id, id) WITH =,
        effective_range WITH &&
    );

-- 4.3 Uniqueness and validation for series_exceptions
-- Ensures one exception per series-date; validates override/skip field requirements.
ALTER TABLE series_exceptions ADD CONSTRAINT unique_series_exception 
    UNIQUE (series_id, exception_date);

ALTER TABLE series_exceptions ADD CONSTRAINT override_requires_fields
    CHECK (
        exception_type != 'override' OR 
        (title IS NOT NULL AND amount IS NOT NULL)
    );

ALTER TABLE series_exceptions ADD CONSTRAINT skip_no_override_fields
    CHECK (
        exception_type != 'skip' OR 
        (title IS NULL AND description IS NULL AND amount IS NULL)
    );

-- 4.4 Valid event types for analytics_events
-- Restricts event_type to predefined values.
ALTER TABLE analytics_events ADD CONSTRAINT valid_event_type
    CHECK (event_type IN (
        'entry_created',
        'entry_updated', 
        'entry_deleted',
        'projection_viewed'
    ));

-- 5. Create indexes for performance
-- Indexes optimize date-range queries, recurrence filtering, and exception lookups.
-- All include user_id for RLS compatibility.

CREATE INDEX idx_entry_series_user_dates 
    ON entry_series (user_id, start_date, end_date);

CREATE INDEX idx_entry_series_user_recurrence 
    ON entry_series (user_id, recurrence_type) 
    INCLUDE (entry_type, amount);

CREATE INDEX idx_entry_series_one_time 
    ON entry_series (user_id, start_date) 
    WHERE recurrence_type = 'one_time';

CREATE INDEX idx_series_exceptions_date 
    ON series_exceptions (series_id, exception_date);

CREATE INDEX idx_analytics_events_user_time 
    ON analytics_events (user_id, created_at DESC);

-- Note: GiST index for no_overlapping_series_ranges is automatically created by the exclusion constraint.

-- 6. Enable Row Level Security (RLS) on all tables
-- RLS restricts access to user-owned data only.
ALTER TABLE starting_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies
-- Policies are granular: separate for each role (anon, authenticated) and operation (select, insert, update, delete).
-- Anon policies always deny access (false condition).
-- Authenticated policies allow access only to own data via user_id = auth.uid().
-- For analytics_events, only insert allowed for authenticated; all other operations denied.

-- 7.1 starting_balances Policies
-- Anon: Deny all operations.
CREATE POLICY starting_balances_select_anon ON starting_balances
    FOR SELECT USING (auth.role() = 'anon' AND false);

CREATE POLICY starting_balances_insert_anon ON starting_balances
    FOR INSERT WITH CHECK (auth.role() = 'anon' AND false);

CREATE POLICY starting_balances_update_anon ON starting_balances
    FOR UPDATE USING (auth.role() = 'anon' AND false)
    WITH CHECK (auth.role() = 'anon' AND false);

CREATE POLICY starting_balances_delete_anon ON starting_balances
    FOR DELETE USING (auth.role() = 'anon' AND false);

-- Authenticated: Allow full CRUD on own record.
CREATE POLICY starting_balances_select_authenticated ON starting_balances
    FOR SELECT USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY starting_balances_insert_authenticated ON starting_balances
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY starting_balances_update_authenticated ON starting_balances
    FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid())
    WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY starting_balances_delete_authenticated ON starting_balances
    FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 7.2 entry_series Policies
-- Anon: Deny all.
CREATE POLICY entry_series_select_anon ON entry_series
    FOR SELECT USING (auth.role() = 'anon' AND false);

CREATE POLICY entry_series_insert_anon ON entry_series
    FOR INSERT WITH CHECK (auth.role() = 'anon' AND false);

CREATE POLICY entry_series_update_anon ON entry_series
    FOR UPDATE USING (auth.role() = 'anon' AND false)
    WITH CHECK (auth.role() = 'anon' AND false);

CREATE POLICY entry_series_delete_anon ON entry_series
    FOR DELETE USING (auth.role() = 'anon' AND false);

-- Authenticated: Allow full CRUD on own entries.
CREATE POLICY entry_series_select_authenticated ON entry_series
    FOR SELECT USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY entry_series_insert_authenticated ON entry_series
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY entry_series_update_authenticated ON entry_series
    FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid())
    WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY entry_series_delete_authenticated ON entry_series
    FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 7.3 series_exceptions Policies
-- Anon: Deny all.
CREATE POLICY series_exceptions_select_anon ON series_exceptions
    FOR SELECT USING (auth.role() = 'anon' AND false);

CREATE POLICY series_exceptions_insert_anon ON series_exceptions
    FOR INSERT WITH CHECK (auth.role() = 'anon' AND false);

CREATE POLICY series_exceptions_update_anon ON series_exceptions
    FOR UPDATE USING (auth.role() = 'anon' AND false)
    WITH CHECK (auth.role() = 'anon' AND false);

CREATE POLICY series_exceptions_delete_anon ON series_exceptions
    FOR DELETE USING (auth.role() = 'anon' AND false);

-- Authenticated: Allow full CRUD on own exceptions.
CREATE POLICY series_exceptions_select_authenticated ON series_exceptions
    FOR SELECT USING (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY series_exceptions_insert_authenticated ON series_exceptions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY series_exceptions_update_authenticated ON series_exceptions
    FOR UPDATE USING (auth.role() = 'authenticated' AND user_id = auth.uid())
    WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY series_exceptions_delete_authenticated ON series_exceptions
    FOR DELETE USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 7.4 analytics_events Policies
-- Anon: Deny all operations.
CREATE POLICY analytics_events_select_anon ON analytics_events
    FOR SELECT USING (auth.role() = 'anon' AND false);

CREATE POLICY analytics_events_insert_anon ON analytics_events
    FOR INSERT WITH CHECK (auth.role() = 'anon' AND false);

CREATE POLICY analytics_events_update_anon ON analytics_events
    FOR UPDATE USING (auth.role() = 'anon' AND false)
    WITH CHECK (auth.role() = 'anon' AND false);

CREATE POLICY analytics_events_delete_anon ON analytics_events
    FOR DELETE USING (auth.role() = 'anon' AND false);

-- Authenticated: Allow insert only; deny select, update, delete.
-- Insert: Users can log their own events.
CREATE POLICY analytics_events_insert_authenticated ON analytics_events
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY analytics_events_select_authenticated ON analytics_events
    FOR SELECT USING (auth.role() = 'authenticated' AND false);

CREATE POLICY analytics_events_update_authenticated ON analytics_events
    FOR UPDATE USING (auth.role() = 'authenticated' AND false)
    WITH CHECK (auth.role() = 'authenticated' AND false);

CREATE POLICY analytics_events_delete_authenticated ON analytics_events
    FOR DELETE USING (auth.role() = 'authenticated' AND false);

-- 8. Create database functions

-- 8.1 compute_monthly_occurrence
-- Computes clamped occurrence date for monthly recurrences in short months.
-- Handles leap years and month-end boundaries immutably for optimization.
CREATE OR REPLACE FUNCTION compute_monthly_occurrence(
    anchor_dom integer,
    target_year integer,
    target_month integer
) RETURNS date
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    last_day_of_month integer;
    actual_dom integer;
BEGIN
    -- Get the last day of the target month
    last_day_of_month := EXTRACT(DAY FROM 
        (make_date(target_year, target_month, 1) + interval '1 month - 1 day')::date
    );
    
    -- Clamp anchor day to valid range for this month
    actual_dom := LEAST(anchor_dom, last_day_of_month);
    
    RETURN make_date(target_year, target_month, actual_dom);
END;
$$;

-- 8.2 expand_occurrences
-- Generates individual occurrences from series within a date range, applying exceptions.
-- Supports one-time, weekly, and monthly recurrences; skips or overrides via exceptions.
-- SECURITY INVOKER ensures RLS is applied during execution.
-- Returns deterministic occurrence_id for stable exports.
CREATE OR REPLACE FUNCTION expand_occurrences(
    p_user_id uuid,
    p_from_date date,
    p_to_date date
)
RETURNS TABLE (
    occurrence_id uuid,
    series_id uuid,
    entry_type entry_type,
    title text,
    description text,
    occurrence_date date,
    amount numeric(12,2),
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE
    -- Generate all potential occurrence dates for each series
    occurrence_expansion AS (
        -- One-time entries
        SELECT
            es.id AS series_id,
            es.entry_type,
            es.title,
            es.description,
            es.start_date AS occurrence_date,
            es.amount,
            es.created_at,
            es.updated_at,
            es.recurrence_type
        FROM entry_series es
        WHERE es.user_id = p_user_id
            AND es.recurrence_type = 'one_time'
            AND es.start_date BETWEEN p_from_date AND p_to_date
        
        UNION ALL
        
        -- Weekly recurring entries
        SELECT
            es.id AS series_id,
            es.entry_type,
            es.title,
            es.description,
            d.occurrence_date,
            es.amount,
            es.created_at,
            es.updated_at,
            es.recurrence_type
        FROM entry_series es
        CROSS JOIN LATERAL (
            SELECT generate_series(
                es.start_date,
                LEAST(COALESCE(es.end_date, p_to_date), p_to_date),
                interval '1 week'
            )::date AS occurrence_date
        ) d
        WHERE es.user_id = p_user_id
            AND es.recurrence_type = 'weekly'
            AND EXTRACT(DOW FROM d.occurrence_date) = (es.weekday + 1) % 7  -- Adjust for PostgreSQL DOW (0=Sunday)
            AND d.occurrence_date BETWEEN p_from_date AND p_to_date
        
        UNION ALL
        
        -- Monthly recurring entries
        SELECT
            es.id AS series_id,
            es.entry_type,
            es.title,
            es.description,
            compute_monthly_occurrence(
                es.day_of_month,
                EXTRACT(YEAR FROM m.month_date)::integer,
                EXTRACT(MONTH FROM m.month_date)::integer
            ) AS occurrence_date,
            es.amount,
            es.created_at,
            es.updated_at,
            es.recurrence_type
        FROM entry_series es
        CROSS JOIN LATERAL (
            SELECT generate_series(
                date_trunc('month', es.start_date),
                LEAST(
                    date_trunc('month', COALESCE(es.end_date, p_to_date)),
                    date_trunc('month', p_to_date)
                ),
                interval '1 month'
            )::date AS month_date
        ) m
        WHERE es.user_id = p_user_id
            AND es.recurrence_type = 'monthly'
            AND compute_monthly_occurrence(
                es.day_of_month,
                EXTRACT(YEAR FROM m.month_date)::integer,
                EXTRACT(MONTH FROM m.month_date)::integer
            ) BETWEEN p_from_date AND p_to_date
            AND compute_monthly_occurrence(
                es.day_of_month,
                EXTRACT(YEAR FROM m.month_date)::integer,
                EXTRACT(MONTH FROM m.month_date)::integer
            ) >= es.start_date
            AND (es.end_date IS NULL OR 
                compute_monthly_occurrence(
                    es.day_of_month,
                    EXTRACT(YEAR FROM m.month_date)::integer,
                    EXTRACT(MONTH FROM m.month_date)::integer
                ) <= es.end_date)
    ),
    -- Apply exceptions (skip or override)
    occurrences_with_exceptions AS (
        SELECT
            oe.series_id,
            oe.entry_type,
            COALESCE(se.title, oe.title) AS title,
            COALESCE(se.description, oe.description) AS description,
            oe.occurrence_date,
            COALESCE(se.amount, oe.amount) AS amount,
            COALESCE(se.created_at, oe.created_at) AS created_at,
            COALESCE(se.updated_at, oe.updated_at) AS updated_at,
            se.exception_type
        FROM occurrence_expansion oe
        LEFT JOIN series_exceptions se 
            ON se.series_id = oe.series_id 
            AND se.exception_date = oe.occurrence_date
            AND se.user_id = p_user_id
        WHERE se.exception_type IS NULL OR se.exception_type = 'override'
    )
    -- Generate deterministic occurrence_id and return final results
    SELECT
        uuid_generate_v5(
            '6ba7b810-9dad-11d1-80b4-00c04fd430c8'::uuid,  -- Namespace UUID
            owe.series_id::text || '|' || owe.occurrence_date::text
        ) AS occurrence_id,
        owe.series_id,
        owe.entry_type,
        owe.title,
        owe.description,
        owe.occurrence_date,
        owe.amount,
        owe.created_at,
        owe.updated_at
    FROM occurrences_with_exceptions owe
    ORDER BY owe.occurrence_date, owe.series_id;
END;
$$;

-- 8.3 project_balance
-- Computes projected balance up to a target date, incorporating starting balance and expanded occurrences.
-- Returns NULL if no starting balance or target before effective date.
-- SECURITY INVOKER applies RLS through expand_occurrences.
CREATE OR REPLACE FUNCTION project_balance(
    p_user_id uuid,
    p_target_date date
)
RETURNS numeric(12,2)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
    v_starting_balance numeric(12,2);
    v_starting_date date;
    v_total_income numeric(12,2);
    v_total_expense numeric(12,2);
    v_balance numeric(12,2);
BEGIN
    -- Get starting balance and effective date
    SELECT amount, effective_date
    INTO v_starting_balance, v_starting_date
    FROM starting_balances
    WHERE user_id = p_user_id;
    
    -- If no starting balance exists, return NULL
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- If target date is before starting date, return NULL (out of range)
    IF p_target_date < v_starting_date THEN
        RETURN NULL;
    END IF;
    
    -- Calculate total income up to target date
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_income
    FROM expand_occurrences(p_user_id, v_starting_date, p_target_date)
    WHERE entry_type = 'income';
    
    -- Calculate total expense up to target date
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_expense
    FROM expand_occurrences(p_user_id, v_starting_date, p_target_date)
    WHERE entry_type = 'expense';
    
    -- Compute final balance
    v_balance := v_starting_balance + v_total_income - v_total_expense;
    
    RETURN ROUND(v_balance, 2);
END;
$$;

-- 8.4 get_current_date_warsaw
-- Returns current date in Europe/Warsaw timezone for "today" logic.
-- STABLE as it depends only on transaction start time.
CREATE OR REPLACE FUNCTION get_current_date_warsaw()
RETURNS date
LANGUAGE sql
STABLE
AS $$
    SELECT (now() AT TIME ZONE 'Europe/Warsaw')::date;
$$;

-- 9. Create triggers

-- 9.1 updated_at trigger function
-- Automatically sets updated_at to now() on row updates.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply updated_at triggers to tables with updated_at column
CREATE TRIGGER set_updated_at_starting_balances
    BEFORE UPDATE ON starting_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_entry_series
    BEFORE UPDATE ON entry_series
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_series_exceptions
    BEFORE UPDATE ON series_exceptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9.2 Exception date validation trigger
-- Ensures exception_date is within the parent series' start_date and end_date range.
-- Raises exception with clear message if invalid.
CREATE OR REPLACE FUNCTION validate_exception_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_start_date date;
    v_end_date date;
BEGIN
    -- Get the parent series date range
    SELECT start_date, end_date
    INTO v_start_date, v_end_date
    FROM entry_series
    WHERE id = NEW.series_id;
    
    -- Check if exception date is within series range
    IF NEW.exception_date < v_start_date THEN
        RAISE EXCEPTION 'Exception date % is before series start date %', 
            NEW.exception_date, v_start_date;
    END IF;
    
    IF v_end_date IS NOT NULL AND NEW.exception_date > v_end_date THEN
        RAISE EXCEPTION 'Exception date % is after series end date %', 
            NEW.exception_date, v_end_date;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_exception_date_before_insert_update
    BEFORE INSERT OR UPDATE ON series_exceptions
    FOR EACH ROW
    EXECUTE FUNCTION validate_exception_date();

-- 9.3 Series exception user_id sync trigger
-- Automatically sets user_id from parent series on insert to maintain consistency.
CREATE OR REPLACE FUNCTION sync_exception_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Automatically set user_id from parent series
    SELECT user_id INTO NEW.user_id
    FROM entry_series
    WHERE id = NEW.series_id;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER sync_exception_user_id_before_insert
    BEFORE INSERT ON series_exceptions
    FOR EACH ROW
    EXECUTE FUNCTION sync_exception_user_id();

-- End of migration
-- After running, consider: supabase db push; Test RLS with multiple users; Verify functions with sample data.
