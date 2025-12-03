# API Endpoint Implementation Plan: GET /api/projection

## 1. Endpoint Overview

The `/api/projection` endpoint computes the projected account balance for a specific target date. It calculates the balance by starting with the user's configured starting balance and adding all income occurrences while subtracting all expense occurrences up to the target date.

**Key Features:**
- Provides balance projection for financial planning
- Includes computation breakdown (total income, total expense, net change)
- Returns date range limits for client-side validation
- Leverages database function `project_balance()` for efficient computation
- Respects series exceptions (overrides and skips)

## 2. Request Details

- **HTTP Method**: GET
- **URL Structure**: `/api/projection`
- **Authentication**: Required (enforced by middleware)

### Query Parameters

**Required:**
- `date` (string): Target date for balance projection in YYYY-MM-DD format
  - Must be on or after the starting balance effective date
  - Must not exceed current date + 10 years
  - Example: `2025-12-31`

**Optional:**
- None

### Request Examples

```
GET /api/projection?date=2025-12-31
GET /api/projection?date=2026-06-15
```

## 3. Used Types

### Query Parameter Types
```typescript
// From src/types.ts (line 452-455)
GetProjectionQueryParams {
  date: string; // YYYY-MM-DD, required
}
```

### Response Types
```typescript
// From src/types.ts (line 270-276)
ProjectionDTO {
  target_date: string;
  projected_balance: number;
  starting_balance: StartingBalanceInfoDTO;
  computation: ProjectionComputationDTO;
  date_range_limits: DateRangeLimitsDTO;
}

// From src/types.ts (line 94-97)
StartingBalanceInfoDTO {
  amount: number;
  effective_date: string;
}

// From src/types.ts (line 261-265)
ProjectionComputationDTO {
  total_income: number;
  total_expense: number;
  net_change: number;
}

// From src/types.ts (line 67-70)
DateRangeLimitsDTO {
  min_date: string;
  max_date: string;
}
```

### Error Types
```typescript
// From src/types.ts
ValidationErrorDTO        // 400 Bad Request
UnauthorizedErrorDTO      // 401 Unauthorized
NotFoundErrorDTO          // 404 Not Found
InternalServerErrorDTO    // 500 Internal Server Error
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "target_date": "2025-12-31",
  "projected_balance": 15750.50,
  "starting_balance": {
    "amount": 10000.00,
    "effective_date": "2025-01-01"
  },
  "computation": {
    "total_income": 12500.00,
    "total_expense": 6749.50,
    "net_change": 5750.50
  },
  "date_range_limits": {
    "min_date": "2025-01-01",
    "max_date": "2035-12-03"
  }
}
```

### Error Responses

**400 Bad Request - Missing Date Parameter**
```json
{
  "error": "Validation failed",
  "details": {
    "date": "Date parameter is required"
  }
}
```

**400 Bad Request - Invalid Date Format**
```json
{
  "error": "Validation failed",
  "details": {
    "date": "Invalid date format. Expected YYYY-MM-DD"
  }
}
```

**400 Bad Request - Date Out of Range**
```json
{
  "error": "Validation failed",
  "details": {
    "date": "Date must be between 2025-01-01 and 2035-12-03"
  }
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

**404 Not Found - No Starting Balance**
```json
{
  "error": "Not found",
  "message": "No starting balance configured. Please set a starting balance first."
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later.",
  "request_id": "uuid-v4"
}
```

## 5. Data Flow

### High-Level Flow
```
1. Client Request → Astro Middleware (auth check)
2. Middleware → API Route Handler (/api/projection.ts)
3. Route Handler → Validation Layer (projection.validation.ts)
4. Validation Layer → Service Layer (projection.service.ts)
5. Service Layer → Supabase (multiple queries):
   a. Fetch starting balance info
   b. Call project_balance() function
   c. Calculate totals via expand_occurrences()
6. Service Layer → Format response with all required data
7. Route Handler → Return formatted JSON response
```

### Detailed Data Flow

#### Step 1: Authentication (Middleware)
- Middleware extracts user from JWT token
- Attaches authenticated Supabase client to `context.locals`
- Rejects request with 401 if authentication fails

#### Step 2: Request Validation
- Parse query parameter `date`
- Validate date format (YYYY-MM-DD)
- Fetch starting balance to determine min_date
- Validate date is within allowed range [min_date, current_date + 10 years]

#### Step 3: Service Layer Operations

**3a. Fetch Starting Balance**
```sql
SELECT amount, effective_date
FROM starting_balances
WHERE user_id = :user_id
```
- If not found, return 404 error
- Store for response structure

**3b. Call project_balance() Function**
```sql
SELECT project_balance(:user_id, :target_date)
```
- Returns projected balance as numeric(12,2)
- Returns NULL if date is before starting balance effective date

**3c. Fetch Income and Expense Totals**
```sql
-- Total Income
SELECT COALESCE(SUM(amount), 0) as total_income
FROM expand_occurrences(:user_id, :starting_date, :target_date)
WHERE entry_type = 'income'

-- Total Expense
SELECT COALESCE(SUM(amount), 0) as total_expense
FROM expand_occurrences(:user_id, :starting_date, :target_date)
WHERE entry_type = 'expense'
```

**3d. Calculate Date Range Limits**
- min_date: starting balance effective_date
- max_date: current date + 10 years

#### Step 4: Response Construction
- Assemble ProjectionDTO with all computed values
- Calculate net_change: total_income - total_expense
- Verify: projected_balance = starting_balance + net_change
- Return structured response

## 6. Security Considerations

### Authentication
- **Enforcement**: Handled by Astro middleware (`src/middleware/index.ts`)
- **Token Validation**: JWT token validated by Supabase client
- **Session Management**: Uses Supabase session management
- **Response**: 401 Unauthorized if token is invalid or missing

### Authorization
- **Row-Level Security**: All database queries respect RLS policies
- **User Isolation**: `project_balance()` uses SECURITY INVOKER, respecting RLS
- **Data Access**: Users can only access their own projections

### Input Validation
- **Date Format**: Strict YYYY-MM-DD validation using Zod
- **Date Range**: Limit computation to reasonable timeframe (10 years)
- **SQL Injection**: Prevented by parameterized queries via Supabase client
- **Type Safety**: TypeScript ensures type correctness

### Data Protection
- **Sensitive Data**: Financial data only visible to authenticated user
- **HTTPS**: All communication should use HTTPS in production
- **No PII Leakage**: Error messages don't expose sensitive information

### Rate Limiting Considerations
- **Database Load**: Single query per request (efficient)
- **Computation Cost**: Bounded by date range limits
- **Future Enhancement**: Consider implementing rate limiting at API gateway level

## 7. Error Handling

### Error Categories and Responses

#### 1. Validation Errors (400 Bad Request)

**Scenario**: Missing date parameter
```typescript
{
  error: "Validation failed",
  details: { date: "Date parameter is required" }
}
```

**Scenario**: Invalid date format
```typescript
{
  error: "Validation failed",
  details: { date: "Invalid date format. Expected YYYY-MM-DD" }
}
```

**Scenario**: Date before starting balance
```typescript
{
  error: "Validation failed",
  details: { 
    date: "Date must be on or after starting balance effective date (2025-01-01)" 
  }
}
```

**Scenario**: Date too far in future
```typescript
{
  error: "Validation failed",
  details: { 
    date: "Date cannot be more than 10 years in the future (max: 2035-12-03)" 
  }
}
```

#### 2. Authentication Errors (401 Unauthorized)

**Scenario**: Missing or invalid token
- Handled by middleware
- Returns standard UnauthorizedErrorDTO

#### 3. Resource Not Found (404 Not Found)

**Scenario**: No starting balance configured
```typescript
{
  error: "Not found",
  message: "No starting balance configured. Please set a starting balance first."
}
```

#### 4. Server Errors (500 Internal Server Error)

**Scenario**: Database connection failure
```typescript
{
  error: "Internal server error",
  message: "An unexpected error occurred. Please try again later.",
  request_id: "generated-uuid-v4"
}
```

**Scenario**: Unexpected error in project_balance()
- Log full error details to console/monitoring
- Return generic 500 error to client
- Include request_id for debugging

### Error Handling Strategy

1. **Validation Errors**: Catch early, return specific messages
2. **Database Errors**: Log details, return generic message
3. **Unexpected Errors**: Catch all, log with request_id, return 500
4. **Error Logging**: Use console.error with structured logging

### Error Response Helper

Use existing `error-response.utils.ts` for consistent error formatting:
```typescript
import { errorResponse } from '@/lib/utils/error-response.utils';

// Validation error
return errorResponse(400, 'Validation failed', { date: 'Invalid format' });

// Not found
return errorResponse(404, 'Not found', 'No starting balance configured');

// Internal error
return errorResponse(500, 'Internal server error', 'Unexpected error', requestId);
```

## 8. Performance Considerations

### Database Performance

**Efficient Function Design:**
- `project_balance()` uses optimized `expand_occurrences()` function
- Single database round-trip for balance calculation
- Proper indexing on `starting_balances.user_id`
- Proper indexing on `entry_series.user_id` and date columns

**Query Optimization:**
- Use prepared statements (handled by Supabase)
- Leverage database function caching (STABLE function)
- RLS policies use indexed columns (user_id)

### Computation Complexity

**Bounded by Date Range:**
- Maximum 10-year projection window
- `expand_occurrences()` generates at most ~3,650 rows (10 years daily)
- Typical case: much fewer occurrences (weekly/monthly entries)

**Database Function Benefits:**
- Computation happens in PostgreSQL (faster than application layer)
- Aggregation optimized by database engine
- No data transfer overhead for intermediate results

### Caching Strategies

**Current Implementation:**
- No caching (always fresh data)
- Acceptable for user-specific financial data

**Future Optimization (if needed):**
- Cache starting balance info (rarely changes)
- Cache projection for recently queried dates (TTL: 1 hour)
- Invalidate cache on entry/starting balance updates

### Response Time Expectations

- **Target**: < 200ms for typical request
- **Database query**: < 50ms (with proper indexing)
- **Network latency**: Depends on deployment
- **Total**: Should be under 500ms even with complex projections

### Bottleneck Identification

**Potential Bottlenecks:**
1. Large number of entry series (100+ active series)
2. Very long date ranges (approaching 10 years)
3. Complex recurrence patterns with many exceptions

**Mitigation:**
- Database function is optimized for this use case
- Limit date range to 10 years
- Monitor query performance with database metrics

## 9. Implementation Steps

### Phase 1: Validation Layer

**File**: `src/lib/validation/projection.validation.ts`

1. Create Zod schema for query parameters
   - Validate `date` is required
   - Validate date format (YYYY-MM-DD)
   - Validate date is a valid calendar date

2. Create function to validate date range
   - Accept starting balance effective date as parameter
   - Validate target date >= starting balance date
   - Validate target date <= current date + 10 years
   - Return descriptive error messages

3. Export validation schema and helper functions

**Example Structure:**
```typescript
import { z } from 'zod';

export const getProjectionQuerySchema = z.object({
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date')
});

export function validateProjectionDateRange(
  targetDate: string,
  startingBalanceDate: string
): { valid: boolean; error?: string } {
  // Implementation
}
```

### Phase 2: Service Layer

**File**: `src/lib/services/projection.service.ts`

1. Create `ProjectionService` class or module
   - Accept Supabase client and user_id as parameters
   - Implement error handling with try-catch

2. Implement `getStartingBalance()` helper
   - Query `starting_balances` table
   - Return starting balance info or null
   - Handle database errors

3. Implement `getProjectionTotals()` helper
   - Call `expand_occurrences()` with date range
   - Aggregate income and expense separately
   - Return totals as ProjectionComputationDTO

4. Implement main `getProjection()` function
   - Fetch starting balance (return 404 if not found)
   - Call `project_balance()` database function
   - Fetch income/expense totals
   - Calculate date range limits
   - Assemble and return ProjectionDTO

5. Add comprehensive error handling
   - Catch Supabase errors
   - Log errors with context
   - Throw typed errors for route handler

**Example Structure:**
```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import type { ProjectionDTO } from '@/types';

export class ProjectionService {
  constructor(
    private supabase: SupabaseClient,
    private userId: string
  ) {}

  async getProjection(targetDate: string): Promise<ProjectionDTO> {
    // Implementation
  }

  private async getStartingBalance() {
    // Implementation
  }

  private async getProjectionTotals(
    startingDate: string,
    targetDate: string
  ) {
    // Implementation
  }

  private calculateDateRangeLimits(startingDate: string) {
    // Implementation
  }
}
```

### Phase 3: API Route Handler

**File**: `src/pages/api/projection.ts`

1. Set up endpoint configuration
   - Export `export const prerender = false`
   - Define GET handler

2. Implement GET handler
   - Extract user from `context.locals.user`
   - Extract Supabase client from `context.locals.supabase`
   - Parse query parameters

3. Add validation layer
   - Validate query parameters with Zod schema
   - Return 400 for validation errors
   - Use error response helper for consistent formatting

4. Call service layer
   - Instantiate ProjectionService
   - Call `getProjection()` with validated date
   - Handle service errors (404, 500)

5. Return formatted response
   - Return 200 OK with ProjectionDTO
   - Ensure proper Content-Type: application/json

6. Add error handling
   - Catch validation errors → 400
   - Catch "not found" errors → 404
   - Catch all other errors → 500 with request_id
   - Use error response utility

**Example Structure:**
```typescript
import type { APIRoute } from 'astro';
import { getProjectionQuerySchema } from '@/lib/validation/projection.validation';
import { ProjectionService } from '@/lib/services/projection.service';
import { errorResponse } from '@/lib/utils/error-response.utils';
import { randomUUID } from 'crypto';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Extract authenticated user and Supabase client
    const user = locals.user;
    const supabase = locals.supabase;

    if (!user) {
      return errorResponse(401, 'Unauthorized', 'Authentication required');
    }

    // 2. Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      date: url.searchParams.get('date')
    };

    const validation = getProjectionQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      const details = validation.error.flatten().fieldErrors;
      return errorResponse(400, 'Validation failed', details);
    }

    // 3. Call service layer
    const projectionService = new ProjectionService(supabase, user.id);
    const projection = await projectionService.getProjection(validation.data.date);

    // 4. Return success response
    return new Response(JSON.stringify(projection), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Handle specific errors
    if (error.message.includes('No starting balance')) {
      return errorResponse(404, 'Not found', error.message);
    }

    // Log and return generic error
    const requestId = randomUUID();
    console.error(`[${requestId}] Error in GET /api/projection:`, error);
    return errorResponse(
      500,
      'Internal server error',
      'An unexpected error occurred',
      requestId
    );
  }
};


### Monitoring and Observability

1. Add performance metrics (response time, database query time)
2. Track error rates by type (validation, not found, server error)
3. Monitor database function performance
4. Alert on slow queries (> 1 second)
5. Track usage patterns (common date ranges, peak times)

---

## Appendix: Quick Reference

### Key Files to Create/Modify

| File | Purpose | Priority |
|------|---------|----------|
| `src/lib/validation/projection.validation.ts` | Input validation with Zod | High |
| `src/lib/services/projection.service.ts` | Business logic and database interaction | High |
| `src/pages/api/projection.ts` | API route handler | High |

### Database Resources Used

| Resource | Type | Purpose |
|----------|------|---------|
| `project_balance()` | Function | Main projection computation |
| `expand_occurrences()` | Function | Generate occurrences with exceptions |
| `starting_balances` | Table | User's starting balance |

### External Dependencies

- `@supabase/supabase-js`: Database client
- `zod`: Input validation
- `astro`: Framework (APIRoute type)

### Related Endpoints

- `GET /api/starting-balance`: Fetch starting balance (prerequisite)
- `GET /api/occurrences`: View occurrences used in projection
- `GET /api/entries`: View entry series that generate projections

