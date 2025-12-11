# API Endpoint Implementation Plan: Delete Account

## 1. Overview
The Delete Account endpoint permanently removes a user's account and all associated data from the system. This is a destructive, irreversible operation that requires explicit user confirmation.

## 2. Endpoint Details

### `src/pages/api/account.ts`
- **Method:** `DELETE`
- **URL Path:** `/api/account`
- **Purpose:** Permanently deletes the user's account and all associated data.

## 3. Request

### Headers
- `Content-Type: application/json`
- `Cookie: sb-access-token=...` (Session authentication)

### Body
```typescript
interface DeleteAccountCommand {
  confirmation: "DELETE MY ACCOUNT";
}
```

```json
{ "confirmation": "DELETE MY ACCOUNT" }
```

## 4. Response

### Success (200 OK)
```typescript
interface SuccessMessageDTO {
  message: string;
}
```

```json
{ "message": "Account deleted successfully" }
```

### Error Responses
| Status | Description | Response |
|--------|-------------|----------|
| 400 | Invalid confirmation string | `ErrorResponseDTO` |
| 401 | Unauthorized (no valid session) | `ErrorResponseDTO` |
| 405 | Method not allowed | `ErrorResponseDTO` |
| 500 | Server error during deletion | `ErrorResponseDTO` |

## 5. Implementation Logic

### Flow
1. **Authenticate:** Verify session using `locals.supabase`.
2. **Validate:** Parse body using `zod`; ensure `confirmation` matches exactly "DELETE MY ACCOUNT".
3. **Data Cleanup:**
   - Delete from `starting_balances` where `user_id` matches.
   - Delete from `entry_series` where `user_id` matches (cascade deletes occurrences/exceptions).
   - Delete from `analytics_events` where `user_id` matches.
4. **Auth User Deletion:** 
   - Use `supabase.auth.admin.deleteUser(userId)` (requires Service Role Key) OR rely on Supabase cascading if configured. 
   - *Fallback for MVP without Service Role:* Ensure all public schema data is deleted and return success. The client will then sign out.

### Validation Schema
```typescript
import { z } from "zod";

export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT"),
});

export type DeleteAccountCommand = z.infer<typeof deleteAccountSchema>;
```

## 6. Error Handling
- **401 (Unauthorized):** Return if no valid session exists.
- **400 (Bad Request):** Return if `confirmation` string does not match exactly "DELETE MY ACCOUNT".
- **500 (Server Error):** Return if database operations fail.

## 7. Security Considerations
- Requires authenticated session.
- Explicit confirmation string prevents accidental deletion.
- All user data must be removed from public schema tables.
- Client should sign out after successful deletion.

## 8. Implementation Steps

1. **Create Validation Schema**
   - Add `deleteAccountSchema` to `src/lib/validation/account.validation.ts`.

2. **Create API Endpoint**
   - Create `src/pages/api/account.ts`.
   - Implement `DELETE` handler with authentication check.
   - Parse and validate request body.
   - Execute deletion queries in correct order (respecting foreign key constraints).

3. **Add Types**
   - Add `DeleteAccountCommand` to `src/types.ts` if not already present.

4. **Testing**
   - Test with invalid confirmation string (expect 400).
   - Test without authentication (expect 401).
   - Test successful deletion flow.
   - Verify all related data is removed from database.

