-- Migration: Fix weekly occurrences generation logic
-- Purpose: Removes incorrect DOW adjustment that caused weekly occurrences to be hidden.
-- The previous logic (es.weekday + 1) % 7 assumed a mismatch between stored weekday and Postgres DOW that does not exist.
-- Generated: 2025-12-05

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
            -- FIX: Removed (es.weekday + 1) % 7 adjustment. 
            -- es.weekday matches Postgres DOW (0=Sunday) as stored by frontend.
            AND EXTRACT(DOW FROM d.occurrence_date) = es.weekday 
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

