# API Endpoint Implementation Plan: Delete Account

## 1. Overview
The Delete Account endpoint permanently removes a user's account and all associated data from the system. This is a destructive, irreversible operation that requires explicit user confirmation.

## 2. Endpoint Details

### `src/pages/api/account.ts`
- **Method:** `DELETE`
- **URL Path:** `/api/account`
- **Purpose:** Permanently deletes the user's account and all associated data.

### `supabase/functions/delete-account/index.ts`
- **Method:** `DELETE`
- **URL Path:** `/functions/v1/delete-account`
- **Purpose:** Supabase Edge Function that deletes the user from `auth.users` using service role privileges.

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
3. **Data Cleanup (respecting foreign key constraints):**
   - Delete from `series_exceptions` where `user_id` matches (references `entry_series`).
   - Delete from `entry_series` where `user_id` matches.
   - Delete from `starting_balances` where `user_id` matches.
   - Delete from `analytics_events` where `user_id` matches.
4. **Auth User Deletion:** 
   - Get the user's access token from the session.
   - Call the Supabase Edge Function `delete-account` with the access token.
   - The Edge Function uses `supabase.auth.admin.deleteUser(userId)` with the service role key (automatically available in Edge Functions).

### Validation Schema
```typescript
import { z } from "zod";

export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT"),
});

export type DeleteAccountCommand = z.infer<typeof deleteAccountSchema>;
```

## 6. Edge Function Implementation

The Edge Function (`supabase/functions/delete-account/index.ts`) handles the actual deletion of the user from `auth.users`:

1. **Verify Authorization:** Extract and validate the JWT from the `Authorization` header.
2. **Get User Identity:** Use the anon client to verify the user making the request.
3. **Delete User:** Use the admin client (with service role key) to delete the user from `auth.users`.

### Environment Variables (automatically provided by Supabase)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin privileges)

## 7. Error Handling
- **401 (Unauthorized):** Return if no valid session exists.
- **400 (Bad Request):** Return if `confirmation` string does not match exactly "DELETE MY ACCOUNT".
- **500 (Server Error):** Return if database operations or Edge Function call fails.

## 8. Security Considerations
- Requires authenticated session.
- Explicit confirmation string prevents accidental deletion.
- All user data must be removed from public schema tables.
- Service role key is only used within Supabase Edge Function (never exposed to client or Astro app).
- Client should sign out after successful deletion.

## 9. Environment Configuration

### Production
No additional configuration needed. The Edge Function automatically has access to required environment variables.

### Local Development
Add to `.env` or `.env.local`:
```bash
# Optional: Override Edge Functions URL for local Supabase
SUPABASE_FUNCTIONS_URL=http://127.0.0.1:54321
```

The API endpoint uses `SUPABASE_FUNCTIONS_URL` if set, otherwise falls back to `SUPABASE_URL`.

## 10. Implementation Steps

1. **Create Validation Schema**
   - Add `deleteAccountSchema` to `src/lib/validation/account.validation.ts`.

2. **Create Edge Function**
   - Create `supabase/functions/delete-account/index.ts`.
   - Implement user verification using anon client.
   - Implement user deletion using admin client.
   - Add CORS headers for cross-origin requests.

3. **Create API Endpoint**
   - Create `src/pages/api/account.ts`.
   - Implement `DELETE` handler with authentication check.
   - Parse and validate request body.
   - Execute deletion queries in correct order (respecting foreign key constraints).
   - Call Edge Function to delete auth user.

4. **Add Types**
   - Add `DeleteAccountCommand` to `src/types.ts` if not already present.
   - Add `SUPABASE_FUNCTIONS_URL` to `src/env.d.ts` (optional).

5. **Deploy Edge Function**
   ```bash
   npx supabase functions deploy delete-account
   ```

6. **Testing**
   - Test with invalid confirmation string (expect 400).
   - Test without authentication (expect 401).
   - Test successful deletion flow.
   - Verify all related data is removed from database.
   - Verify user cannot log in after deletion.

## 11. Local Development

To test locally with Supabase running in Docker:

```bash
# Terminal 1: Start local Supabase
npx supabase start

# Terminal 2: Serve Edge Functions locally
npx supabase functions serve

# Terminal 3: Run Astro app
npm run dev
```
