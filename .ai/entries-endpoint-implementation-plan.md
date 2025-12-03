# API Endpoint Implementation Plan: Entries Management

## 1. Endpoint Overview

This plan covers the implementation of the `entries` resource, which represents income and expense series. This includes support for one-time entries and recurring series (weekly/monthly). Crucially, it handles complex modification logic for recurring events, allowing changes to specific occurrences (exceptions), future occurrences (series splits), or the entire series.

**Endpoints:**
1.  `GET /api/entries` - List entries with filtering and pagination.
2.  `GET /api/entries/:id` - Get details of a specific entry series, including its exceptions.
3.  `POST /api/entries` - Create a new entry series.
4.  `PUT /api/entries/:id` - Update an entry (supports `scope` for recurrence handling).
5.  `DELETE /api/entries/:id` - Delete an entry (supports `scope` for recurrence handling).

## 2. Request Details

### 2.1 GET /api/entries (List)
-   **Method**: `GET`
-   **Query Parameters**:
    -   `entry_type` (optional): `income` | `expense`
    -   `recurrence_type` (optional): `one_time` | `weekly` | `monthly`
    -   `start_date_from` (optional): Date (YYYY-MM-DD)
    -   `start_date_to` (optional): Date (YYYY-MM-DD)
    -   `limit` (optional): integer (default 50)
    -   `offset` (optional): integer (default 0)
    -   `sort_by` (optional): `start_date` | `created_at` | `amount`
    -   `sort_order` (optional): `asc` | `desc`

### 2.2 GET /api/entries/:id (Detail)
-   **Method**: `GET`
-   **Path Parameters**: `id` (UUID)

### 2.3 POST /api/entries (Create)
-   **Method**: `POST`
-   **Body** (`CreateEntryCommand`):
    -   `entry_type`: `income` | `expense`
    -   `recurrence_type`: `one_time` | `weekly` | `monthly`
    -   `title`: string
    -   `description`: string | null
    -   `amount`: number
    -   `start_date`: string (YYYY-MM-DD)
    -   `end_date`: string | null
    -   `weekday`: number | null (0-6 for weekly)
    -   `day_of_month`: number | null (1-31 for monthly)

### 2.4 PUT /api/entries/:id (Update)
-   **Method**: `PUT`
-   **Path Parameters**: `id` (UUID)
-   **Query Parameters**:
    -   `scope` (required): `occurrence` | `future` | `entire`
    -   `date` (conditional): Required if scope is `occurrence` or `future`
-   **Body** (`UpdateEntryCommand`): Same as POST.

### 2.5 DELETE /api/entries/:id (Delete)
-   **Method**: `DELETE`
-   **Path Parameters**: `id` (UUID)
-   **Query Parameters**:
    -   `scope` (required): `occurrence` | `future` | `entire`
    -   `date` (conditional): Required if scope is `occurrence` or `future`

## 3. Used Types

Reference `src/types.ts` for full definitions.

-   **DTOs**: `EntrySeriesDTO`, `EntrySeriesDetailDTO`, `EntryListResponseDTO`, `SeriesExceptionDTO`
-   **Commands**: `CreateEntryCommand`, `UpdateEntryCommand`
-   **Responses**: `OccurrenceEditResponseDTO`, `FutureEditResponseDTO`, `EntireEditResponseDTO`, `DeleteEntryResponseDTO`
-   **Query Params**: `GetEntriesQueryParams`, `UpdateEntryQueryParams`, `DeleteEntryQueryParams`

## 4. Data Flow

1.  **Client Request**: Astro API Route receives the request.
2.  **Middleware**: `src/middleware/index.ts` authenticates the user and sets `locals.user`.
3.  **Handler**:
    -   Extracts and validates inputs using Zod schemas.
    -   Calls `EntriesService`.
4.  **Service Layer (`src/lib/services/entries.service.ts`)**:
    -   **List**: Constructs Supabase query with filters and pagination.
    -   **Get**: Fetches series and joins `series_exceptions`.
    -   **Create**: Inserts into `entry_series`.
    -   **Update**:
        -   `scope=occurrence`: Inserts into `series_exceptions` (`exception_type: 'override'`).
        -   `scope=future`: Transaction. Updates old series `end_date`. Inserts new series with `parent_series_id`.
        -   `scope=entire`: Updates `entry_series`.
    -   **Delete**:
        -   `scope=occurrence`: Inserts into `series_exceptions` (`exception_type: 'skip'`).
        -   `scope=future`: Updates `entry_series` `end_date`.
        -   `scope=entire`: Deletes from `entry_series` (cascade handles exceptions).
5.  **Database**: Executes queries against `entry_series` and `series_exceptions`.
6.  **Response**: Service returns DTOs; Handler formats JSON response.

## 5. Security Considerations

-   **Authentication**: All endpoints require a valid Supabase session.
-   **Authorization**: All database queries must filter by `user_id` to prevent cross-tenant data access.
-   **Validation**: strict Zod validation for all inputs, especially complex logic around `recurrence_type` vs `weekday`/`day_of_month`.
-   **Transactions**: Use Supabase RPC or client-side chained operations (carefully ordered) for atomic updates where possible, or ensure logic handles partial failures gracefully (though Supabase REST doesn't support multi-table transactions natively without RPCs, we will use sequential operations with careful error checking for this implementation phase).

## 6. Error Handling

| Scenario | Status Code | Action |
| :--- | :--- | :--- |
| Invalid Input / Validation Fail | 400 Bad Request | Return `ValidationErrorDTO` with field details. |
| Missing Scope/Date for Update | 400 Bad Request | Explicit message about missing required params. |
| Unauthorized (No Session) | 401 Unauthorized | Handled by middleware/guard. |
| Entry Not Found | 404 Not Found | Return `NotFoundErrorDTO`. |
| Overlapping Date Range (Future Split) | 409 Conflict | Return `ConflictErrorDTO` with explanation. |
| Database Error | 500 Internal Server Error | Log error internally, return generic message. |

## 7. Performance Considerations

-   **Indexing**: Ensure `user_id`, `start_date`, and `parent_series_id` are indexed (handled in DB schema).
-   **Pagination**: Mandatory limit/offset to prevent fetching large datasets.
-   **Filtering**: Apply filters at the database level, not in application memory.
-   **Join Efficiency**: When fetching Detail, only join exceptions for that specific series.

## 8. Implementation Steps

### Step 1: Create Validation Schemas
**File:** `src/lib/validation/entries.validation.ts`
-   Define Zod schemas for `CreateEntryCommand` and `UpdateEntryCommand`.
-   Implement custom refinement to validate `recurrence_type` dependencies (e.g., if `weekly`, `weekday` is required).
-   Define schemas for Query Params (`GetEntriesQueryParams`, etc.).

### Step 2: Create Entries Service
**File:** `src/lib/services/entries.service.ts`
-   Initialize `EntriesService` class/module using `SupabaseClient`.
-   **Method `findAll`**:
    -   Accept query params.
    -   Build query: `select('*', { count: 'exact' })`.
    -   Apply filters (`eq`, `gte`, `lte`) and sorting.
    -   Apply pagination (`range`).
-   **Method `findById`**:
    -   Fetch `entry_series` by ID and User ID.
    -   Fetch related `series_exceptions` in parallel or via join logic.
-   **Method `create`**:
    -   Insert into `entry_series`.
-   **Method `update`**:
    -   Switch on `scope`.
    -   Implement logic for `occurrence` (insert exception).
    -   Implement logic for `future` (update old + insert new).
    -   Implement logic for `entire` (update series).
-   **Method `delete`**:
    -   Switch on `scope`.
    -   Implement logic for `occurrence` (insert skip exception).
    -   Implement logic for `future` (update end_date).
    -   Implement logic for `entire` (delete series).

### Step 3: Implement List and Create Handlers
**File:** `src/pages/api/entries/index.ts`
-   **GET**:
    -   Parse query params using Zod.
    -   Call `EntriesService.findAll`.
    -   Return `EntryListResponseDTO`.
-   **POST**:
    -   Parse body using Zod.
    -   Call `EntriesService.create`.
    -   Return created entry DTO (201 Created).

### Step 4: Implement Detail, Update, Delete Handlers
**File:** `src/pages/api/entries/[id].ts`
-   Extract `id` from params.
-   **GET**:
    -   Call `EntriesService.findById`.
    -   Return `EntrySeriesDetailDTO` or 404.
-   **PUT**:
    -   Parse query params (`scope`, `date`) and body.
    -   Call `EntriesService.update`.
    -   Return appropriate response DTO based on scope.
-   **DELETE**:
    -   Parse query params (`scope`, `date`).
    -   Call `EntriesService.delete`.
    -   Return success message.

### Step 5: Register Routes
-   Ensure Astro picks up the file-based routes in `src/pages/api`.

