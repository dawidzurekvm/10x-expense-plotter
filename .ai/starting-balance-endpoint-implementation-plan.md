# API Endpoint Implementation Plan: Starting Balance Endpoints

## 1. Endpoint Overview

The Starting Balance endpoints manage a single starting balance record per user, which represents the initial account balance from a specific effective date. These endpoints provide complete CRUD operations:

- **GET /api/starting-balance**: Retrieve the user's current starting balance
- **PUT /api/starting-balance**: Create or update (upsert) the user's starting balance
- **DELETE /api/starting-balance**: Remove the user's starting balance

Each user can have only one starting balance record, enforced by a UNIQUE constraint on `user_id` in the database. The starting balance serves as the foundation for all financial projections and calculations in the system.

---

## 2. Request Details

### GET /api/starting-balance

- **HTTP Method**: GET
- **URL Structure**: `/api/starting-balance`
- **Parameters**:
  - Required: None
  - Optional: None
- **Query Parameters**: None
- **Request Body**: None
- **Authentication**: Required (Bearer token via Supabase auth)

### PUT /api/starting-balance

- **HTTP Method**: PUT
- **URL Structure**: `/api/starting-balance`
- **Parameters**:
  - Required: None
  - Optional: None
- **Query Parameters**: None
- **Request Body**:
  ```json
  {
    "effective_date": "YYYY-MM-DD",
    "amount": 1234.56
  }
  ```
- **Request Body Validation**:
  - `effective_date`: Required, must be valid date string in YYYY-MM-DD format
  - `amount`: Required, must be number >= 0, max 2 decimal places
- **Authentication**: Required (Bearer token via Supabase auth)

### DELETE /api/starting-balance

- **HTTP Method**: DELETE
- **URL Structure**: `/api/starting-balance`
- **Parameters**:
  - Required: None
  - Optional: None
- **Query Parameters**: None
- **Request Body**: None
- **Authentication**: Required (Bearer token via Supabase auth)

---

## 3. Used Types

### Response DTOs

- **StartingBalanceDTO** (from `src/types.ts`)
  - Type alias of `StartingBalanceRow` from database types
  - Contains: `id`, `user_id`, `effective_date`, `amount`, `created_at`, `updated_at`
  - Used for: GET and PUT success responses

- **SuccessMessageDTO** (from `src/types.ts`)
  - Contains: `message` (string)
  - Used for: DELETE success response

### Command Models

- **UpsertStartingBalanceCommand** (from `src/types.ts`)
  - Contains: `effective_date` (string), `amount` (number)
  - Used for: PUT request body validation

### Error DTOs

- **ValidationErrorDTO**: For 400 Bad Request responses
- **UnauthorizedErrorDTO**: For 401 Unauthorized responses
- **NotFoundErrorDTO**: For 404 Not Found responses
- **InternalServerErrorDTO**: For 500 Internal Server Error responses

---

## 4. Response Details

### GET /api/starting-balance

**Success Response (200 OK)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440000",
  "effective_date": "2024-01-01",
  "amount": 5000.00,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

**Error Responses**:
- **404 Not Found**: No starting balance exists for the user
  ```json
  {
    "error": "Not found",
    "message": "Starting balance not found"
  }
  ```
- **401 Unauthorized**: Missing or invalid authentication token
  ```json
  {
    "error": "Unauthorized",
    "message": "Invalid or missing authentication token"
  }
  ```
- **500 Internal Server Error**: Database or server error
  ```json
  {
    "error": "Internal server error",
    "message": "An unexpected error occurred. Please try again later.",
    "request_id": "req_123456"
  }
  ```

### PUT /api/starting-balance

**Success Response (201 Created)** - When creating new record:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440000",
  "effective_date": "2024-01-01",
  "amount": 5000.00,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

**Success Response (200 OK)** - When updating existing record:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440000",
  "effective_date": "2024-02-01",
  "amount": 6000.00,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-02-01T15:30:00Z"
}
```

**Error Responses**:
- **400 Bad Request**: Validation failed
  ```json
  {
    "error": "Validation failed",
    "details": {
      "amount": "Amount must be non-negative",
      "effective_date": "Invalid date format"
    }
  }
  ```
- **401 Unauthorized**: Missing or invalid authentication token
- **500 Internal Server Error**: Database or server error

### DELETE /api/starting-balance

**Success Response (200 OK)**:
```json
{
  "message": "Starting balance deleted successfully"
}
```

**Error Responses**:
- **404 Not Found**: No starting balance exists to delete
  ```json
  {
    "error": "Not found",
    "message": "Starting balance not found"
  }
  ```
- **401 Unauthorized**: Missing or invalid authentication token
- **500 Internal Server Error**: Database or server error

---

## 5. Data Flow

### GET /api/starting-balance

1. **Request Reception**: Astro receives GET request at `/api/starting-balance`
2. **Authentication**: Middleware validates Supabase auth token from `context.locals.supabase`
3. **User Extraction**: Extract authenticated user ID from Supabase session
4. **Service Call**: Call `startingBalanceService.getStartingBalance(supabase, userId)`
5. **Database Query**: Service queries `starting_balances` table with `user_id` filter
6. **Response Handling**:
   - If record found: Return 200 with `StartingBalanceDTO`
   - If not found: Return 404 with error message
   - If error: Return 500 with error details

### PUT /api/starting-balance

1. **Request Reception**: Astro receives PUT request with JSON body
2. **Authentication**: Middleware validates Supabase auth token
3. **Input Parsing**: Parse request body as JSON
4. **Input Validation**: Validate using Zod schema against `UpsertStartingBalanceCommand`
   - Validate `amount` >= 0 and max 2 decimal places
   - Validate `effective_date` is valid YYYY-MM-DD format
5. **User Extraction**: Extract authenticated user ID
6. **Service Call**: Call `startingBalanceService.upsertStartingBalance(supabase, userId, command)`
7. **Database Operation**: 
   - Service performs upsert using Supabase `.upsert()` method
   - Database updates `updated_at` timestamp automatically
   - UNIQUE constraint on `user_id` ensures single record per user
8. **Response Handling**:
   - If new record created: Return 201 with `StartingBalanceDTO`
   - If existing record updated: Return 200 with `StartingBalanceDTO`
   - If validation fails: Return 400 with validation errors
   - If error: Return 500 with error details

### DELETE /api/starting-balance

1. **Request Reception**: Astro receives DELETE request
2. **Authentication**: Middleware validates Supabase auth token
3. **User Extraction**: Extract authenticated user ID
4. **Service Call**: Call `startingBalanceService.deleteStartingBalance(supabase, userId)`
5. **Database Operation**: Service deletes record from `starting_balances` where `user_id` matches
6. **Response Handling**:
   - If record deleted: Return 200 with success message
   - If no record found: Return 404 with error message
   - If error: Return 500 with error details

### Database Schema Reference

The `starting_balances` table structure:
- `id`: UUID, primary key, auto-generated
- `user_id`: UUID, NOT NULL, UNIQUE, references auth.users(id) with CASCADE delete
- `effective_date`: DATE, NOT NULL
- `amount`: NUMERIC(12,2), NOT NULL, CHECK >= 0
- `created_at`: TIMESTAMPTZ, NOT NULL, default now()
- `updated_at`: TIMESTAMPTZ, NOT NULL, default now()

---

## 6. Security Considerations

### Authentication

- **Token Validation**: All endpoints require valid Supabase authentication token
- **Token Source**: Token extracted from `context.locals.supabase` via Astro middleware
- **Session Verification**: Verify active session exists before processing request
- **No Anonymous Access**: Return 401 Unauthorized if no valid session

### Authorization

- **User Isolation**: Each user can only access their own starting balance
- **Implicit Authorization**: Authorization enforced by filtering queries with `user_id` from authenticated session
- **No Cross-User Access**: Database queries always filter by authenticated `user_id`
- **Database-Level Enforcement**: UNIQUE constraint on `user_id` prevents multiple balances per user

### Input Validation

- **Schema Validation**: Use Zod to validate all PUT request inputs before database operations
- **Amount Validation**: 
  - Enforce non-negative values (>= 0)
  - Enforce max 2 decimal places
  - Validate numeric type
- **Date Validation**:
  - Validate YYYY-MM-DD format
  - Validate date is parseable and valid
  - No future/past date restrictions (business decision)
- **Type Safety**: TypeScript ensures type correctness throughout the application

### Data Integrity

- **Database Constraints**: 
  - UNIQUE constraint on `user_id` prevents duplicate records
  - CHECK constraint ensures `amount >= 0`
  - NUMERIC(12,2) prevents floating-point errors
  - NOT NULL constraints prevent missing data
- **Cascade Deletion**: ON DELETE CASCADE ensures cleanup when user account deleted
- **Atomic Operations**: Database transactions ensure data consistency

### SQL Injection Prevention

- **Parameterized Queries**: Supabase client automatically parameterizes all queries
- **No Raw SQL**: Avoid raw SQL strings; use Supabase query builder
- **Type Safety**: TypeScript types prevent injection through type mismatches

### Rate Limiting Considerations

- **Future Implementation**: Consider rate limiting for PUT/DELETE operations
- **Dos Protection**: Implement API gateway rate limiting at infrastructure level
- **Per-User Limits**: Consider per-user operation limits if abuse detected

---

## 7. Error Handling

### Validation Errors (400 Bad Request)

**Scenario**: Invalid input data in PUT request

**Triggers**:
- Missing required fields (`effective_date`, `amount`)
- Invalid date format (not YYYY-MM-DD)
- Amount less than 0
- Amount with more than 2 decimal places
- Invalid data types

**Handling**:
1. Catch Zod validation errors
2. Transform errors into field-specific messages
3. Return `ValidationErrorDTO` with 400 status
4. Log validation failure for monitoring

**Response Example**:
```json
{
  "error": "Validation failed",
  "details": {
    "amount": "Amount must be non-negative and have at most 2 decimal places",
    "effective_date": "Must be a valid date in YYYY-MM-DD format"
  }
}
```

### Authentication Errors (401 Unauthorized)

**Scenario**: Missing or invalid authentication token

**Triggers**:
- No Authorization header
- Invalid or expired token
- No active session

**Handling**:
1. Check for session in `context.locals.supabase.auth.getSession()`
2. If no session, return 401 immediately
3. Log authentication failure (without sensitive data)

**Response Example**:
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### Not Found Errors (404 Not Found)

**Scenario**: Resource does not exist

**Triggers**:
- GET: User has no starting balance record
- DELETE: User has no starting balance to delete

**Handling**:
1. Query database for record
2. Check if result is null/empty
3. Return 404 with descriptive message
4. Log occurrence for monitoring

**Response Example**:
```json
{
  "error": "Not found",
  "message": "Starting balance not found"
}
```

### Database Errors (500 Internal Server Error)

**Scenario**: Unexpected database or server errors

**Triggers**:
- Database connection failures
- Query execution errors
- Constraint violations (should be prevented by validation)
- Network timeouts
- Supabase service unavailability

**Handling**:
1. Catch all unhandled errors in try-catch blocks
2. Log full error details server-side (including stack trace)
3. Generate unique request ID for tracking
4. Return generic error message to client (no sensitive details)
5. Monitor error rates for alerting

**Response Example**:
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later.",
  "request_id": "req_20240101_123456_abc"
}
```

### Error Logging Strategy

1. **Log Levels**:
   - INFO: Successful operations
   - WARN: 404 errors, validation failures
   - ERROR: 500 errors, database failures

2. **Log Content**:
   - Timestamp
   - Request ID
   - User ID (for debugging, not in client response)
   - Operation attempted
   - Error type and message
   - Stack trace (for 500 errors)

3. **Monitoring**:
   - Track error rates by endpoint
   - Alert on elevated 500 error rates
   - Monitor authentication failure patterns

---

## 8. Performance Considerations

### Database Query Optimization

**Indexing**:
- Primary index on `id` (automatic)
- Unique index on `user_id` (automatic from UNIQUE constraint)
- Queries are simple lookups by `user_id` - O(1) with index

**Query Efficiency**:
- Single-record operations (no joins or complex queries)
- Direct lookups by indexed `user_id`
- Minimal data transfer (small payload)

**Expected Performance**:
- Query time: < 10ms for indexed lookup
- Total response time: < 100ms including network

### Caching Strategy

**Not Recommended for MVP**:
- Data changes infrequently but is critical
- Cache invalidation complexity not worth the benefit
- Database query is already fast with indexing

**Future Consideration**:
- If starting balance accessed very frequently (e.g., on every projection)
- Consider application-level caching with short TTL (1-5 minutes)
- Use Redis or in-memory cache

### Payload Size

**Optimization**:
- Response payload is minimal (~200 bytes JSON)
- No pagination needed (single record)
- Enable gzip compression at server level

### Connection Pooling

**Supabase Handling**:
- Supabase manages connection pooling automatically
- No manual pool management needed
- Configure pool size at Supabase project level if needed

### Potential Bottlenecks

1. **Database Connection**: Mitigated by Supabase connection pooling
2. **Network Latency**: Minimal payload size reduces impact
3. **Authentication**: Session verification is fast with Supabase
4. **Validation**: Zod validation is synchronous and fast for simple schema

### Monitoring Metrics

Track the following for performance monitoring:
- Response time percentiles (p50, p95, p99)
- Error rates by status code
- Database query duration
- Request volume per endpoint
- Authentication failure rate

---

## 9. Implementation Steps

### Step 1: Create Validation Schema

**File**: `src/lib/validation/starting-balance.validation.ts`

**Tasks**:
1. Import Zod
2. Create schema for `UpsertStartingBalanceCommand`:
   ```typescript
   - effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidDate)
   - amount: z.number().min(0).refine(hasTwoDecimalPlaces)
   ```
3. Export validation schema
4. Add helper functions for date validation and decimal place checking

**Validation Rules**:
- `effective_date`: Must match YYYY-MM-DD format and be a valid calendar date
- `amount`: Must be >= 0, must have at most 2 decimal places

### Step 2: Create Starting Balance Service

**File**: `src/lib/services/starting-balance.service.ts`

**Tasks**:
1. Import `SupabaseClient` type from `src/db/supabase.client.ts`
2. Import DTOs from `src/types.ts`
3. Implement `getStartingBalance(supabase, userId)`:
   - Query `starting_balances` table with `user_id` filter
   - Return `StartingBalanceDTO | null`
4. Implement `upsertStartingBalance(supabase, userId, command)`:
   - Use `.upsert()` with `onConflict: 'user_id'`
   - Set `updated_at` to current timestamp
   - Return `{ data: StartingBalanceDTO, isNew: boolean }`
   - `isNew` determined by checking if `created_at === updated_at`
5. Implement `deleteStartingBalance(supabase, userId)`:
   - Delete record where `user_id` matches
   - Return boolean indicating if record was deleted
6. Add error handling in each method
7. Add TypeScript types for all parameters and returns

**Service Interface**:
```typescript
export const startingBalanceService = {
  getStartingBalance,
  upsertStartingBalance,
  deleteStartingBalance
}
```

### Step 3: Implement GET Endpoint

**File**: `src/pages/api/starting-balance.ts` (or `.get.ts` if using file-based routing)

**Tasks**:
1. Export `prerender = false`
2. Export `GET` handler function
3. Extract Supabase client from `context.locals.supabase`
4. Verify user session exists:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession()
   if (!session) return 401 response
   ```
5. Extract `userId` from session
6. Call `startingBalanceService.getStartingBalance(supabase, userId)`
7. Handle response:
   - If null: Return 404 with `NotFoundErrorDTO`
   - If data: Return 200 with `StartingBalanceDTO`
8. Wrap in try-catch for error handling
9. Return appropriate error responses with correct status codes

**Response Helper**:
- Create utility function to format JSON responses with status codes
- Ensure proper Content-Type headers

### Step 4: Implement PUT Endpoint

**File**: `src/pages/api/starting-balance.ts` (or `.put.ts`)

**Tasks**:
1. Export `prerender = false`
2. Export `PUT` handler function
3. Extract Supabase client from `context.locals.supabase`
4. Verify user session (same as GET)
5. Parse request body as JSON
6. Validate body using Zod schema from Step 1:
   ```typescript
   const result = schema.safeParse(body)
   if (!result.success) return 400 with validation errors
   ```
7. Call `startingBalanceService.upsertStartingBalance(supabase, userId, command)`
8. Handle response:
   - If `isNew === true`: Return 201 with `StartingBalanceDTO`
   - If `isNew === false`: Return 200 with `StartingBalanceDTO`
9. Catch validation errors and return 400 with `ValidationErrorDTO`
10. Catch other errors and return 500 with `InternalServerErrorDTO`

**Validation Error Formatting**:
- Transform Zod errors into field-specific error messages
- Create helper function to format Zod errors as `ValidationErrorDTO`

### Step 5: Implement DELETE Endpoint

**File**: `src/pages/api/starting-balance.ts` (or `.delete.ts`)

**Tasks**:
1. Export `prerender = false`
2. Export `DELETE` handler function
3. Extract Supabase client from `context.locals.supabase`
4. Verify user session (same as GET)
5. Call `startingBalanceService.deleteStartingBalance(supabase, userId)`
6. Handle response:
   - If `true` (deleted): Return 200 with `SuccessMessageDTO`
   - If `false` (not found): Return 404 with `NotFoundErrorDTO`
7. Wrap in try-catch for error handling
8. Return appropriate error responses

**Success Message**:
```typescript
{ message: "Starting balance deleted successfully" }
```

### Step 6: Create Error Response Helpers

**File**: `src/lib/utils/error-response.utils.ts`

**Tasks**:
1. Create helper functions for each error type:
   - `createValidationError(details)`
   - `createUnauthorizedError()`
   - `createNotFoundError(message)`
   - `createInternalServerError(requestId)`
2. Each function returns properly formatted error DTO
3. Include proper status codes in return objects
4. Add request ID generation for 500 errors

**Helper Signature**:
```typescript
function createValidationError(details: Record<string, string>): {
  status: 400,
  body: ValidationErrorDTO
}
```

### Step 7: Add Logging

**File**: Update service file and endpoint files

**Tasks**:
1. Add console logging for key operations:
   - INFO: Successful operations with user ID and operation type
   - WARN: 404 errors, validation failures
   - ERROR: 500 errors with stack traces
2. Generate unique request IDs for tracking
3. Log request IDs with all related log entries
4. Never log sensitive data (tokens, passwords)
5. Log user IDs for debugging but not in client responses

**Log Format**:
```typescript
console.log(`[INFO] [${requestId}] Starting balance retrieved for user ${userId}`)
console.error(`[ERROR] [${requestId}] Database error:`, error)
```

### Step 8: Add TypeScript Types

**Tasks**:
1. Ensure all functions have explicit return types
2. Ensure all parameters have explicit types
3. Use imported types from `src/types.ts`
4. Use `SupabaseClient` type from `src/db/supabase.client.ts`
5. Add JSDoc comments for exported functions
6. Verify no `any` types are used

### Step 9: Test Error Scenarios

**Manual Testing Checklist**:
1. **Authentication**:
   - Test with no auth token → 401
   - Test with invalid token → 401
   - Test with expired token → 401
2. **GET Endpoint**:
   - Test with no existing balance → 404
   - Test with existing balance → 200
3. **PUT Endpoint**:
   - Test creating new balance → 201
   - Test updating existing balance → 200
   - Test with negative amount → 400
   - Test with invalid date format → 400
   - Test with missing fields → 400
   - Test with > 2 decimal places → 400
4. **DELETE Endpoint**:
   - Test deleting existing balance → 200
   - Test deleting non-existent balance → 404
   - Test deleting twice → 404 on second attempt

### Step 10: Verify Database Constraints

**Tasks**:
1. Verify UNIQUE constraint on `user_id` works:
   - Create balance for user
   - Attempt to insert another (should fail or upsert)
2. Verify CHECK constraint on amount:
   - Database should reject negative amounts if validation bypassed
3. Verify CASCADE deletion:
   - Create test user and balance
   - Delete user
   - Verify balance is automatically deleted
4. Verify timestamp triggers:
   - Create balance, verify `created_at` is set
   - Update balance, verify `updated_at` changes

### Step 11: Add Integration Tests (Optional but Recommended)

**File**: `tests/api/starting-balance.test.ts`

**Tasks**:
1. Set up test Supabase client
2. Create test user
3. Test complete CRUD flow:
   - Create → Read → Update → Delete
4. Test error scenarios
5. Clean up test data
6. Mock authentication for testing

### Step 12: Documentation

**Tasks**:
1. Add JSDoc comments to all exported functions
2. Document service methods with examples
3. Update API documentation if separate docs exist
4. Add inline comments for complex validation logic
5. Document any business rules or assumptions

### Step 13: Code Review Checklist

Before marking implementation complete, verify:
- [ ] All endpoints return correct status codes
- [ ] Authentication is enforced on all endpoints
- [ ] Input validation is comprehensive
- [ ] Error responses match specified format
- [ ] TypeScript types are explicit and correct
- [ ] No console.log statements in production code (use proper logging)
- [ ] Service layer properly separates business logic
- [ ] Database queries use Supabase client correctly
- [ ] All error scenarios are handled
- [ ] Response DTOs match specification exactly
- [ ] Code follows project structure and coding practices
- [ ] No linter errors or warnings
- [ ] Early returns are used for error conditions
- [ ] Happy path is at the end of functions

---

## Notes

- The upsert operation in PUT should use Supabase's `.upsert()` method with `onConflict: 'user_id'` to handle both create and update in a single atomic operation
- Consider adding a database trigger to automatically update `updated_at` on modification
- The `isNew` flag in upsert response is determined by comparing `created_at` and `updated_at` timestamps (they'll be equal if just created)
- Since there's only one record per user, no pagination is needed for GET endpoint
- The effective_date has no business logic constraints (can be past, present, or future) - this is intentional for flexibility
- All monetary amounts use `numeric(12,2)` to avoid floating-point precision issues
- Consider adding database-level RLS (Row Level Security) policies in Supabase for additional security layer

