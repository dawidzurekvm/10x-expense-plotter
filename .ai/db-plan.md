# Database Schema - 10x Expense Plotter

## 1. Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
```

## 2. Enums

```sql
CREATE TYPE entry_type AS ENUM ('income', 'expense');
CREATE TYPE recurrence_type AS ENUM ('one_time', 'weekly', 'monthly');
CREATE TYPE exception_type AS ENUM ('skip', 'override');
```

## 3. Tables

### 3.1 starting_balances

Stores the single starting balance record per user with an effective date.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Unique identifier |
| user_id | uuid | NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE | Owner of the starting balance (one per user) |
| effective_date | date | NOT NULL | Date from which the starting balance is effective |
| amount | numeric(12,2) | NOT NULL CHECK (amount >= 0) | Starting balance amount in PLN (non-negative) |
| created_at | timestamptz | NOT NULL DEFAULT now() | Record creation timestamp |
| updated_at | timestamptz | NOT NULL DEFAULT now() | Record last update timestamp |

**Notes:**
- The `user_id` UNIQUE constraint enforces one starting balance per user
- Amount stored as positive value; can be zero
- All monetary values use `numeric(12,2)` to prevent floating-point errors

### 3.2 entry_series

Stores both one-time and recurring income/expense entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Unique identifier for the series |
| user_id | uuid | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE | Owner of the entry |
| parent_series_id | uuid | NULL REFERENCES entry_series(id) ON DELETE SET NULL | Reference to parent series for split lineage tracking |
| entry_type | entry_type | NOT NULL | Type: income or expense |
| recurrence_type | recurrence_type | NOT NULL | Recurrence: one_time, weekly, or monthly |
| title | text | NOT NULL CHECK (char_length(title) <= 120 AND char_length(title) > 0) | Entry title (1-120 characters) |
| description | text | NULL CHECK (description IS NULL OR char_length(description) <= 500) | Optional description (max 500 characters) |
| amount | numeric(12,2) | NOT NULL CHECK (amount > 0) | Amount in PLN (positive; sign determined by entry_type) |
| start_date | date | NOT NULL | First occurrence date or effective start date |
| end_date | date | NULL CHECK (end_date IS NULL OR end_date >= start_date) | Optional end date for recurring series |
| weekday | integer | NULL CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6)) | For weekly recurrence: 0=Monday, 6=Sunday |
| day_of_month | integer | NULL CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)) | For monthly recurrence: day of month (1-31) |
| effective_range | daterange | GENERATED ALWAYS AS (daterange(start_date, end_date, '[]')) STORED | Computed date range for exclusion constraint |
| created_at | timestamptz | NOT NULL DEFAULT now() | Record creation timestamp |
| updated_at | timestamptz | NOT NULL DEFAULT now() | Record last update timestamp |

**Constraints:**

```sql
-- Recurrence-specific field validation
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

-- Prevent overlapping date ranges within the same lineage
ALTER TABLE entry_series ADD CONSTRAINT no_overlapping_series_ranges
  EXCLUDE USING gist (
    user_id WITH =,
    COALESCE(parent_series_id, id) WITH =,
    effective_range WITH &&
  );
```

**Notes:**
- `parent_series_id` tracks lineage when series are split via "this and future" edits
- The exclusion constraint prevents overlapping date ranges for splits of the same logical series
- Recurrence fields are validated based on `recurrence_type` via CHECK constraints
- For monthly recurrence, `day_of_month` anchors the series; clamping logic is applied during expansion

### 3.3 series_exceptions

Stores exceptions (skip or override) for specific occurrences within recurring series.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Unique identifier |
| series_id | uuid | NOT NULL REFERENCES entry_series(id) ON DELETE CASCADE | Parent series |
| user_id | uuid | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE | Owner (denormalized for RLS performance) |
| exception_date | date | NOT NULL | Date of the exception |
| exception_type | exception_type | NOT NULL | Type: skip or override |
| title | text | NULL CHECK (title IS NULL OR (char_length(title) <= 120 AND char_length(title) > 0)) | Override title (for override type) |
| description | text | NULL CHECK (description IS NULL OR char_length(description) <= 500) | Override description (for override type) |
| amount | numeric(12,2) | NULL CHECK (amount IS NULL OR amount > 0) | Override amount (for override type) |
| created_at | timestamptz | NOT NULL DEFAULT now() | Exception creation timestamp |
| updated_at | timestamptz | NOT NULL DEFAULT now() | Exception last update timestamp |

**Constraints:**

```sql
-- Ensure only one exception per series and date
ALTER TABLE series_exceptions ADD CONSTRAINT unique_series_exception 
  UNIQUE (series_id, exception_date);

-- Override exceptions must have override fields
ALTER TABLE series_exceptions ADD CONSTRAINT override_requires_fields
  CHECK (
    exception_type != 'override' OR 
    (title IS NOT NULL AND amount IS NOT NULL)
  );

-- Skip exceptions should not have override fields
ALTER TABLE series_exceptions ADD CONSTRAINT skip_no_override_fields
  CHECK (
    exception_type != 'skip' OR 
    (title IS NULL AND description IS NULL AND amount IS NULL)
  );
```

**Notes:**
- `user_id` is denormalized from the parent series for simpler, faster RLS filtering
- Override exceptions replace occurrence attributes for that specific date
- Skip exceptions remove the occurrence for that date
- A BEFORE trigger validates that exception dates fall within the series' valid range

### 3.4 analytics_events

Stores instrumentation events for behavioral metrics and telemetry.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY DEFAULT gen_random_uuid() | Unique event identifier |
| user_id | uuid | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE | User who triggered the event |
| event_type | text | NOT NULL | Event name (e.g., entry_created, projection_viewed) |
| event_metadata | jsonb | NULL | Additional event metadata |
| created_at | timestamptz | NOT NULL DEFAULT now() | Event timestamp |

**Constraints:**

```sql
-- Validate known event types
ALTER TABLE analytics_events ADD CONSTRAINT valid_event_type
  CHECK (event_type IN (
    'entry_created',
    'entry_updated', 
    'entry_deleted',
    'projection_viewed'
  ));
```

**Notes:**
- Insert-only table for append-only event logging
- `event_metadata` stores flexible JSON data (e.g., `entry_type`, `recurrence_type`, edit scope)
- Records older than 28 days should be purged via scheduled job
- Consider partitioning by `created_at` if event volume becomes large

## 4. Relationships

### 4.1 One-to-One
- `auth.users(id)` ← `starting_balances.user_id` (UNIQUE)

### 4.2 One-to-Many
- `auth.users(id)` ← `entry_series.user_id` (CASCADE DELETE)
- `auth.users(id)` ← `series_exceptions.user_id` (CASCADE DELETE)
- `auth.users(id)` ← `analytics_events.user_id` (CASCADE DELETE)
- `entry_series(id)` ← `series_exceptions.series_id` (CASCADE DELETE)

### 4.3 Self-Referencing
- `entry_series(id)` ← `entry_series.parent_series_id` (SET NULL on delete)
  - Tracks lineage when series are split via "this and future" edits

## 5. Indexes

### 5.1 Primary Keys (Automatic B-tree)
- `starting_balances(id)`
- `entry_series(id)`
- `series_exceptions(id)`
- `analytics_events(id)`

### 5.2 Foreign Keys and Unique Constraints (Automatic)
- `starting_balances(user_id)` - UNIQUE index
- `entry_series(user_id)` - B-tree index
- `entry_series(parent_series_id)` - B-tree index
- `series_exceptions(series_id)` - B-tree index
- `series_exceptions(user_id)` - B-tree index
- `series_exceptions(series_id, exception_date)` - UNIQUE index
- `analytics_events(user_id)` - B-tree index

### 5.3 Custom Indexes for Query Performance

```sql
-- Fast date range queries for projection computation
CREATE INDEX idx_entry_series_user_dates 
  ON entry_series (user_id, start_date, end_date);

-- Optimize queries for specific recurrence types
CREATE INDEX idx_entry_series_user_recurrence 
  ON entry_series (user_id, recurrence_type) 
  INCLUDE (entry_type, amount);

-- Partial index for one-time entries (most selective queries)
CREATE INDEX idx_entry_series_one_time 
  ON entry_series (user_id, start_date) 
  WHERE recurrence_type = 'one_time';

-- Fast exception lookups during occurrence expansion
CREATE INDEX idx_series_exceptions_date 
  ON series_exceptions (series_id, exception_date);

-- Analytics event queries by user and time range
CREATE INDEX idx_analytics_events_user_time 
  ON analytics_events (user_id, created_at DESC);

-- GiST index for exclusion constraint (already created by constraint)
-- CREATE INDEX idx_entry_series_range_gist 
--   ON entry_series USING gist (user_id, COALESCE(parent_series_id, id), effective_range);
```

**Notes:**
- The GiST index for the exclusion constraint is automatically created
- Partial index on one-time entries improves query selectivity
- INCLUDE columns reduce index-only scan costs
- All indexes include `user_id` first to leverage RLS filtering

## 6. Row-Level Security (RLS) Policies

Enable RLS on all user-facing tables:

```sql
ALTER TABLE starting_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE entry_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE series_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
```

### 6.1 starting_balances Policies

```sql
-- Users can select their own starting balance
CREATE POLICY starting_balances_select ON starting_balances
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own starting balance (if none exists)
CREATE POLICY starting_balances_insert ON starting_balances
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own starting balance
CREATE POLICY starting_balances_update ON starting_balances
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own starting balance
CREATE POLICY starting_balances_delete ON starting_balances
  FOR DELETE
  USING (user_id = auth.uid());
```

### 6.2 entry_series Policies

```sql
-- Users can select their own entries
CREATE POLICY entry_series_select ON entry_series
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own entries
CREATE POLICY entry_series_insert ON entry_series
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own entries
CREATE POLICY entry_series_update ON entry_series
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own entries
CREATE POLICY entry_series_delete ON entry_series
  FOR DELETE
  USING (user_id = auth.uid());
```

### 6.3 series_exceptions Policies

```sql
-- Users can select their own exceptions
CREATE POLICY series_exceptions_select ON series_exceptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert exceptions for their own series
CREATE POLICY series_exceptions_insert ON series_exceptions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own exceptions
CREATE POLICY series_exceptions_update ON series_exceptions
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own exceptions
CREATE POLICY series_exceptions_delete ON series_exceptions
  FOR DELETE
  USING (user_id = auth.uid());
```

### 6.4 analytics_events Policies

```sql
-- Users can insert their own events
CREATE POLICY analytics_events_insert ON analytics_events
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- No SELECT, UPDATE, or DELETE policies (insert-only for users)
-- Admin/service accounts can query via service role
```

## 7. Database Functions

### 7.1 compute_monthly_occurrence

Computes the actual occurrence date for a monthly recurring entry, applying short-month clamping rules.

```sql
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
```

**Notes:**
- Handles leap years automatically (February 29th → 28th in non-leap years)
- Clamps 31st to 30th/29th/28th as appropriate for short months
- Marked `IMMUTABLE` for query optimization

### 7.2 expand_occurrences

Expands entry series into individual occurrences within a date range, applying all exceptions.

```sql
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
```

**Notes:**
- `SECURITY INVOKER` ensures RLS policies are respected
- Generates weekly occurrences by date arithmetic and weekday matching
- Uses `compute_monthly_occurrence` for monthly recurrence with clamping
- Applies skip exceptions by filtering them out; applies override exceptions by replacing fields
- Generates deterministic `occurrence_id` using UUID v5 from `(series_id, date)`
- Returns occurrences sorted by date for deterministic CSV export

### 7.3 project_balance

Computes the projected balance for a user on a specific target date.

```sql
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
```

**Notes:**
- `SECURITY INVOKER` respects RLS policies via `expand_occurrences`
- Returns `NULL` if no starting balance exists or target date is before starting date
- Sums income and expense separately for clarity and two-decimal precision
- Final rounding ensures two-decimal PLN output

### 7.4 get_current_date_warsaw

Returns the current date in Europe/Warsaw timezone.

```sql
CREATE OR REPLACE FUNCTION get_current_date_warsaw()
RETURNS date
LANGUAGE sql
STABLE
AS $$
  SELECT (now() AT TIME ZONE 'Europe/Warsaw')::date;
$$;
```

**Notes:**
- Used for determining "today" in projection range validation
- Marked `STABLE` as it changes only within a transaction

## 8. Database Triggers

### 8.1 updated_at Trigger Function

Automatically updates the `updated_at` timestamp on row modification.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
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
```

### 8.2 Exception Date Validation Trigger

Validates that exception dates fall within the parent series' valid range.

```sql
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

CREATE TRIGGER validate_exception_date_before_insert
  BEFORE INSERT OR UPDATE ON series_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION validate_exception_date();
```

**Notes:**
- Prevents exceptions from being created outside the series' valid date range
- Raises clear error messages for debugging

### 8.3 Series Exception user_id Sync Trigger

Ensures `user_id` on exceptions matches the parent series.

```sql
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
```

**Notes:**
- Automatically populates `user_id` from the parent series on insert
- Prevents user_id mismatches between exceptions and their parent series

## 9. Design Decisions and Notes

### 9.1 Single Wallet Model
- No separate `wallets` table; enforced via `UNIQUE(user_id)` on `starting_balances`
- Simplifies data model and eliminates need for wallet-level filtering

### 9.2 Consolidated Entry Model
- Single `entry_series` table for both one-time and recurring entries
- `recurrence_type` enum distinguishes behavior
- Recurrence-specific fields (`weekday`, `day_of_month`) validated via CHECK constraints

### 9.3 Exception-Based Editing
- Skip exceptions remove occurrences
- Override exceptions replace occurrence attributes
- Exceptions stored in dedicated table with `UNIQUE(series_id, date)`
- Enables "this occurrence" edits without soft-delete complexity

### 9.4 Series Splitting for "This and Future"
- "This and future" edits create a new series with `parent_series_id` reference
- Original series end date is updated; new series starts at the split date
- `EXCLUDE USING gist` constraint prevents overlapping date ranges within the same lineage
- Maintains edit history and enables potential audit trail

### 9.5 On-the-Fly Occurrence Expansion
- No materialized occurrence table; computed dynamically via `expand_occurrences`
- Reduces storage and eliminates sync issues
- Performance optimized via indexes and bounded date ranges (max 10 years forward)
- Deterministic `occurrence_id` generation enables stable CSV exports

### 9.6 Monthly Clamping Logic
- `compute_monthly_occurrence` function handles short-month clamping
- 31st → 30th/29th/28th as appropriate
- 29th → 29th (leap) or 28th (non-leap)
- Consistent behavior across queries and exports

### 9.7 Security and RLS
- RLS enabled on all user-facing tables
- Policies filter by `user_id = auth.uid()`
- Functions use `SECURITY INVOKER` to respect RLS
- `user_id` denormalized on `series_exceptions` for faster RLS filtering

### 9.8 Cascading Deletes
- All foreign keys to `auth.users` use `ON DELETE CASCADE`
- Deleting a series cascades to its exceptions
- Supports GDPR right to erasure (account deletion removes all data)

### 9.9 Optimistic Concurrency
- `updated_at` timestamp enables optimistic locking
- Clients can include `updated_at` in UPDATE WHERE clause to detect conflicts
- Alternative: use PostgreSQL's `xmin` system column for version tracking

### 9.10 Analytics and Retention
- `analytics_events` is insert-only for users
- 28-day retention enforced via scheduled cleanup job (external to schema)
- Partitioning by `created_at` considered for future scalability

### 9.11 Currency and Precision
- All amounts use `numeric(12,2)` for exact decimal arithmetic
- Prevents floating-point errors in balance calculations
- PLN currency implied; no multi-currency support in MVP

### 9.12 Date-Only Logic
- All date fields are `date` type (no time component)
- Eliminates DST and time-of-day complexity
- Europe/Warsaw timezone used only for determining "today"

### 9.13 Performance Targets
- P95 projection compute under 1 second for up to 1,000 active series
- Indexes optimized for date range queries
- Partial index on one-time entries (most common query pattern)
- INCLUDE columns reduce index-only scan costs

### 9.14 Validation Strategy
- Database-level constraints enforce data integrity
- Title 1-120 chars; description max 500 chars
- Amounts must be positive (sign determined by `entry_type`)
- End date >= start date when provided
- Recurrence fields validated per `recurrence_type`

### 9.15 No Client Idempotency Keys
- Decision made to not implement server-side idempotency via `client_request_id`
- Client-side guards prevent double-submission
- Simpler schema; idempotency can be added later if needed

## 10. Migration Considerations

### 10.1 Initial Setup Order
1. Enable extensions (`pgcrypto`, `uuid-ossp`, `btree_gist`)
2. Create enums (`entry_type`, `recurrence_type`, `exception_type`)
3. Create tables in dependency order:
   - `starting_balances`
   - `entry_series`
   - `series_exceptions`
   - `analytics_events`
4. Create indexes (after tables have data, if seeding)
5. Enable RLS and create policies
6. Create functions (`compute_monthly_occurrence`, `expand_occurrences`, `project_balance`, `get_current_date_warsaw`)
7. Create triggers

### 10.2 Supabase-Specific Notes
- Use Supabase migrations via CLI: `supabase migration new <name>`
- Ensure EU region is selected during project setup
- Sign Data Processing Agreement (DPA) with Supabase for GDPR compliance
- Service role bypasses RLS; use carefully in backend functions

### 10.3 Testing Recommendations
- Test monthly clamping with entries on 29th, 30th, 31st across all months
- Verify leap year handling (February 29th)
- Test series split scenarios with overlapping date ranges
- Validate RLS policies with multiple test users
- Load test `expand_occurrences` with 1,000+ series across 10-year range
- Verify CSV export consistency with repeated calls (deterministic `occurrence_id`)

### 10.4 Future Enhancements (Post-MVP)
- Add `categories` and `tags` tables for expense categorization
- Implement soft delete with `deleted_at` for audit trail
- Add `xmin`-based optimistic locking helper functions
- Partition `analytics_events` by month for better performance
- Add materialized view for frequently accessed projection dates (cache layer)
- Consider `idempotency_keys` table if needed
- Add rate limiting metadata table if implementing API rate limits

