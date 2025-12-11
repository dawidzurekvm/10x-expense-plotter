# View Implementation Plan: Settings View

## 1. Overview
The Settings View serves as the central hub for user account management. It allows users to manage their "Wallet" (specifically the Starting Balance), "Account" credentials (password update), and "Data & Privacy" preferences (CSV export and account deletion). The view is protected and requires authentication.

## 2. View Routing
- **URL Path:** `/settings`
- **File Path:** `src/pages/settings.astro`
- **Protection:** Protected route (requires valid session). Redirects to `/login` if unauthenticated.

## 3. Dependencies
- **Delete Account Endpoint:** See `.ai/delete-account-endpoint-implementation-plan.md` for the backend API that must be implemented to support account deletion.
- **Shadcn Components:** Tabs (`npx shadcn@latest add tabs`), AlertDialog, Card, Select, Input, Button, Label

## 4. Component Structure

> **⚠️ CRITICAL: Astro Hydration Requirement**
> 
> React components in Astro are **server-rendered as static HTML by default** and will not be interactive unless hydrated. The `SettingsPage` component (and any interactive React component) **MUST** use the `client:load` directive in the Astro page to enable client-side JavaScript.
>
> Without `client:load`, clicking tabs will do nothing because the JavaScript event handlers are not attached.

```text
src/pages/settings.astro (Page/Layout Root)
└── DashboardLayout client:load (Existing Layout - MUST have client directive)
    └── SettingsPage client:load (Container - MUST have client directive)
        ├── PageHeader (Title: "Settings")
        └── Tabs (from @/components/ui/tabs)
            ├── TabsList
            │   ├── TabsTrigger (value="wallet")
            │   ├── TabsTrigger (value="account")
            │   └── TabsTrigger (value="privacy")
            ├── TabsContent (value="wallet")
            │   └── WalletSettings
            │       └── (inline form, not separate StartingBalanceForm)
            ├── TabsContent (value="account")
            │   └── AccountSettings
            │       └── ChangePasswordForm
            └── TabsContent (value="privacy")
                └── PrivacySettings
                    ├── ExportDataCard
                    └── DeleteAccountCard
                        └── DeleteAccountDialog
```

## 5. Component Details

### `SettingsPage` (`src/components/settings/SettingsPage.tsx`)
- **Description:** Main React container for the settings logic. Uses Radix UI Tabs (via shadcn) which manages active tab state internally.
- **Main Elements:** `div` container, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` (all from `@/components/ui/tabs`).
- **Props:** `initialStartingBalance` (optional, passed from Astro Server).
- **Implementation Notes:**
  - Uses `container mx-auto max-w-4xl` for layout
  - TabsList uses `grid grid-cols-3` for equal-width tabs

### `WalletSettings` (`src/components/settings/WalletSettings.tsx`)
- **Description:** Card wrapper containing the starting balance form.
- **Main Elements:** `Card`, `CardHeader`, `CardContent`, inline form with react-hook-form.
- **Implementation Notes:**
  - Form is implemented inline (not as a separate `StartingBalanceForm` component)
  - Uses native `<input type="date">` instead of a DatePicker component
  - Calls `PUT /api/starting-balance` endpoint
  - Currency hardcoded as "PLN"
- **Validation Schema:**
  ```typescript
  const startingBalanceFormSchema = z.object({
    amount: z.number()
      .min(0, "Amount cannot be negative")
      .max(9999999999.99, "Amount is too large"),
    effective_date: z.string().min(1, "Date is required"),
  });
  ```

### `AccountSettings` (`src/components/settings/AccountSettings.tsx`)
- **Description:** Wrapper for account security settings.
- **Main Elements:** `Card` containing `ChangePasswordForm`.

### `ChangePasswordForm` (`src/components/settings/ChangePasswordForm.tsx`)
- **Description:** Form to update the user's password.
- **Main Elements:**
  - `Input` (New Password, type="password")
  - `Input` (Confirm Password, type="password")
  - `Button` (Update Password)
- **Handled Interactions:**
  - `onSubmit`: Calls `POST /api/auth/change-password` (server-side API route)
- **Validation:**
  - Min length: 6 characters
  - Passwords must match (using Zod `.refine()`)
- **State:** `isLoading`, uses `reset()` on success
- **Implementation Note:** Uses a server-side API endpoint instead of direct Supabase client SDK call for better security.

### `PrivacySettings` (`src/components/settings/PrivacySettings.tsx`)
- **Description:** Container for Data & Privacy actions.
- **Main Elements:** Stack (`div` with `space-y-6`) containing `ExportDataCard` and `DeleteAccountCard`.

### `ExportDataCard` (`src/components/settings/ExportDataCard.tsx`)
- **Description:** Card allowing users to download their data as CSV.
- **Main Elements:**
  - Two native `<input type="date">` fields (From/To dates) - **NOT DatePickerWithRange**
  - `Select` (Entry Type filter: all/income/expense)
  - `Button` ("Download CSV")
- **Handled Interactions:**
  - `onClick`: Constructs URL `/api/export/csv?from_date=...&to_date=...&entry_type=...`
  - Downloads via Blob and programmatic link click
  - Filename format: `expense-plotter-export-YYYY-MM-DD.csv`
- **State:** `isExporting`, `fromDate`, `toDate`, `entryType`

### `DeleteAccountCard` (`src/components/settings/DeleteAccountCard.tsx`)
- **Description:** High-friction area for account deletion.
- **Main Elements:**
  - `Card` (with `border-destructive/50` styling)
  - `CardTitle` (with `text-destructive` class)
  - `Button` (Trigger: "Delete Account", Variant: Destructive)
  - `DeleteAccountDialog` (Child component, controlled via `isDialogOpen` state)

### `DeleteAccountDialog` (`src/components/settings/DeleteAccountDialog.tsx`)
- **Description:** Modal confirming account deletion with high-friction confirmation.
- **Main Elements:**
  - `AlertDialog` (controlled component with `open`/`onOpenChange` props)
  - `AlertDialogHeader` with warning message and bullet list of data to be deleted
  - `Label`: "Type DELETE MY ACCOUNT to confirm"
  - `Input`: Validation text field
  - `AlertDialogAction`: Disabled until input matches, styled with destructive colors
- **Handled Interactions:**
  - `onConfirm`: `DELETE /api/account` with `{ confirmation: "DELETE MY ACCOUNT" }`
  - On success: `supabase.auth.signOut()` via `createSupabaseBrowserClient()`, then redirect to `/`
- **State:** `confirmationInput`, `isDeleting`

## 6. Types

### View Models & Props (in `src/types.ts`)
- **`SettingsPageProps`**:
  ```typescript
  interface SettingsPageProps {
    initialStartingBalance?: StartingBalanceDTO | null;
  }
  ```

- **`DeleteAccountCommand`**:
  ```typescript
  interface DeleteAccountCommand {
    confirmation: "DELETE MY ACCOUNT";
  }
  ```

- **`DeleteAccountResponseDTO`**:
  ```typescript
  interface DeleteAccountResponseDTO {
    message: string;
  }
  ```

### DTOs (Existing in `src/types.ts`)
- `UpsertStartingBalanceCommand`
- `StartingBalanceDTO`

### Notes on Types
- `ExportDataState` type from original plan was **NOT** needed - component uses local `useState` hooks directly

## 7. State Management
- **Global Auth State:** Uses existing auth hooks/context to get `userId` or Supabase client.
- **Starting Balance:** Initialized via `initialStartingBalance` prop from Astro server-side fetch.
- **Forms:** Managed via `react-hook-form` + `zod` resolvers.
- **Async Status:** Local `useState` for `isLoading`/`isSubmitting`, `error` messages via `sonner` toasts.

## 8. API Integration

### 1. Starting Balance
- **Endpoint:** `PUT /api/starting-balance`
- **Request:** `UpsertStartingBalanceCommand`
- **Response:** `StartingBalanceDTO`

### 2. Export Data
- **Endpoint:** `GET /api/export/csv`
- **Query Params:** `from_date`, `to_date`, `entry_type`
- **Response:** CSV file with `Content-Disposition: attachment` header
- **Notes:**
  - If `from_date` not provided, defaults to starting balance effective date
  - If `to_date` not provided, defaults to current date + 10 years

### 3. Change Password
- **Endpoint:** `POST /api/auth/change-password`
- **Request:** `{ newPassword: string }`
- **Response:** `{ success: true }` or `{ error: string }`
- **Implementation:** Server-side API route that calls `supabase.auth.updateUser({ password })`
- **Note:** Original plan specified direct Supabase client SDK call, but implementation uses server-side API for better security

### 4. Delete Account
- **Endpoint:** `DELETE /api/account`
- **Request:** `DeleteAccountCommand`
- **Response:** `DeleteAccountResponseDTO`
- **Implementation Details:**
  1. Validates confirmation string via Zod schema (`account.validation.ts`)
  2. Deletes user data in order: `series_exceptions` → `entry_series` → `starting_balances` → `analytics_events`
  3. Calls Supabase Edge Function `delete-account` to delete auth user
  4. Edge Function uses service role key to call `auth.admin.deleteUser()`

## 9. Validation Files

### `src/lib/validation/account.validation.ts`
```typescript
export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT", {
    errorMap: () => ({
      message: 'Confirmation must be exactly "DELETE MY ACCOUNT"',
    }),
  }),
}) satisfies z.ZodSchema<DeleteAccountCommand>;
```

### `src/lib/validation/export.validation.ts`
- Validates `from_date`, `to_date` (optional, YYYY-MM-DD format)
- Validates `entry_type` (optional, "income" | "expense")

## 10. User Interactions
1.  **Navigate to Settings:** Click "Settings" in User Menu → Load `/settings`.
2.  **Update Balance:** Switch to Wallet tab → Edit amount/date → Click Save → Show toast success.
3.  **Change Password:** Switch to Account tab → Enter new password twice → Click Update → Show toast success → Form resets.
4.  **Export Data:** Switch to Privacy tab → Select Range (optional) → Click Export → Browser downloads file.
5.  **Delete Account:** Privacy tab → Click Delete → Modal opens → Type confirmation → Click Confirm → Account deleted → Redirected to `/`.

## 11. Conditions and Validation
- **Starting Balance:**
  - Amount must be ≥ 0
  - Amount max: 9999999999.99
  - Date is required (validated via Zod string min length)
  - Show field errors inline via `<p className="text-sm text-destructive">`
- **Password:**
  - `newPassword.length >= 6`
  - `newPassword === confirmPassword` (Zod refine)
- **Delete Account:**
  - Confirmation button **disabled** until input strictly equals "DELETE MY ACCOUNT"
  - Server-side validation also requires exact literal match

## 12. Error Handling
- **API Errors (4xx/5xx):** Display using `sonner` toast notifications (`toast.error()`)
- **Validation Errors:** Displayed inline via conditional `<p>` elements with `text-destructive` class
- **Auth Errors:** Handled by middleware redirect to `/login`

## 13. File Structure

```
src/
├── components/
│   └── settings/
│       ├── index.ts                  (barrel exports)
│       ├── SettingsPage.tsx         
│       ├── WalletSettings.tsx       
│       ├── AccountSettings.tsx      
│       ├── ChangePasswordForm.tsx   
│       ├── PrivacySettings.tsx      
│       ├── ExportDataCard.tsx       
│       ├── DeleteAccountCard.tsx    
│       └── DeleteAccountDialog.tsx  
├── lib/
│   ├── services/
│   │   └── export.service.ts        
│   └── validation/
│       ├── account.validation.ts    
│       └── export.validation.ts     
├── pages/
│   ├── settings.astro               
│   └── api/
│       ├── account.ts                (DELETE endpoint)
│       ├── auth/
│       │   └── change-password.ts    (POST endpoint)
│       └── export/
│           └── csv.ts                (GET endpoint)
└── types.ts                          (DeleteAccountCommand, DeleteAccountResponseDTO)

supabase/
└── functions/
    └── delete-account/
        └── index.ts                  (Edge Function for auth user deletion)
```
