# REST API Plan - 10x Expense Plotter

## 1. Overview

This REST API serves the 10x Expense Plotter web application, providing endpoints for managing personal finances including income/expense tracking, balance projections, and data export. The API is built on Astro 5 with TypeScript, backed by Supabase (PostgreSQL) in the EU region.

**Base URL:** `/api`

**Authentication:** All endpoints (except authentication-related) require a valid Supabase JWT token passed in the `Authorization` header as `Bearer <token>`.

**Content Type:** All request and response payloads use `application/json` unless otherwise specified.

**Timezone:** All date computations use Europe/Warsaw timezone. Date fields are date-only (no time component).

**Currency:** All monetary amounts are in PLN with two decimal places.

## 2. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Starting Balance | `starting_balances` | Single starting balance record per user with effective date |
| Entries | `entry_series` | One-time and recurring income/expense entries |
| Occurrences | `expand_occurrences()` | Expanded individual occurrences of entries within a date range |
| Projection | `project_balance()` | Computed balance projection for a specific date |
| Export | `expand_occurrences()` | CSV export of expanded occurrences |
| Account | `auth.users` | User account and authentication |
| Analytics Events | `analytics_events` | Telemetry events (client-side via Supabase) |

## 3. Endpoints

### 3.1 Starting Balance

#### GET /api/starting-balance

Retrieve the user's single starting balance.

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "effective_date": "YYYY-MM-DD",
  "amount": "decimal(12,2)",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Success Codes:**
- `200 OK` - Starting balance retrieved successfully
- `404 Not Found` - No starting balance exists for this user

**Error Codes:**
- `401 Unauthorized` - Invalid or missing authentication token

---

#### PUT /api/starting-balance

Create or update the user's starting balance (upsert operation).

**Query Parameters:** None

**Request Payload:**
```json
{
  "effective_date": "YYYY-MM-DD",
  "amount": "decimal(12,2)"
}
```

**Validation:**
- `amount`: Required, must be >= 0, max 2 decimal places
- `effective_date`: Required, valid date

**Response Payload:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "effective_date": "YYYY-MM-DD",
  "amount": "decimal(12,2)",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Success Codes:**
- `200 OK` - Starting balance updated
- `201 Created` - Starting balance created

**Error Codes:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Invalid or missing authentication token

**Example Error Response:**
```json
{
  "error": "Validation failed",
  "details": {
    "amount": "Amount must be non-negative",
    "effective_date": "Invalid date format"
  }
}
```

---

#### DELETE /api/starting-balance

Delete the user's starting balance.

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**
```json
{
  "message": "Starting balance deleted successfully"
}
```

**Success Codes:**
- `200 OK` - Starting balance deleted
- `404 Not Found` - No starting balance exists

**Error Codes:**
- `401 Unauthorized` - Invalid or missing authentication token

---

### 3.2 Entries

#### GET /api/entries

Retrieve a list of the user's entry series with optional filtering, sorting, and pagination.

**Query Parameters:**
- `entry_type` (optional): Filter by `income` or `expense`
- `recurrence_type` (optional): Filter by `one_time`, `weekly`, or `monthly`
- `start_date_from` (optional): Filter entries starting on or after this date
- `start_date_to` (optional): Filter entries starting on or before this date
- `limit` (optional): Number of results per page (default: 50, max: 100)
- `offset` (optional): Number of results to skip (default: 0)
- `sort_by` (optional): Field to sort by (`start_date`, `created_at`, `amount`) (default: `start_date`)
- `sort_order` (optional): `asc` or `desc` (default: `desc`)

**Request Payload:** None

**Response Payload:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "parent_series_id": "uuid | null",
      "entry_type": "income | expense",
      "recurrence_type": "one_time | weekly | monthly",
      "title": "string",
      "description": "string | null",
      "amount": "decimal(12,2)",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD | null",
      "weekday": "integer | null",
      "day_of_month": "integer | null",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "total": "integer",
    "limit": "integer",
    "offset": "integer"
  }
}
```

**Success Codes:**
- `200 OK` - Entries retrieved successfully

**Error Codes:**
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Invalid or missing authentication token

---

#### GET /api/entries/:id

Retrieve a specific entry series by ID.

**Query Parameters:** None

**Request Payload:** None

**Response Payload:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "parent_series_id": "uuid | null",
  "entry_type": "income | expense",
  "recurrence_type": "one_time | weekly | monthly",
  "title": "string",
  "description": "string | null",
  "amount": "decimal(12,2)",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD | null",
  "weekday": "integer | null",
  "day_of_month": "integer | null",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp",
  "exceptions": [
    {
      "id": "uuid",
      "exception_date": "YYYY-MM-DD",
      "exception_type": "skip | override",
      "title": "string | null",
      "description": "string | null",
      "amount": "decimal(12,2) | null"
    }
  ]
}
```

**Success Codes:**
- `200 OK` - Entry retrieved successfully

**Error Codes:**
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - Entry not found or does not belong to user

---

#### POST /api/entries

Create a new entry (one-time or recurring).

**Query Parameters:** None

**Request Payload:**
```json
{
  "entry_type": "income | expense",
  "recurrence_type": "one_time | weekly | monthly",
  "title": "string",
  "description": "string | null",
  "amount": "decimal(12,2)",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD | null",
  "weekday": "integer | null",
  "day_of_month": "integer | null"
}
```

**Validation:**
- `entry_type`: Required, must be `income` or `expense`
- `recurrence_type`: Required, must be `one_time`, `weekly`, or `monthly`
- `title`: Required, 1-120 characters
- `description`: Optional, max 500 characters
- `amount`: Required, must be > 0, max 2 decimal places
- `start_date`: Required, valid date
- `end_date`: Optional, must be >= start_date if provided
- `weekday`: Required if recurrence_type is `weekly`, must be 0-6 (0=Monday, 6=Sunday), null otherwise
- `day_of_month`: Required if recurrence_type is `monthly`, must be 1-31, null otherwise
- For `one_time`: both `weekday` and `day_of_month` must be null

**Response Payload:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "parent_series_id": null,
  "entry_type": "income | expense",
  "recurrence_type": "one_time | weekly | monthly",
  "title": "string",
  "description": "string | null",
  "amount": "decimal(12,2)",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD | null",
  "weekday": "integer | null",
  "day_of_month": "integer | null",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Success Codes:**
- `201 Created` - Entry created successfully

**Error Codes:**
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Invalid or missing authentication token

**Example Error Response:**
```json
{
  "error": "Validation failed",
  "details": {
    "title": "Title is required and must be 1-120 characters",
    "amount": "Amount must be positive",
    "weekday": "Weekday is required for weekly recurrence",
    "end_date": "End date must be on or after start date"
  }
}
```

---

#### PUT /api/entries/:id

Update an existing entry with edit scope control.

**Query Parameters:**
- `scope` (required): `occurrence` | `future` | `entire`
- `date` (required if scope is `occurrence` or `future`): Date of the occurrence to edit (YYYY-MM-DD)

**Request Payload:**
```json
{
  "entry_type": "income | expense",
  "title": "string",
  "description": "string | null",
  "amount": "decimal(12,2)",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD | null",
  "weekday": "integer | null",
  "day_of_month": "integer | null"
}
```

**Validation:** Same as POST /api/entries

**Business Logic by Scope:**

**scope=occurrence:**
- Creates an override exception in `series_exceptions` for the specified date
- Original series remains unchanged
- Only `title`, `description`, and `amount` are used from the request payload

**scope=future:**
- Updates the original series `end_date` to the day before the specified date
- Creates a new series with `parent_series_id` pointing to original series
- New series starts at the specified date with updated attributes
- Prevents overlapping date ranges via exclusion constraint

**scope=entire:**
- Updates the base series directly
- All existing exceptions remain in place

**Response Payload:**

For `scope=occurrence`:
```json
{
  "exception": {
    "id": "uuid",
    "series_id": "uuid",
    "exception_date": "YYYY-MM-DD",
    "exception_type": "override",
    "title": "string",
    "description": "string | null",
    "amount": "decimal(12,2)",
    "created_at": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp"
  }
}
```

For `scope=future`:
```json
{
  "original_series": {
    "id": "uuid",
    "end_date": "YYYY-MM-DD",
    "updated_at": "ISO 8601 timestamp"
  },
  "new_series": {
    "id": "uuid",
    "parent_series_id": "uuid",
    "entry_type": "income | expense",
    "recurrence_type": "one_time | weekly | monthly",
    "title": "string",
    "description": "string | null",
    "amount": "decimal(12,2)",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD | null",
    "weekday": "integer | null",
    "day_of_month": "integer | null",
    "created_at": "ISO 8601 timestamp",
    "updated_at": "ISO 8601 timestamp"
  }
}
```

For `scope=entire`:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "parent_series_id": "uuid | null",
  "entry_type": "income | expense",
  "recurrence_type": "one_time | weekly | monthly",
  "title": "string",
  "description": "string | null",
  "amount": "decimal(12,2)",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD | null",
  "weekday": "integer | null",
  "day_of_month": "integer | null",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp"
}
```

**Success Codes:**
- `200 OK` - Entry updated successfully

**Error Codes:**
- `400 Bad Request` - Validation failed or missing required query parameters
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - Entry not found
- `409 Conflict` - Overlapping date ranges for series split (scope=future)

---

#### DELETE /api/entries/:id

Delete an entry with scope control.

**Query Parameters:**
- `scope` (required): `occurrence` | `future` | `entire`
- `date` (required if scope is `occurrence` or `future`): Date of the occurrence to delete (YYYY-MM-DD)

**Request Payload:** None

**Business Logic by Scope:**

**scope=occurrence:**
- Creates a skip exception in `series_exceptions` for the specified date
- Original series remains unchanged

**scope=future:**
- If the specified date equals the series start_date, deletes the entire series
- Otherwise, updates the original series `end_date` to the day before the specified date

**scope=entire:**
- Deletes the base series and all related exceptions (cascade delete)

**Response Payload:**
```json
{
  "message": "Entry deleted successfully",
  "scope": "occurrence | future | entire",
  "affected": {
    "series_deleted": "boolean",
    "exception_created": "boolean"
  }
}
```

**Success Codes:**
- `200 OK` - Entry deleted successfully

**Error Codes:**
- `400 Bad Request` - Missing required query parameters
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - Entry not found

---

### 3.3 Occurrences

#### GET /api/occurrences

Retrieve expanded occurrences for all entries within a date range.

**Query Parameters:**
- `from_date` (required): Start date (YYYY-MM-DD)
- `to_date` (required): End date (YYYY-MM-DD)
- `entry_type` (optional): Filter by `income` or `expense`
- `limit` (optional): Number of results per page (default: 100, max: 1000)
- `offset` (optional): Number of results to skip (default: 0)

**Request Payload:** None

**Response Payload:**
```json
{
  "data": [
    {
      "occurrence_id": "uuid",
      "series_id": "uuid",
      "entry_type": "income | expense",
      "title": "string",
      "description": "string | null",
      "occurrence_date": "YYYY-MM-DD",
      "amount": "decimal(12,2)",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "total": "integer",
    "limit": "integer",
    "offset": "integer"
  }
}
```

**Success Codes:**
- `200 OK` - Occurrences retrieved successfully

**Error Codes:**
- `400 Bad Request` - Invalid date range or date range exceeds 10 years
- `401 Unauthorized` - Invalid or missing authentication token

**Notes:**
- Calls `expand_occurrences()` database function
- Applies all skip and override exceptions
- Sorted by occurrence_date ascending

---

#### GET /api/entries/:id/occurrences

Retrieve expanded occurrences for a specific entry series within a date range.

**Query Parameters:**
- `from_date` (required): Start date (YYYY-MM-DD)
- `to_date` (required): End date (YYYY-MM-DD)

**Request Payload:** None

**Response Payload:**
```json
{
  "series_id": "uuid",
  "data": [
    {
      "occurrence_id": "uuid",
      "entry_type": "income | expense",
      "title": "string",
      "description": "string | null",
      "occurrence_date": "YYYY-MM-DD",
      "amount": "decimal(12,2)",
      "is_exception": "boolean",
      "exception_type": "skip | override | null"
    }
  ]
}
```

**Success Codes:**
- `200 OK` - Occurrences retrieved successfully

**Error Codes:**
- `400 Bad Request` - Invalid date range
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - Entry not found

---

### 3.4 Projection

#### GET /api/projection

Compute the projected balance for a specific date or date range.

**Query Parameters:**
- `date` (required): Target date for balance projection (YYYY-MM-DD)

**Request Payload:** None

**Response Payload:**
```json
{
  "target_date": "YYYY-MM-DD",
  "projected_balance": "decimal(12,2)",
  "starting_balance": {
    "amount": "decimal(12,2)",
    "effective_date": "YYYY-MM-DD"
  },
  "computation": {
    "total_income": "decimal(12,2)",
    "total_expense": "decimal(12,2)",
    "net_change": "decimal(12,2)"
  },
  "date_range_limits": {
    "min_date": "YYYY-MM-DD",
    "max_date": "YYYY-MM-DD"
  }
}
```

**Success Codes:**
- `200 OK` - Projection computed successfully

**Error Codes:**
- `400 Bad Request` - Invalid date or date out of allowed range
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - No starting balance configured

**Validation:**
- `date` must be between starting balance effective date and current date + 10 years
- Returns null balance if target date is before starting balance date

**Notes:**
- Calls `project_balance()` database function
- Uses `expand_occurrences()` internally to compute totals
- Balance formula: starting_balance + total_income - total_expense

---

### 3.5 Export

#### GET /api/export/csv

Export expanded occurrences as a CSV file.

**Query Parameters:**
- `from_date` (optional): Start date (YYYY-MM-DD) - defaults to starting balance effective date
- `to_date` (optional): End date (YYYY-MM-DD) - defaults to current date + 10 years
- `entry_type` (optional): Filter by `income` or `expense`

**Request Payload:** None

**Response:**
- **Content-Type:** `text/csv; charset=utf-8`
- **Content-Disposition:** `attachment; filename="10x-expense-plotter-export-YYYY-MM-DD.csv"`

**CSV Format:**
```csv
occurrence_id,series_id,type,title,description,date,amount_pln,created_at,updated_at
uuid,uuid,income,Monthly Salary,"",2024-01-15,5000.00,2024-01-01T10:00:00Z,2024-01-01T10:00:00Z
uuid,uuid,expense,Rent Payment,"Monthly apartment rent",2024-01-01,-1500.00,2024-01-01T10:05:00Z,2024-01-01T10:05:00Z
```

**CSV Columns:**
- `occurrence_id`: UUID v5 generated deterministically from (series_id, date)
- `series_id`: UUID of the parent series
- `type`: `income` or `expense`
- `title`: Entry title
- `description`: Entry description (empty string if null)
- `date`: Occurrence date (YYYY-MM-DD)
- `amount_pln`: Signed amount (positive for income, negative for expense)
- `created_at`: ISO 8601 timestamp
- `updated_at`: ISO 8601 timestamp

**Success Codes:**
- `200 OK` - CSV file generated successfully

**Error Codes:**
- `400 Bad Request` - Invalid date range or date range exceeds limits
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - No starting balance configured

**Notes:**
- Calls `expand_occurrences()` database function
- Deterministic occurrence_id ensures consistent exports
- Amounts are signed: positive for income, negative for expense
- Sorted by date ascending, then series_id

---

### 3.6 Account Management

#### DELETE /api/account

Permanently delete the authenticated user's account and all associated data.

**Query Parameters:** None

**Request Payload:**
```json
{
  "confirmation": "DELETE MY ACCOUNT"
}
```

**Response Payload:**
```json
{
  "message": "Account deleted successfully"
}
```

**Success Codes:**
- `200 OK` - Account deleted successfully

**Error Codes:**
- `400 Bad Request` - Missing or incorrect confirmation string
- `401 Unauthorized` - Invalid or missing authentication token

**Notes:**
- Cascading deletes remove all user data: starting_balances, entry_series, series_exceptions, analytics_events
- User is immediately logged out
- Action is irreversible

---

## 4. Authentication and Authorization

### 4.1 Authentication Mechanism

The API uses **Supabase Authentication** with JWT (JSON Web Tokens).

**Flow:**
1. Client authenticates via Supabase client SDK (email/password, password reset, etc.)
2. Supabase returns a JWT access token and refresh token
3. Client includes the access token in the `Authorization` header for all API requests
4. API validates the JWT using Supabase's built-in verification
5. Expired tokens are automatically refreshed by the Supabase client SDK

**Authentication Endpoints** (handled by Supabase, not custom API):
- Sign up: Supabase Auth API
- Sign in: Supabase Auth API
- Sign out: Supabase Auth API
- Password reset: Supabase Auth API
- Email verification: Supabase Auth API

### 4.2 Authorization Model

**Row-Level Security (RLS):**
All database tables have RLS enabled with policies that filter by `user_id = auth.uid()`. This ensures users can only access their own data.

**API Authorization:**
- All endpoints (except authentication) require a valid JWT token
- The `user_id` is extracted from the JWT claims (`auth.uid()`)
- Supabase RLS policies automatically filter queries by the authenticated user
- No additional authorization logic needed at the API layer

**Security Principles:**
- Never use the Supabase service role for user-facing endpoints
- All database functions use `SECURITY INVOKER` to respect RLS
- JWT tokens are validated on every request
- No rate limiting in MVP (may be added post-launch)

### 4.3 Error Responses for Authentication

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

---

## 5. Validation and Business Logic

### 5.1 Validation Rules by Resource

#### Starting Balance
| Field | Rule |
|-------|------|
| amount | Required, numeric, >= 0, max 2 decimal places |
| effective_date | Required, valid date (YYYY-MM-DD) |

#### Entry Series
| Field | Rule |
|-------|------|
| entry_type | Required, enum: `income` or `expense` |
| recurrence_type | Required, enum: `one_time`, `weekly`, `monthly` |
| title | Required, string, 1-120 characters |
| description | Optional, string, max 500 characters |
| amount | Required, numeric, > 0, max 2 decimal places |
| start_date | Required, valid date (YYYY-MM-DD) |
| end_date | Optional, valid date, must be >= start_date |
| weekday | Required if recurrence_type=`weekly`, integer 0-6, null otherwise |
| day_of_month | Required if recurrence_type=`monthly`, integer 1-31, null otherwise |

**Recurrence-Specific Validation:**
- `one_time`: Both `weekday` and `day_of_month` must be null
- `weekly`: `weekday` must be provided (0-6), `day_of_month` must be null
- `monthly`: `day_of_month` must be provided (1-31), `weekday` must be null

#### Series Exceptions
| Field | Rule |
|-------|------|
| exception_date | Required, valid date, must be within series date range |
| exception_type | Required, enum: `skip` or `override` |
| title | Required if exception_type=`override`, 1-120 characters, null for skip |
| description | Optional, max 500 characters |
| amount | Required if exception_type=`override`, > 0, null for skip |

#### Analytics Events
| Field | Rule |
|-------|------|
| event_type | Required, enum: `entry_created`, `entry_updated`, `entry_deleted`, `projection_viewed` |
| event_metadata | Optional, valid JSON object |

### 5.2 Business Logic Implementation

#### BL-1: Monthly Clamping
**Requirement:** For monthly recurring entries, if the target month has fewer days than the anchor day, schedule on the last valid day.

**Implementation:**
- Database function `compute_monthly_occurrence(anchor_dom, target_year, target_month)` handles clamping
- Examples:
  - Anchor day 31 in February → 28 (or 29 in leap years)
  - Anchor day 31 in April → 30
  - Anchor day 29 in February (non-leap year) → 28

**API Validation:**
- `day_of_month` accepts 1-31
- No client-side clamping needed; database handles it during occurrence expansion

---

#### BL-2: Series Splitting (This and Future)
**Requirement:** Edit a recurring series from a specific occurrence forward.

**Implementation:**
1. Validate the original series exists and belongs to the user
2. Validate the specified date is within the series date range
3. Calculate the day before the specified date as the new end_date for the original series
4. Update the original series: `end_date = date - 1 day`
5. Create a new series:
   - Copy all attributes from the request payload
   - Set `parent_series_id` to the original series ID
   - Set `start_date` to the specified date
   - Maintain the same `recurrence_type`, `weekday`, or `day_of_month`
6. The database exclusion constraint prevents overlapping date ranges

**API Endpoint:** `PUT /api/entries/:id?scope=future&date=YYYY-MM-DD`

**Database Constraint:**
```sql
EXCLUDE USING gist (
  user_id WITH =,
  COALESCE(parent_series_id, id) WITH =,
  effective_range WITH &&
)
```

---

#### BL-3: Exception Creation (This Occurrence)
**Requirement:** Edit or delete a single occurrence without affecting the series.

**Implementation for Edit:**
1. Validate the series exists and the date is within its range
2. Create or update an override exception in `series_exceptions`:
   - `series_id`: ID of the parent series
   - `exception_date`: The specified occurrence date
   - `exception_type`: `override`
   - `title`, `description`, `amount`: From request payload
3. The exception is applied by `expand_occurrences()` function

**Implementation for Delete:**
1. Validate the series exists and the date is within its range
2. Create a skip exception in `series_exceptions`:
   - `series_id`: ID of the parent series
   - `exception_date`: The specified occurrence date
   - `exception_type`: `skip`
3. The occurrence is filtered out by `expand_occurrences()` function

**API Endpoints:**
- Edit: `PUT /api/entries/:id?scope=occurrence&date=YYYY-MM-DD`
- Delete: `DELETE /api/entries/:id?scope=occurrence&date=YYYY-MM-DD`

**Database Trigger:**
- `validate_exception_date()` ensures exception dates are within series range

---

#### BL-4: Projection Computation
**Requirement:** Compute projected balance on a specific date using the formula:
`Balance(D) = StartingBalance + Sum(incomes up to D) - Sum(expenses up to D)`

**Implementation:**
1. Validate the user has a starting balance configured
2. Validate the target date is within allowed range:
   - Min: Starting balance effective date
   - Max: Current date (Europe/Warsaw) + 10 years
3. Call `project_balance(user_id, target_date)` database function:
   - Retrieves starting balance and effective date
   - Returns NULL if target date < effective date
   - Calls `expand_occurrences()` from effective date to target date
   - Sums income and expense separately
   - Computes: `starting_balance + total_income - total_expense`
   - Rounds to 2 decimal places

**API Endpoint:** `GET /api/projection?date=YYYY-MM-DD`

**Performance:**
- Indexed queries on `entry_series` by `user_id` and date ranges
- Bounded expansion (max 10 years forward)
- Target: P95 < 1 second for 1,000 active series

---

#### BL-5: CSV Export with Expanded Occurrences
**Requirement:** Export all transactions as expanded occurrences in CSV format.

**Implementation:**
1. Validate user has a starting balance (to determine default from_date)
2. Apply date range filters (default: starting balance date to current date + 10 years)
3. Call `expand_occurrences(user_id, from_date, to_date)` database function
4. Apply optional `entry_type` filter
5. Format results as CSV:
   - Generate deterministic `occurrence_id` using UUID v5 from (series_id, date)
   - Sign amounts: positive for income, negative for expense
   - Convert null descriptions to empty strings
   - Format dates as YYYY-MM-DD
6. Set appropriate headers: Content-Type, Content-Disposition
7. Stream CSV rows to response

**API Endpoint:** `GET /api/export/csv?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD`

**Performance Considerations:**
- Large date ranges may generate many rows; consider streaming response
- CSV generation should be efficient (avoid loading all rows into memory)

---

#### BL-6: Occurrence Expansion
**Requirement:** Expand recurring series into individual occurrences, applying exceptions.

**Implementation:**
The `expand_occurrences(user_id, from_date, to_date)` database function handles:

1. **One-time entries:**
   - Single occurrence on `start_date` if within date range

2. **Weekly recurring entries:**
   - Generate dates using `generate_series(start_date, end_date, '1 week')`
   - Filter by matching weekday
   - Respect series `start_date` and optional `end_date`

3. **Monthly recurring entries:**
   - Generate month series from `start_date` to `end_date`
   - For each month, call `compute_monthly_occurrence(day_of_month, year, month)`
   - Apply clamping for short months
   - Filter occurrences within series date range

4. **Apply exceptions:**
   - Left join with `series_exceptions` on series_id and date
   - Filter out skip exceptions
   - Replace attributes for override exceptions

5. **Generate deterministic occurrence_id:**
   - Use UUID v5 with namespace UUID and `series_id || '|' || date`

6. **Sort results:**
   - Order by `occurrence_date` ASC, `series_id` ASC

**Used by:**
- `GET /api/occurrences`
- `GET /api/entries/:id/occurrences`
- `GET /api/projection` (internally via `project_balance()`)
- `GET /api/export/csv`

---

### 5.3 Error Handling

#### Validation Errors (400 Bad Request)
```json
{
  "error": "Validation failed",
  "details": {
    "field_name": "Error message explaining what's wrong and how to fix it"
  }
}
```

#### Not Found (404 Not Found)
```json
{
  "error": "Not found",
  "message": "The requested resource does not exist or you do not have permission to access it"
}
```

#### Conflict (409 Conflict)
```json
{
  "error": "Conflict",
  "message": "The operation would create overlapping date ranges or violate a uniqueness constraint",
  "details": {
    "constraint": "no_overlapping_series_ranges"
  }
}
```

#### Server Error (500 Internal Server Error)
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later.",
  "request_id": "uuid"
}
```

---

## 6. Rate Limiting and Performance

### 6.1 Rate Limiting
**MVP:** No rate limiting implemented.

### 6.2 Performance Targets
- **Projection compute:** P95 < 1 second for 1,000 active series
- **CSV export:** Stream large exports to avoid memory issues
- **List endpoints:** Default pagination limits to prevent unbounded queries

### 6.3 Caching
**MVP:** No caching implemented.

---

## 7. Telemetry and Analytics

### 7.1 Analytics Events (Client-Side)
Analytics events are recorded directly by the client to the `analytics_events` table via Supabase, not through API endpoints.

**Event Types:**
- `entry_created` - Triggered when a new entry is created
- `entry_updated` - Triggered when an entry is updated (any scope)
- `entry_deleted` - Triggered when an entry is deleted (any scope)
- `projection_viewed` - Triggered when a user views a projection

**Event Metadata (JSONB):**
```json
{
  "entry_type": "income | expense",
  "recurrence_type": "one_time | weekly | monthly",
  "edit_scope": "occurrence | future | entire",
  "date_range_days": "integer",
  "has_end_date": "boolean"
}
```

**Implementation:**
- Client SDK directly inserts to `analytics_events` table
- RLS policy allows INSERT for authenticated users
- 28-day retention via scheduled cleanup job (external to API)

---

## 8. CORS and Security Headers

### 8.1 CORS Configuration
- Allow credentials: `true`
- Allowed origins: Production domain and localhost for development
- Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`
- Allowed headers: `Content-Type, Authorization`

### 8.2 Security Headers
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`: Define appropriate CSP for the application

---

## 9. Versioning

**MVP:** No API versioning.

---

## 10. API Design Principles

1. **RESTful conventions:** Use standard HTTP methods and status codes
2. **Consistent naming:** Use snake_case for JSON fields (matching database schema)
3. **Validation first:** Validate all inputs before processing
4. **Security by default:** Leverage RLS for automatic data isolation
5. **Performance aware:** Paginate lists, bound date ranges, optimize queries
6. **Error transparency:** Return clear, actionable error messages
7. **Idempotency:** GET, PUT, DELETE operations are idempotent
8. **GDPR compliance:** Support data export (CSV) and account deletion

---

## 11. OpenAPI Specification

A full OpenAPI 3.0 specification should be generated from this plan for:
- Interactive API documentation (Swagger UI)
- Client SDK generation
- API testing and validation
- Contract-first development

The specification should be maintained alongside this document and updated with any API changes.

