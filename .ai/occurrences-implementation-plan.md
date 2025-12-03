# API Endpoints Implementation Plan: Occurrences

## 1. Endpoint Overview

This plan covers the implementation of two related endpoints for retrieving expanded occurrences from entry series:

### GET /api/occurrences
Retrieves all expanded occurrences across all entry series for the authenticated user within a specified date range. This endpoint applies all skip and override exceptions and returns a paginated list of individual occurrences.

### GET /api/entries/:id/occurrences
Retrieves expanded occurrences for a specific entry series within a date range. Unlike the general endpoint, this returns occurrence metadata including whether each occurrence is an exception and its type (skip/override).

**Key Features:**
- Utilizes the `expand_occurrences()` database function for efficient occurrence generation
- Applies all series exceptions (skip and override)
- Supports filtering by entry type (income/expense)
- Implements pagination with configurable limits
- Validates date ranges (max 10 years)
- Returns deterministic UUID v5 occurrence IDs

## 2. Request Details

### GET /api/occurrences

**HTTP Method:** GET

**URL Structure:** `/api/occurrences`

**Parameters:**

**Required Query Parameters:**
- `from_date` (string): Start date in YYYY-MM-DD format
- `to_date` (string): End date in YYYY-MM-DD format

**Optional Query Parameters:**
- `entry_type` (string): Filter by entry type - either "income" or "expense"
- `limit` (integer): Number of results per page (default: 100, max: 1000, min: 1)
- `offset` (integer): Number of results to skip for pagination (default: 0, min: 0)

**Request Body:** None

**Authentication:** Required via Supabase session (middleware validates)

---

### GET /api/entries/:id/occurrences

**HTTP Method:** GET

**URL Structure:** `/api/entries/:id/occurrences`

**Parameters:**

**Required URL Parameters:**
- `id` (string): UUID of the entry series

**Required Query Parameters:**
- `from_date` (string): Start date in YYYY-MM-DD format
- `to_date` (string): End date in YYYY-MM-DD format

**Request Body:** None

**Authentication:** Required via Supabase session (middleware validates)

## 3. Used Types

### DTO Types (from src/types.ts)

**For GET /api/occurrences:**
```typescript
interface OccurrenceDTO {
  occurrence_id: string; // UUID v5 generated from (series_id, date)
  series_id: string;
  entry_type: EntryType;
  title: string;
  description: string; // Empty string if null
  occurrence_date: string; // YYYY-MM-DD
  amount: number; // decimal(12,2)
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

interface OccurrenceListResponseDTO {
  data: OccurrenceDTO[];
  pagination: PaginationDTO;
}

interface GetOccurrencesQueryParams {
  from_date: string; // YYYY-MM-DD, required
  to_date: string; // YYYY-MM-DD, required
  entry_type?: EntryType;
  limit?: number; // default: 100, max: 1000
  offset?: number; // default: 0
}
```

**For GET /api/entries/:id/occurrences:**
```typescript
interface EntryOccurrenceDTO {
  occurrence_id: string;
  entry_type: EntryType;
  title: string;
  description: string;
  occurrence_date: string;
  amount: number;
  is_exception: boolean;
  exception_type: ExceptionType | null;
}

interface EntryOccurrencesResponseDTO {
  series_id: string;
  data: EntryOccurrenceDTO[];
}

interface GetEntryOccurrencesQueryParams {
  from_date: string; // YYYY-MM-DD, required
  to_date: string; // YYYY-MM-DD, required
}
```

**Shared Types:**
```typescript
type EntryType = "income" | "expense";
type ExceptionType = "skip" | "override";

interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
}
```

**Error Response Types:**
```typescript
interface ValidationErrorDTO {
  error: "Validation failed";
  details: Record<string, string>;
}

interface UnauthorizedErrorDTO {
  error: "Unauthorized";
  message: "Invalid or missing authentication token";
}

interface NotFoundErrorDTO {
  error: "Not found";
  message: string;
}

interface InternalServerErrorDTO {
  error: "Internal server error";
  message: "An unexpected error occurred. Please try again later.";
  request_id: string;
}
```

## 4. Response Details

### GET /api/occurrences

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "occurrence_id": "550e8400-e29b-41d4-a716-446655440000",
      "series_id": "123e4567-e89b-12d3-a456-426614174000",
      "entry_type": "income",
      "title": "Monthly Salary",
      "description": "Regular monthly income",
      "occurrence_date": "2024-01-15",
      "amount": 5000.00,
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0
  }
}
```

**Error Responses:**

**400 Bad Request - Validation Failed:**
```json
{
  "error": "Validation failed",
  "details": {
    "from_date": "from_date must be YYYY-MM-DD format",
    "to_date": "to_date must be greater than or equal to from_date"
  }
}
```

**400 Bad Request - Date Range Too Large:**
```json
{
  "error": "Validation failed",
  "details": {
    "date_range": "Date range cannot exceed 10 years (3650 days)"
  }
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later.",
  "request_id": "req_abc123"
}
```

---

### GET /api/entries/:id/occurrences

**Success Response (200 OK):**
```json
{
  "series_id": "123e4567-e89b-12d3-a456-426614174000",
  "data": [
    {
      "occurrence_id": "550e8400-e29b-41d4-a716-446655440000",
      "entry_type": "income",
      "title": "Monthly Salary",
      "description": "Regular monthly income",
      "occurrence_date": "2024-01-15",
      "amount": 5000.00,
      "is_exception": false,
      "exception_type": null
    },
    {
      "occurrence_id": "550e8400-e29b-41d4-a716-446655440001",
      "entry_type": "income",
      "title": "Monthly Salary - Bonus",
      "description": "With performance bonus",
      "occurrence_date": "2024-02-15",
      "amount": 6000.00,
      "is_exception": true,
      "exception_type": "override"
    }
  ]
}
```

**Error Responses:**

**400 Bad Request - Validation Failed:**
```json
{
  "error": "Validation failed",
  "details": {
    "from_date": "from_date is required and must be YYYY-MM-DD format"
  }
}
```

**400 Bad Request - Invalid UUID:**
```json
{
  "error": "Validation failed",
  "details": {
    "id": "id must be a valid UUID"
  }
}
```

**404 Not Found:**
```json
{
  "error": "Not found",
  "message": "Entry series with id 123e4567-e89b-12d3-a456-426614174000 not found"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later.",
  "request_id": "req_abc123"
}
```

## 5. Data Flow

### GET /api/occurrences Flow

1. **Request Reception**: Astro API endpoint receives GET request
2. **Authentication Check**: Middleware validates user session (context.locals.supabase)
3. **Query Parameter Extraction**: Extract from_date, to_date, entry_type, limit, offset from URL
4. **Input Validation**: 
   - Validate using Zod schema (getOccurrencesQuerySchema)
   - Check date format (YYYY-MM-DD)
   - Validate from_date <= to_date
   - Validate date range <= 10 years (3650 days)
   - Validate limit (1-1000), offset (>= 0)
   - Validate entry_type if provided
5. **Service Layer Call**: 
   - Call `occurrencesService.findAll(userId, queryParams)`
6. **Database Function Execution**:
   - Service calls Supabase RPC: `expand_occurrences(user_id, from_date, to_date)`
   - Database function generates occurrences for all series
   - Applies skip exceptions (filters them out)
   - Applies override exceptions (replaces fields)
   - Generates deterministic UUID v5 occurrence IDs
7. **Result Filtering**: 
   - Apply entry_type filter if provided (in application layer)
   - Apply pagination (offset and limit)
8. **Count Total**: Get total count of occurrences (before pagination) for pagination metadata
9. **Response Construction**: Build OccurrenceListResponseDTO with data and pagination
10. **Return Response**: Return 200 OK with JSON response

**Database Function (`expand_occurrences`):**
- Uses recursive CTE to generate occurrences:
  - One-time entries: single occurrence on start_date
  - Weekly recurring: generate_series with 1 week interval, filter by weekday
  - Monthly recurring: generate monthly dates using compute_monthly_occurrence (handles month-end clamping)
- Left joins with series_exceptions
- Filters out skip exceptions
- Applies override exception fields (title, description, amount, created_at, updated_at)
- Generates occurrence_id using UUID v5: `uuid_generate_v5(namespace, series_id || '|' || occurrence_date)`
- Orders by occurrence_date, series_id
- Returns table with columns: occurrence_id, series_id, entry_type, title, description, occurrence_date, amount, created_at, updated_at

---

### GET /api/entries/:id/occurrences Flow

1. **Request Reception**: Astro API endpoint receives GET request
2. **Authentication Check**: Middleware validates user session
3. **Parameter Extraction**: 
   - Extract `id` from URL path parameters
   - Extract from_date, to_date from query parameters
4. **Input Validation**:
   - Validate using Zod schema (getEntryOccurrencesQuerySchema)
   - Validate UUID format for `id`
   - Check date format (YYYY-MM-DD)
   - Validate from_date <= to_date
5. **Entry Existence Check**:
   - Call `entriesService.findById(userId, id)` or custom check
   - Verify entry exists and belongs to authenticated user
   - Return 404 if not found
6. **Service Layer Call**:
   - Call `occurrencesService.findBySeriesId(userId, seriesId, queryParams)`
7. **Database Query Execution**:
   - Call expand_occurrences RPC with user_id, from_date, to_date
   - Filter results by series_id in application layer
   - Query series_exceptions table for the series to get exception metadata
8. **Exception Metadata Enrichment**:
   - For each occurrence, determine if it's an exception
   - Add is_exception boolean flag
   - Add exception_type (skip or override or null)
   - Note: Skip exceptions won't appear in results (filtered by expand_occurrences), so is_exception with override type
9. **Response Construction**: Build EntryOccurrencesResponseDTO with series_id and data array
10. **Return Response**: Return 200 OK with JSON response

**Alternative Approach for Exception Metadata:**
Since expand_occurrences already filters skip exceptions, we need to:
- Query series_exceptions for the series in the date range
- Build a map of exception_date -> exception_type
- For each occurrence from expand_occurrences, check if occurrence_date exists in exceptions map
- If yes: is_exception = true, exception_type = "override" (since skips don't appear)
- If no: is_exception = false, exception_type = null

## 6. Security Considerations

### Authentication
- **Middleware Enforcement**: Authentication is enforced by Astro middleware before reaching the endpoint
- **Session Validation**: User session must exist in context.locals.supabase
- **User ID Extraction**: User ID is extracted from authenticated session

### Authorization
- **RLS Policies**: The `expand_occurrences()` database function uses `SECURITY INVOKER`, ensuring Row Level Security (RLS) policies are respected
- **User Isolation**: All queries filter by user_id automatically through RLS
- **Entry Ownership**: For GET /api/entries/:id/occurrences, verify the entry belongs to the authenticated user before expanding occurrences

### Input Validation
- **Zod Schema Validation**: All inputs validated using strict Zod schemas
- **Date Format**: Enforce YYYY-MM-DD format using regex validation
- **Date Range Limits**: Prevent DoS by limiting date range to 10 years maximum
- **Pagination Limits**: Cap limit at 1000 to prevent large result sets
- **Type Safety**: Use TypeScript enums for entry_type validation
- **UUID Validation**: Validate UUID format for entry series ID

### Data Protection
- **No Sensitive Data Exposure**: Occurrences only return data that belongs to the authenticated user
- **Empty String for Null Descriptions**: Convert null descriptions to empty strings (per API spec)
- **Decimal Precision**: Maintain 2-decimal precision for amounts

### Rate Limiting Considerations
- **Large Date Ranges**: 10-year limit prevents excessive computation
- **Pagination**: Required for GET /api/occurrences to prevent unbounded queries
- **Database Function Efficiency**: expand_occurrences uses optimized SQL with proper indexing

### SQL Injection Prevention
- **Parameterized Queries**: All database calls use Supabase client with parameterized queries
- **No String Concatenation**: Never concatenate user input into SQL strings
- **RPC Function Calls**: Use Supabase .rpc() method for calling database functions

### IDOR (Insecure Direct Object Reference) Prevention
- **User Context**: Always pass user_id to database functions
- **Ownership Verification**: For entry-specific endpoint, verify entry ownership before returning occurrences
- **No Direct Database IDs**: Use UUIDs instead of sequential integers

## 7. Error Handling

### Validation Errors (400 Bad Request)

**Scenario 1: Missing Required Parameters**
- **Trigger**: from_date or to_date not provided
- **Response**: ValidationErrorDTO with field-specific error messages
- **Status Code**: 400

**Scenario 2: Invalid Date Format**
- **Trigger**: Date not in YYYY-MM-DD format or invalid date
- **Response**: ValidationErrorDTO with date format error
- **Status Code**: 400
- **Example**: "from_date must be YYYY-MM-DD format"

**Scenario 3: Invalid Date Range**
- **Trigger**: from_date > to_date
- **Response**: ValidationErrorDTO with range error
- **Status Code**: 400
- **Example**: "to_date must be greater than or equal to from_date"

**Scenario 4: Date Range Too Large**
- **Trigger**: Date range exceeds 10 years (3650 days)
- **Response**: ValidationErrorDTO with range limit error
- **Status Code**: 400
- **Example**: "Date range cannot exceed 10 years (3650 days)"

**Scenario 5: Invalid entry_type**
- **Trigger**: entry_type not "income" or "expense"
- **Response**: ValidationErrorDTO with enum error
- **Status Code**: 400
- **Example**: "entry_type must be either 'income' or 'expense'"

**Scenario 6: Invalid Pagination Parameters**
- **Trigger**: limit > 1000 or limit < 1, or offset < 0
- **Response**: ValidationErrorDTO with pagination error
- **Status Code**: 400
- **Example**: "limit must be between 1 and 1000"

**Scenario 7: Invalid UUID Format (Entry-Specific Endpoint)**
- **Trigger**: id parameter is not a valid UUID
- **Response**: ValidationErrorDTO with UUID error
- **Status Code**: 400
- **Example**: "id must be a valid UUID"

### Authentication Errors (401 Unauthorized)

**Scenario 8: Missing Authentication**
- **Trigger**: No session in context.locals
- **Response**: UnauthorizedErrorDTO
- **Status Code**: 401
- **Handled By**: Middleware (should not reach endpoint)

**Scenario 9: Invalid Token**
- **Trigger**: Session token expired or invalid
- **Response**: UnauthorizedErrorDTO
- **Status Code**: 401
- **Handled By**: Middleware

### Not Found Errors (404 Not Found)

**Scenario 10: Entry Series Not Found**
- **Trigger**: GET /api/entries/:id/occurrences with non-existent or unauthorized series ID
- **Response**: NotFoundErrorDTO
- **Status Code**: 404
- **Example**: "Entry series with id {id} not found"

### Database Errors (500 Internal Server Error)

**Scenario 11: Database Connection Error**
- **Trigger**: Supabase connection fails
- **Response**: InternalServerErrorDTO with request_id
- **Status Code**: 500
- **Logging**: Log full error with stack trace

**Scenario 12: RPC Function Error**
- **Trigger**: expand_occurrences throws an error
- **Response**: InternalServerErrorDTO
- **Status Code**: 500
- **Logging**: Log RPC error details

**Scenario 13: Unexpected Server Error**
- **Trigger**: Any unhandled exception
- **Response**: InternalServerErrorDTO
- **Status Code**: 500
- **Logging**: Log full error with stack trace and context

### Error Response Format

All errors follow consistent format using error response utilities:
- Use `createErrorResponse()` from `src/lib/utils/error-response.utils.ts`
- Include appropriate HTTP status code
- Provide clear, actionable error messages
- Never expose internal implementation details or stack traces to clients
- Include request_id for 500 errors to aid debugging

### Error Logging Strategy

- **Validation Errors**: Log at INFO level (expected client errors)
- **Not Found Errors**: Log at INFO level with user_id and requested resource
- **Authentication Errors**: Log at WARN level (potential security concern)
- **Database Errors**: Log at ERROR level with full stack trace
- **Unexpected Errors**: Log at ERROR level with request context

## 8. Performance Considerations

### Database Function Optimization

**expand_occurrences Efficiency:**
- Uses efficient PostgreSQL generate_series for date generation
- Indexed columns: user_id, series_id, exception_date
- Marked STABLE (cacheable within transaction)
- Returns results pre-sorted by occurrence_date

**Index Requirements:**
- `entry_series(user_id, start_date, end_date)`
- `series_exceptions(series_id, exception_date)`
- Composite index on `entry_series(user_id, entry_type)` for filtered queries

### Pagination Strategy

**For GET /api/occurrences:**
- Default limit: 100 occurrences
- Maximum limit: 1000 occurrences
- Client must paginate for larger datasets
- Count query may be expensive for large date ranges - consider estimation for total > 10,000

**For GET /api/entries/:id/occurrences:**
- No pagination (single series likely has manageable occurrence count)
- If performance issues arise, add pagination later

### Caching Opportunities

**Not Recommended for MVP:**
- Occurrences are dynamic (depend on current exceptions)
- Date ranges are highly variable
- Real-time accuracy is important

**Potential Future Optimizations:**
- Cache expand_occurrences results for common date ranges
- Cache entry series metadata
- Use HTTP ETag headers based on series updated_at timestamps

### Query Result Size Management

**Date Range Limit:**
- 10-year maximum prevents excessive computation
- Weekly recurring over 10 years = ~520 occurrences
- Monthly recurring over 10 years = ~120 occurrences
- Multiple series can multiply these numbers

**Entry Type Filtering:**
- Apply in application layer after RPC call (simpler implementation)
- Future optimization: modify expand_occurrences to accept entry_type parameter

### Monitoring Metrics

**Track:**
- Average response time by date range size
- P95/P99 response times
- Number of occurrences returned per request
- Database function execution time
- Pagination usage patterns

**Alert On:**
- Response time > 2 seconds
- Date range > 5 years (suggesting client misuse)
- Repeated queries with offset > 10,000 (inefficient pagination)

## 9. Implementation Steps

### Step 1: Create Validation Schemas

**File:** `src/lib/validation/occurrences.validation.ts`

**Tasks:**
1. Create `getOccurrencesQuerySchema` using Zod:
   - from_date: required, string, regex `/^\d{4}-\d{2}-\d{2}$/`, transform to Date then back to YYYY-MM-DD
   - to_date: required, string, regex `/^\d{4}-\d{2}-\d{2}$/`, transform to Date then back to YYYY-MM-DD
   - entry_type: optional, enum ["income", "expense"]
   - limit: optional, coerce to number, integer, min 1, max 1000, default 100
   - offset: optional, coerce to number, integer, min 0, default 0
   - Refinement: to_date >= from_date
   - Refinement: date range <= 3650 days (10 years)

2. Create `getEntryOccurrencesQuerySchema` using Zod:
   - from_date: required, string, regex `/^\d{4}-\d{2}-\d{2}$/`
   - to_date: required, string, regex `/^\d{4}-\d{2}-\d{2}$/`
   - Refinement: to_date >= from_date

3. Create UUID validation helper:
   - Use Zod `.uuid()` validator for entry series ID

4. Export schemas with proper typing:
   ```typescript
   export const getOccurrencesQuerySchema = z.object({...}) satisfies z.ZodSchema<GetOccurrencesQueryParams>;
   ```

**Testing Considerations:**
- Test valid date formats
- Test invalid date formats
- Test date range validation
- Test 10-year limit boundary
- Test pagination bounds
- Test entry_type enum validation

---

### Step 2: Create Occurrences Service

**File:** `src/lib/services/occurrences.service.ts`

**Tasks:**
1. Create `OccurrencesService` class with constructor accepting SupabaseClient<Database>

2. Implement `findAll` method:
   ```typescript
   async findAll(
     userId: string,
     params: GetOccurrencesQueryParams
   ): Promise<OccurrenceListResponseDTO>
   ```
   - Call Supabase RPC: `this.supabase.rpc('expand_occurrences', { p_user_id: userId, p_from_date: params.from_date, p_to_date: params.to_date })`
   - Handle RPC errors (throw with context)
   - Filter results by entry_type if provided: `data.filter(occ => occ.entry_type === params.entry_type)`
   - Get total count before pagination
   - Apply pagination: `data.slice(offset, offset + limit)`
   - Build and return OccurrenceListResponseDTO with data and pagination metadata

3. Implement `findBySeriesId` method:
   ```typescript
   async findBySeriesId(
     userId: string,
     seriesId: string,
     params: GetEntryOccurrencesQueryParams
   ): Promise<EntryOccurrencesResponseDTO>
   ```
   - Call expand_occurrences RPC (same as findAll)
   - Filter results by series_id: `data.filter(occ => occ.series_id === seriesId)`
   - Query series_exceptions for this series in date range:
     ```typescript
     const { data: exceptions } = await this.supabase
       .from('series_exceptions')
       .select('exception_date, exception_type')
       .eq('series_id', seriesId)
       .gte('exception_date', params.from_date)
       .lte('exception_date', params.to_date);
     ```
   - Build exception map: `Map<string, ExceptionType>`
   - Enrich each occurrence with is_exception and exception_type:
     ```typescript
     const enriched = occurrences.map(occ => ({
       ...occ,
       is_exception: exceptionMap.has(occ.occurrence_date),
       exception_type: exceptionMap.get(occ.occurrence_date) || null
     }));
     ```
   - Note: Skip exceptions won't appear (filtered by expand_occurrences), so is_exception=true implies override
   - Return EntryOccurrencesResponseDTO

4. Handle errors consistently:
   - Catch Supabase errors
   - Log errors with context
   - Re-throw or wrap with meaningful messages

**Dependencies:**
- Import SupabaseClient from `src/db/supabase.client.ts`
- Import types from `src/types.ts`
- Import Database type from `src/db/database.types.ts`

---

### Step 3: Create API Endpoint for GET /api/occurrences

**File:** `src/pages/api/occurrences/index.ts`

**Tasks:**
1. Set up Astro API endpoint structure:
   ```typescript
   export const prerender = false;
   
   export async function GET(context: APIContext): Promise<Response> {
     // Implementation
   }
   ```

2. Extract authentication:
   ```typescript
   const supabase = context.locals.supabase;
   const session = context.locals.session;
   
   if (!session?.user) {
     return createErrorResponse('Unauthorized', 'Invalid or missing authentication token', 401);
   }
   
   const userId = session.user.id;
   ```

3. Extract and parse query parameters:
   ```typescript
   const url = new URL(context.request.url);
   const queryParams = {
     from_date: url.searchParams.get('from_date'),
     to_date: url.searchParams.get('to_date'),
     entry_type: url.searchParams.get('entry_type'),
     limit: url.searchParams.get('limit'),
     offset: url.searchParams.get('offset'),
   };
   ```

4. Validate query parameters:
   ```typescript
   const validation = getOccurrencesQuerySchema.safeParse(queryParams);
   
   if (!validation.success) {
     const details = validation.error.flatten().fieldErrors;
     return new Response(JSON.stringify({
       error: 'Validation failed',
       details
     }), { status: 400 });
   }
   
   const validatedParams = validation.data;
   ```

5. Call service layer:
   ```typescript
   const occurrencesService = new OccurrencesService(supabase);
   
   try {
     const result = await occurrencesService.findAll(userId, validatedParams);
     
     return new Response(JSON.stringify(result), {
       status: 200,
       headers: { 'Content-Type': 'application/json' }
     });
   } catch (error) {
     console.error('[GET /api/occurrences] Error:', error);
     return createErrorResponse(
       'Internal server error',
       'An unexpected error occurred. Please try again later.',
       500
     );
   }
   ```

6. Add proper error handling for all scenarios

**Testing:**
- Test with valid parameters
- Test with missing required parameters
- Test with invalid date formats
- Test with date range > 10 years
- Test with entry_type filter
- Test pagination (limit and offset)

---

### Step 4: Create API Endpoint for GET /api/entries/:id/occurrences

**File:** `src/pages/api/entries/[id]/occurrences.ts`

**Tasks:**
1. Set up Astro API endpoint with dynamic route:
   ```typescript
   export const prerender = false;
   
   export async function GET(context: APIContext): Promise<Response> {
     // Implementation
   }
   ```

2. Extract authentication (same as Step 3)

3. Extract URL parameter and query parameters:
   ```typescript
   const { id } = context.params;
   
   if (!id) {
     return createErrorResponse('Validation failed', 'Entry series ID is required', 400);
   }
   
   // Validate UUID format
   const uuidSchema = z.string().uuid();
   const uuidValidation = uuidSchema.safeParse(id);
   
   if (!uuidValidation.success) {
     return new Response(JSON.stringify({
       error: 'Validation failed',
       details: { id: 'id must be a valid UUID' }
     }), { status: 400 });
   }
   
   const url = new URL(context.request.url);
   const queryParams = {
     from_date: url.searchParams.get('from_date'),
     to_date: url.searchParams.get('to_date'),
   };
   ```

4. Validate query parameters using schema

5. Verify entry exists and belongs to user:
   ```typescript
   const entriesService = new EntriesService(supabase);
   const entry = await entriesService.findById(userId, id);
   
   if (!entry) {
     return new Response(JSON.stringify({
       error: 'Not found',
       message: `Entry series with id ${id} not found`
     }), { status: 404 });
   }
   ```

6. Call service layer:
   ```typescript
   const occurrencesService = new OccurrencesService(supabase);
   
   try {
     const result = await occurrencesService.findBySeriesId(userId, id, validatedParams);
     
     return new Response(JSON.stringify(result), {
       status: 200,
       headers: { 'Content-Type': 'application/json' }
     });
   } catch (error) {
     console.error(`[GET /api/entries/${id}/occurrences] Error:`, error);
     return createErrorResponse(
       'Internal server error',
       'An unexpected error occurred. Please try again later.',
       500
     );
   }
   ```

7. Add comprehensive error handling

**File Structure:**
- Create directory: `src/pages/api/entries/[id]/`
- Create file: `occurrences.ts` in that directory

**Testing:**
- Test with valid entry ID and parameters
- Test with non-existent entry ID (should return 404)
- Test with another user's entry ID (should return 404)
- Test with invalid UUID format
- Test with missing query parameters
- Test exception metadata accuracy

---

### Step 5: Test Database Function Integration

**Tasks:**
1. Verify `expand_occurrences` RPC is accessible via Supabase client
2. Test with various entry types (one_time, weekly, monthly)
3. Test exception handling:
   - Create skip exception, verify occurrence is absent
   - Create override exception, verify occurrence has overridden values
4. Test edge cases:
   - Month-end dates (31st in 30-day months)
   - Leap years (February 29th)
   - Weekly occurrences across year boundaries
5. Verify occurrence_id determinism (same series + date = same ID)
6. Test performance with large date ranges

**Tools:**
- Use Supabase Studio to run RPC manually
- Create test data in database
- Verify results match expected occurrences

---

### Step 6: Add Error Response Utilities (if not existing)

**File:** `src/lib/utils/error-response.utils.ts`

**Tasks:**
1. Check if `createErrorResponse` exists
2. If not, create utility function:
   ```typescript
   export function createErrorResponse(
     error: string,
     message: string,
     status: number,
     details?: Record<string, unknown>
   ): Response {
     return new Response(
       JSON.stringify({
         error,
         message,
         ...(details && { details }),
         ...(status === 500 && { request_id: generateRequestId() })
       }),
       {
         status,
         headers: { 'Content-Type': 'application/json' }
       }
     );
   }
   
   function generateRequestId(): string {
     return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
   }
   ```

3. Export validation error helper:
   ```typescript
   export function createValidationErrorResponse(
     details: Record<string, string>
   ): Response {
     return new Response(
       JSON.stringify({
         error: 'Validation failed',
         details
       }),
       {
         status: 400,
         headers: { 'Content-Type': 'application/json' }
       }
     );
   }
   ```

---

### Step 7: Add Integration Tests

**File:** `tests/api/occurrences.test.ts` (or similar test location)

**Tasks:**
1. Set up test environment with Supabase test client
2. Create test data:
   - Create test user
   - Create entry series (one_time, weekly, monthly)
   - Create exceptions (skip and override)

3. Test GET /api/occurrences:
   - Happy path with valid parameters
   - Filter by entry_type
   - Pagination (limit and offset)
   - Date range validation
   - 10-year limit enforcement
   - Authentication requirement

4. Test GET /api/entries/:id/occurrences:
   - Happy path with valid entry ID
   - Exception metadata accuracy
   - Entry not found (404)
   - Invalid UUID format (400)
   - Authentication requirement

5. Test error scenarios comprehensively

6. Clean up test data after tests

---

### Step 8: Update API Documentation

**File:** `.ai/api-plan.md` (if changes needed)

**Tasks:**
1. Verify API specification matches implementation
2. Add any implementation notes or clarifications
3. Document any edge cases discovered during implementation
4. Update examples if needed

---

### Step 9: Performance Testing and Optimization

**Tasks:**
1. Test with realistic data volumes:
   - 100+ entry series
   - 10-year date range
   - Multiple concurrent requests

2. Profile database queries:
   - Check expand_occurrences execution time
   - Verify indexes are used

3. Optimize if needed:
   - Add missing database indexes
   - Adjust pagination defaults
   - Consider query result caching

4. Monitor:
   - Response times
   - Database load
   - Memory usage

---

### Step 10: Security Review

**Tasks:**
1. Verify RLS policies are active on all tables
2. Test IDOR protection (access another user's entries)
3. Verify authentication is enforced
4. Test SQL injection resistance (should be automatic with Supabase client)
5. Review error messages for information leakage
6. Test date range DoS protection (10-year limit)
7. Test pagination limit enforcement (max 1000)

---

## Implementation Checklist

- [x] Step 1: Create validation schemas in `src/lib/validation/occurrences.validation.ts`
- [x] Step 2: Create `OccurrencesService` in `src/lib/services/occurrences.service.ts`
- [x] Step 3: Create API endpoint `src/pages/api/occurrences/index.ts`
- [x] Step 4: Create API endpoint `src/pages/api/entries/[id]/occurrences.ts`
- [x] Step 6: Verify error response utilities exist
- [x] Step 8: Update API documentation

## Post-Implementation Considerations

### Monitoring
- Set up logging for occurrence retrieval
- Track response times and error rates
- Monitor date range patterns

### Documentation ✓ COMPLETED
- [x] Add API usage examples to README
- [x] Document performance characteristics
- [x] Provide troubleshooting guide for common errors
- [x] Created comprehensive API documentation (`.ai/occurrences-api-documentation.md`)
- [x] Created quick reference guide (`.ai/occurrences-quick-reference.md`)
- [x] Updated README with API section

