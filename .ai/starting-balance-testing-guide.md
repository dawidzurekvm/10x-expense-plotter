# Starting Balance API Testing Guide

This guide provides instructions for manually testing the Starting Balance API endpoints.

## Prerequisites

1. Running Astro development server: `npm run dev`
2. Valid Supabase authentication token
3. HTTP client (e.g., curl, Postman, or Thunder Client)

## Getting an Authentication Token

1. Log in to your application
2. Extract the Supabase session token from browser cookies or local storage
3. Use the token in the `Authorization` header as `Bearer <token>`

## Test Scenarios

### 1. Authentication Tests

#### Test 1.1: No Authentication Token
```bash
curl -X GET http://localhost:4321/api/starting-balance
```
**Expected:** 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

#### Test 1.2: Invalid Authentication Token
```bash
curl -X GET http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer invalid_token"
```
**Expected:** 401 Unauthorized

---

### 2. GET /api/starting-balance Tests

#### Test 2.1: Get Non-Existent Starting Balance
```bash
curl -X GET http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>"
```
**Expected:** 404 Not Found
```json
{
  "error": "Not found",
  "message": "Starting balance not found"
}
```

#### Test 2.2: Get Existing Starting Balance
*After creating a starting balance (see PUT tests)*
```bash
curl -X GET http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>"
```
**Expected:** 200 OK
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

---

### 3. PUT /api/starting-balance Tests

#### Test 3.1: Create New Starting Balance
```bash
curl -X PUT http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "effective_date": "2024-01-01",
    "amount": 5000.00
  }'
```
**Expected:** 201 Created
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

#### Test 3.2: Update Existing Starting Balance
```bash
curl -X PUT http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "effective_date": "2024-02-01",
    "amount": 6000.50
  }'
```
**Expected:** 200 OK
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "660e8400-e29b-41d4-a716-446655440000",
  "effective_date": "2024-02-01",
  "amount": 6000.50,
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-02-01T15:30:00Z"
}
```

---

### 4. PUT Validation Tests

#### Test 4.1: Missing Required Fields
```bash
curl -X PUT http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "effective_date": "Effective date is required",
    "amount": "Amount is required"
  }
}
```

#### Test 4.2: Invalid Date Format
```bash
curl -X PUT http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "effective_date": "01/01/2024",
    "amount": 5000
  }'
```
**Expected:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "effective_date": "Must be a valid date in YYYY-MM-DD format"
  }
}
```

#### Test 4.3: Negative Amount
```bash
curl -X PUT http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "effective_date": "2024-01-01",
    "amount": -100
  }'
```
**Expected:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "amount": "Amount must be non-negative"
  }
}
```

#### Test 4.4: Too Many Decimal Places
```bash
curl -X PUT http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "effective_date": "2024-01-01",
    "amount": 5000.123
  }'
```
**Expected:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "amount": "Amount must have at most 2 decimal places"
  }
}
```

#### Test 4.5: Invalid Date (Non-existent)
```bash
curl -X PUT http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "effective_date": "2024-02-31",
    "amount": 5000
  }'
```
**Expected:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "effective_date": "Must be a valid date in YYYY-MM-DD format"
  }
}
```

#### Test 4.6: Invalid JSON Body
```bash
curl -X PUT http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d 'not valid json'
```
**Expected:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "body": "Request body must be valid JSON"
  }
}
```

#### Test 4.7: Wrong Data Types
```bash
curl -X PUT http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "effective_date": 20240101,
    "amount": "five thousand"
  }'
```
**Expected:** 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "effective_date": "Effective date must be a string",
    "amount": "Amount must be a number"
  }
}
```

---

### 5. DELETE /api/starting-balance Tests

#### Test 5.1: Delete Existing Starting Balance
```bash
curl -X DELETE http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>"
```
**Expected:** 200 OK
```json
{
  "message": "Starting balance deleted successfully"
}
```

#### Test 5.2: Delete Non-Existent Starting Balance
```bash
curl -X DELETE http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>"
```
**Expected:** 404 Not Found
```json
{
  "error": "Not found",
  "message": "Starting balance not found"
}
```

#### Test 5.3: Delete Twice (Idempotency Check)
*After deleting once*
```bash
curl -X DELETE http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>"
```
**Expected:** 404 Not Found

---

### 6. Edge Cases

#### Test 6.1: Zero Amount
```bash
curl -X PUT http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "effective_date": "2024-01-01",
    "amount": 0
  }'
```
**Expected:** 201 Created or 200 OK (valid)

#### Test 6.2: Very Large Amount
```bash
curl -X PUT http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "effective_date": "2024-01-01",
    "amount": 9999999999.99
  }'
```
**Expected:** 201 Created or 200 OK (within NUMERIC(12,2) limit)

#### Test 6.3: Historical Date
```bash
curl -X PUT http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "effective_date": "2020-01-01",
    "amount": 5000
  }'
```
**Expected:** 201 Created or 200 OK (valid - no date restrictions)

#### Test 6.4: Future Date
```bash
curl -X PUT http://localhost:4321/api/starting-balance \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "effective_date": "2030-12-31",
    "amount": 5000
  }'
```
**Expected:** 201 Created or 200 OK (valid - no date restrictions)

---

## Complete Test Flow

### Full CRUD Cycle Test
1. **GET** (expect 404)
2. **PUT** to create (expect 201)
3. **GET** (expect 200 with data)
4. **PUT** to update (expect 200)
5. **GET** (expect 200 with updated data)
6. **DELETE** (expect 200)
7. **GET** (expect 404)
8. **DELETE** again (expect 404)

---

## Database Verification

After each operation, you can verify in Supabase:

```sql
-- View starting balance for a specific user
SELECT * FROM starting_balances WHERE user_id = '<user_id>';

-- Verify UNIQUE constraint (should fail if run twice for same user)
INSERT INTO starting_balances (user_id, effective_date, amount)
VALUES ('<user_id>', '2024-01-01', 5000);

-- Verify CHECK constraint (should fail)
INSERT INTO starting_balances (user_id, effective_date, amount)
VALUES ('<user_id>', '2024-01-01', -100);

-- Verify CASCADE delete (delete user, check if balance is deleted)
DELETE FROM auth.users WHERE id = '<test_user_id>';
```

---

## Error Logging Verification

Check server logs for:
- Request IDs in all log entries
- INFO logs for successful operations
- WARN logs for 404 and validation errors
- ERROR logs with stack traces for 500 errors

Example log entries:
```
[INFO] [req_20240101_123456_abc] Fetching starting balance for user 660e8400-e29b-41d4-a716-446655440000
[WARN] [req_20240101_123457_def] Starting balance not found for user 660e8400-e29b-41d4-a716-446655440000
[ERROR] [req_20240101_123458_ghi] Error retrieving starting balance: DatabaseError: ...
```

---

## Performance Testing

Monitor response times:
- GET operations should be < 100ms
- PUT operations should be < 150ms
- DELETE operations should be < 100ms

If response times exceed these thresholds, investigate:
- Database connection pooling
- Network latency
- Query performance
- Index usage

---

## Security Testing

### Test User Isolation
1. Create starting balance with User A's token
2. Try to access with User B's token
3. Verify User B cannot see User A's balance (should get 404)
4. Verify User B can create their own balance
5. Verify both users have independent records

### Test Token Expiration
1. Use an expired token
2. Verify 401 response
3. Refresh token and retry
4. Verify 200/201 response

---

## Notes

- All timestamps are in ISO 8601 format with timezone (UTC)
- Request IDs are automatically generated for tracking
- The `updated_at` field should change only on updates, not on reads
- The `created_at` field should remain constant after creation
- Each user can have only one starting balance record

