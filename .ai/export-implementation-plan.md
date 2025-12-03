# API Endpoint Implementation Plan: CSV Export

## 1. Endpoint Overview

The CSV Export endpoint (`GET /api/export/csv`) provides users with a downloadable CSV file containing all their expanded expense and income occurrences within a specified date range. This endpoint leverages the database's `expand_occurrences()` function to generate individual occurrences from entry series while applying all exceptions (skips and overrides).

**Key Features:**
- Exports occurrences as a downloadable CSV file
- Supports optional date range filtering (defaults to starting balance date → current date + 10 years)
- Supports optional entry type filtering (income or expense)
- Generates deterministic occurrence IDs using UUID v5
- Returns signed amounts (positive for income, negative for expense)

## 2. Request Details

### HTTP Method
`GET`

### URL Structure
```
/api/export/csv
```

### Query Parameters

#### Optional Parameters:
| Parameter | Type | Format | Description | Default |
|-----------|------|--------|-------------|---------|
| `from_date` | string | YYYY-MM-DD | Start date for export range | Starting balance effective date |
| `to_date` | string | YYYY-MM-DD | End date for export range | Current date + 10 years |
| `entry_type` | string | 'income' \| 'expense' | Filter by entry type | All types |

### Request Headers
- `Authorization`: Bearer token (handled by Supabase middleware)
- `Accept`: `text/csv` (optional, but recommended)

### Request Body
None (GET request)

### Example Requests

**Basic export (default date range):**
```
GET /api/export/csv
```

**Export with custom date range:**
```
GET /api/export/csv?from_date=2024-01-01&to_date=2024-12-31
```

**Export only expenses:**
```
GET /api/export/csv?from_date=2024-01-01&to_date=2024-12-31&entry_type=expense
```

## 3. Used Types

### Query Parameters Type
```typescript
GetExportCSVQueryParams {
  from_date?: string;     // YYYY-MM-DD, optional
  to_date?: string;       // YYYY-MM-DD, optional
  entry_type?: EntryType; // 'income' | 'expense', optional
}
```

### CSV Row Type
```typescript
CSVExportRowDTO {
  occurrence_id: string;  // UUID v5 from (series_id, date)
  series_id: string;      // UUID of parent series
  type: EntryType;        // 'income' | 'expense'
  title: string;          // Entry title
  description: string;    // Entry description (empty string if null)
  date: string;           // YYYY-MM-DD
  amount_pln: number;     // Signed: positive for income, negative for expense
  created_at: string;     // ISO 8601
  updated_at: string;     // ISO 8601
}
```

### Supporting Types
```typescript
EntryType = 'income' | 'expense'
StartingBalanceDTO // Used to get default from_date
```

### Error Response Types
- `ValidationErrorDTO` - for 400 Bad Request
- `UnauthorizedErrorDTO` - for 401 Unauthorized
- `NotFoundErrorDTO` - for 404 Not Found
- `InternalServerErrorDTO` - for 500 Internal Server Error

## 4. Response Details

### Success Response (200 OK)

**Headers:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="10x-expense-plotter-export-YYYY-MM-DD.csv"
```

**Body (CSV format):**
```csv
occurrence_id,series_id,type,title,description,date,amount_pln,created_at,updated_at
uuid,uuid,income,Monthly Salary,"",2024-01-15,5000.00,2024-01-01T10:00:00Z,2024-01-01T10:00:00Z
uuid,uuid,expense,Rent Payment,"Monthly apartment rent",2024-01-01,-1500.00,2024-01-01T10:05:00Z,2024-01-01T10:05:00Z
```

**CSV Column Descriptions:**
- `occurrence_id`: Deterministic UUID v5 generated from (series_id, occurrence_date)
- `series_id`: UUID of the parent entry series
- `type`: Entry type (income or expense)
- `title`: Entry title (max 120 characters)
- `description`: Entry description (empty string if null)
- `date`: Occurrence date in YYYY-MM-DD format
- `amount_pln`: Signed decimal amount (positive for income, negative for expense)
- `created_at`: ISO 8601 timestamp of series creation
- `updated_at`: ISO 8601 timestamp of last series update

**Sort Order:**
- Primary: `date` (ascending)
- Secondary: `series_id` (ascending)

### Error Responses

**400 Bad Request:**
```json
{
  "error": "Validation failed",
  "details": {
    "from_date": "Invalid date format. Expected YYYY-MM-DD",
    "to_date": "End date must be greater than or equal to start date"
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

**404 Not Found:**
```json
{
  "error": "Not found",
  "message": "Starting balance not configured. Please set up a starting balance first."
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred. Please try again later.",
  "request_id": "uuid"
}
```

## 5. Data Flow

### High-Level Flow

```
1. Client Request
   ↓
2. Astro API Route (/api/export/csv)
   ↓
3. Authentication Check (Supabase middleware)
   ↓
4. Query Parameter Validation (Zod)
   ↓
5. Fetch Starting Balance (if from_date not provided)
   ↓
6. Determine Date Range Defaults
   ↓
7. Call Export Service
   ↓
8. Database: expand_occurrences() function
   ↓
9. Filter by entry_type (if provided)
   ↓
10. Format Data as CSV
   ↓
11. Set Response Headers
   ↓
12. Stream CSV Response
   ↓
13. Client Downloads File
```

### Detailed Flow

#### Step 1: Request Validation
- Extract query parameters from URL
- Validate using Zod schema:
  - `from_date`: Optional, valid date format, not in future
  - `to_date`: Optional, valid date format, >= from_date
  - `entry_type`: Optional, must be 'income' or 'expense'
  - Date range validation: ensure range is reasonable (not exceeding 100 years)

#### Step 2: Determine Date Range
```typescript
// If from_date not provided, fetch starting balance
if (!from_date) {
  const startingBalance = await getStartingBalance(userId);
  if (!startingBalance) {
    return 404 Not Found;
  }
  from_date = startingBalance.effective_date;
}

// If to_date not provided, use current date + 10 years
if (!to_date) {
  to_date = addYears(new Date(), 10);
}
```

#### Step 3: Call Database Function
```typescript
// Call expand_occurrences() via service
const occurrences = await exportService.generateCSVExport(
  userId,
  from_date,
  to_date,
  entry_type
);
```

#### Step 4: Format CSV Output
```typescript
// Generate CSV header
const header = 'occurrence_id,series_id,type,title,description,date,amount_pln,created_at,updated_at';

// Format each row
const rows = occurrences.map(occ => {
  // Sign amount based on entry type
  const amount = occ.entry_type === 'income' ? occ.amount : -occ.amount;
  
  // Escape CSV fields (handle commas, quotes, newlines)
  return [
    occ.occurrence_id,
    occ.series_id,
    occ.entry_type,
    escapeCsvField(occ.title),
    escapeCsvField(occ.description || ''),
    occ.occurrence_date,
    amount.toFixed(2),
    occ.created_at,
    occ.updated_at
  ].join(',');
});

// Combine header and rows
const csv = [header, ...rows].join('\n');
```

#### Step 5: Set Response Headers and Return
```typescript
// Generate filename with current date
const filename = `10x-expense-plotter-export-${formatDate(new Date())}.csv`;

// Set headers
response.headers.set('Content-Type', 'text/csv; charset=utf-8');
response.headers.set('Content-Disposition', `attachment; filename="${filename}"`);

// Return CSV content
return new Response(csv, { status: 200, headers: response.headers });
```

### Database Interaction

**Function Call:**
```sql
SELECT * FROM expand_occurrences(
  p_user_id := $1,
  p_from_date := $2,
  p_to_date := $3
)
```

**Result Processing:**
- Database returns rows with columns: `occurrence_id`, `series_id`, `entry_type`, `title`, `description`, `occurrence_date`, `amount`, `created_at`, `updated_at`
- Apply `entry_type` filter in application layer (if provided)
- Sign amounts: positive for income, negative for expense
- Format as CSV with proper escaping

## 6. Security Considerations

### Authentication
- **Requirement**: User must be authenticated via Supabase
- **Implementation**: Use `context.locals.supabase` from Astro middleware
- **Validation**: Check for valid user session before processing request
- **Error Handling**: Return 401 if authentication fails

```typescript
const { data: { user }, error } = await context.locals.supabase.auth.getUser();
if (error || !user) {
  return new Response(JSON.stringify({
    error: 'Unauthorized',
    message: 'Invalid or missing authentication token'
  }), { status: 401 });
}
```

### Authorization
- **Data Isolation**: User can only export their own data
- **Implementation**: Pass authenticated user's ID to database function
- **Database Enforcement**: `expand_occurrences()` function uses `SECURITY INVOKER` to respect RLS policies

### Input Validation
- **Date Parameters**: Validate format and logical consistency
- **Entry Type**: Validate against allowed enum values
- **SQL Injection Prevention**: Use parameterized queries for all database calls
- **XSS Prevention**: Not applicable for CSV output, but ensure proper CSV escaping

### CSV Injection Prevention
- **Formula Injection**: Escape fields that start with `=`, `+`, `-`, `@`, `\t`, `\r`
- **Field Escaping**: Properly escape quotes, commas, and newlines
- **Safe Characters**: Ensure UTF-8 encoding is properly handled

```typescript
function escapeCsvField(field: string): string {
  // Prevent formula injection
  if (/^[=+\-@\t\r]/.test(field)) {
    field = "'" + field;
  }
  
  // Escape quotes and wrap in quotes if contains special chars
  if (field.includes('"') || field.includes(',') || field.includes('\n')) {
    field = '"' + field.replace(/"/g, '""') + '"';
  }
  
  return field;
}
```

### Rate Limiting Considerations
- **Large Exports**: Consider implementing rate limiting for large date ranges
- **Resource Usage**: Monitor database query execution time
- **Timeout**: Implement reasonable timeout for query execution

## 7. Error Handling

### Validation Errors (400 Bad Request)

**Invalid Date Format:**
```typescript
from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD')
```
**Error Response:**
```json
{
  "error": "Validation failed",
  "details": {
    "from_date": "Invalid date format. Expected YYYY-MM-DD"
  }
}
```

**Invalid Date Range:**
- `to_date` < `from_date`
- Date range exceeds 100 years
- Dates are in the future beyond reasonable limits

```json
{
  "error": "Validation failed",
  "details": {
    "to_date": "End date must be greater than or equal to start date"
  }
}
```

**Invalid Entry Type:**
```json
{
  "error": "Validation failed",
  "details": {
    "entry_type": "Invalid entry type. Must be 'income' or 'expense'"
  }
}
```

### Authentication Errors (401 Unauthorized)

**Missing or Invalid Token:**
```typescript
const { data: { user }, error } = await context.locals.supabase.auth.getUser();
if (error || !user) {
  return errorResponse(401, 'Unauthorized', 'Invalid or missing authentication token');
}
```

### Not Found Errors (404 Not Found)

**No Starting Balance:**
- Occurs when `from_date` is not provided and user has no starting balance configured
```json
{
  "error": "Not found",
  "message": "Starting balance not configured. Please set up a starting balance first."
}
```

### Database Errors (500 Internal Server Error)

**Database Function Failure:**
- Connection timeout
- Query execution error
- Unexpected database error

```typescript
try {
  const result = await supabase.rpc('expand_occurrences', { ... });
} catch (error) {
  console.error('Database error:', error);
  return errorResponse(
    500,
    'Internal server error',
    'An unexpected error occurred. Please try again later.',
    { request_id: generateRequestId() }
  );
}
```

### Error Handling Best Practices

1. **Early Returns**: Validate and fail fast
2. **Descriptive Messages**: Provide clear error messages
3. **Logging**: Log all errors server-side with context
4. **Security**: Don't expose sensitive information in error messages
5. **Consistency**: Use standardized error response formats

## 8. Performance Considerations

### Potential Bottlenecks

1. **Large Date Ranges**
   - Generating occurrences for 10+ years can be computationally expensive
   - Consider limiting maximum date range (e.g., 50-100 years)

2. **High Frequency Entries**
   - Daily or weekly entries over long periods generate many rows
   - Database function uses recursive CTEs which can be memory intensive

3. **CSV Generation**
   - String concatenation for large datasets can be slow
   - Consider streaming response for very large exports

### Optimization Strategies

#### Database Level
- **Indexed Queries**: Ensure `expand_occurrences()` uses appropriate indexes
- **Query Timeout**: Set reasonable timeout (e.g., 30 seconds)
- **Connection Pooling**: Leverage Supabase connection pooling

#### Application Level
- **Streaming Response**: For large exports, consider streaming CSV rows
```typescript
// Instead of building entire CSV in memory
const stream = new ReadableStream({
  async start(controller) {
    controller.enqueue(header + '\n');
    for (const occ of occurrences) {
      controller.enqueue(formatCsvRow(occ) + '\n');
    }
    controller.close();
  }
});
```

- **Pagination Warning**: If result set exceeds threshold, log warning
- **Lazy Evaluation**: Process rows as they come from database

#### Caching Considerations
- **No Caching**: Export should always reflect current data
- **Starting Balance**: Cache starting balance lookup for duration of request

### Performance Metrics to Monitor
- Query execution time
- Response size
- Memory usage
- Export completion rate

## 9. Implementation Steps

### Step 1: Create Validation Schema
**File**: `src/lib/validation/export.validation.ts`

```typescript
import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const exportCSVQuerySchema = z.object({
  from_date: z.string()
    .regex(dateRegex, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
  to_date: z.string()
    .regex(dateRegex, 'Invalid date format. Expected YYYY-MM-DD')
    .optional(),
  entry_type: z.enum(['income', 'expense'])
    .optional()
}).refine(
  (data) => {
    if (data.from_date && data.to_date) {
      return new Date(data.to_date) >= new Date(data.from_date);
    }
    return true;
  },
  {
    message: 'End date must be greater than or equal to start date',
    path: ['to_date']
  }
).refine(
  (data) => {
    if (data.from_date && data.to_date) {
      const daysDiff = Math.abs(
        (new Date(data.to_date).getTime() - new Date(data.from_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysDiff <= 36500; // 100 years
    }
    return true;
  },
  {
    message: 'Date range cannot exceed 100 years',
    path: ['to_date']
  }
);
```

### Step 2: Create Export Service
**File**: `src/lib/services/export.service.ts`

```typescript
import type { SupabaseClient } from '@/db/supabase.client';
import type { EntryType } from '@/types';

export interface CSVOccurrence {
  occurrence_id: string;
  series_id: string;
  entry_type: EntryType;
  title: string;
  description: string;
  occurrence_date: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export async function generateCSVExport(
  supabase: SupabaseClient,
  userId: string,
  fromDate: string,
  toDate: string,
  entryType?: EntryType
): Promise<CSVOccurrence[]> {
  const { data, error } = await supabase.rpc('expand_occurrences', {
    p_user_id: userId,
    p_from_date: fromDate,
    p_to_date: toDate
  });

  if (error) {
    throw new Error(`Failed to expand occurrences: ${error.message}`);
  }

  let occurrences = data as CSVOccurrence[];

  // Apply entry_type filter if provided
  if (entryType) {
    occurrences = occurrences.filter(occ => occ.entry_type === entryType);
  }

  return occurrences;
}

export function escapeCsvField(field: string): string {
  // Prevent formula injection
  if (/^[=+\-@\t\r]/.test(field)) {
    field = "'" + field;
  }
  
  // Escape quotes and wrap in quotes if contains special chars
  if (field.includes('"') || field.includes(',') || field.includes('\n')) {
    field = '"' + field.replace(/"/g, '""') + '"';
  }
  
  return field;
}

export function formatCsvRow(occ: CSVOccurrence): string {
  // Sign amount based on entry type
  const amount = occ.entry_type === 'income' ? occ.amount : -occ.amount;
  
  return [
    occ.occurrence_id,
    occ.series_id,
    occ.entry_type,
    escapeCsvField(occ.title),
    escapeCsvField(occ.description || ''),
    occ.occurrence_date,
    amount.toFixed(2),
    occ.created_at,
    occ.updated_at
  ].join(',');
}

export function generateCSVContent(occurrences: CSVOccurrence[]): string {
  const header = 'occurrence_id,series_id,type,title,description,date,amount_pln,created_at,updated_at';
  const rows = occurrences.map(formatCsvRow);
  return [header, ...rows].join('\n');
}

export function generateCSVFilename(): string {
  const today = new Date().toISOString().split('T')[0];
  return `10x-expense-plotter-export-${today}.csv`;
}
```

### Step 3: Create API Route Handler
**File**: `src/pages/api/export/csv.ts`

```typescript
import type { APIRoute } from 'astro';
import { exportCSVQuerySchema } from '@/lib/validation/export.validation';
import {
  generateCSVExport,
  generateCSVContent,
  generateCSVFilename
} from '@/lib/services/export.service';
import { getStartingBalance } from '@/lib/services/starting-balance.service';
import { errorResponse } from '@/lib/utils/error-response.utils';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    // 1. Authentication check
    const { data: { user }, error: authError } = await context.locals.supabase.auth.getUser();
    
    if (authError || !user) {
      return errorResponse(
        401,
        'Unauthorized',
        'Invalid or missing authentication token'
      );
    }

    // 2. Parse and validate query parameters
    const queryParams = Object.fromEntries(context.url.searchParams.entries());
    const validationResult = exportCSVQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join('.');
        details[path] = err.message;
      });

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

    const { from_date, to_date, entry_type } = validationResult.data;

    // 3. Determine from_date default
    let fromDate = from_date;
    if (!fromDate) {
      const startingBalance = await getStartingBalance(
        context.locals.supabase,
        user.id
      );

      if (!startingBalance) {
        return errorResponse(
          404,
          'Not found',
          'Starting balance not configured. Please set up a starting balance first.'
        );
      }

      fromDate = startingBalance.effective_date;
    }

    // 4. Determine to_date default (current date + 10 years)
    let toDate = to_date;
    if (!toDate) {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);
      toDate = futureDate.toISOString().split('T')[0];
    }

    // 5. Generate CSV export
    const occurrences = await generateCSVExport(
      context.locals.supabase,
      user.id,
      fromDate,
      toDate,
      entry_type
    );

    // 6. Format as CSV
    const csvContent = generateCSVContent(occurrences);
    const filename = generateCSVFilename();

    // 7. Return CSV response
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('Export CSV error:', error);
    
    return errorResponse(
      500,
      'Internal server error',
      'An unexpected error occurred. Please try again later.',
      { request_id: crypto.randomUUID() }
    );
  }
};
```

### Step 4: Update Type Exports (if needed)

Verify that `src/types.ts` exports all necessary types:
- `GetExportCSVQueryParams` ✓
- `CSVExportRowDTO` ✓
- `EntryType` ✓

No changes needed.

