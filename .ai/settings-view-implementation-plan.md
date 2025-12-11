# View Implementation Plan: Settings View

## 1. Overview
The Settings View serves as the central hub for user account management. It allows users to manage their "Wallet" (specifically the Starting Balance), "Account" credentials (password update), and "Data & Privacy" preferences (CSV export and account deletion). The view is protected and requires authentication.

## 2. View Routing
- **URL Path:** `/settings`
- **File Path:** `src/pages/settings.astro`
- **Protection:** Protected route (requires valid session). Redirects to `/login` if unauthenticated.

## 3. Dependencies
- **Delete Account Endpoint:** See `.ai/delete-account-endpoint-implementation-plan.md` for the backend API that must be implemented to support account deletion.
- **Shadcn Tabs Component:** Must be installed via `npx shadcn@latest add tabs` before implementation.

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
            │       └── StartingBalanceForm (Reused/Refactored)
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
- **Example Structure:**
  ```tsx
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
  
  export function SettingsPage({ initialStartingBalance }: SettingsPageProps) {
    return (
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <Tabs defaultValue="wallet">
          <TabsList>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="privacy">Data & Privacy</TabsTrigger>
          </TabsList>
          <TabsContent value="wallet">
            <WalletSettings initialStartingBalance={initialStartingBalance} />
          </TabsContent>
          <TabsContent value="account">
            <AccountSettings />
          </TabsContent>
          <TabsContent value="privacy">
            <PrivacySettings />
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  ```

### `WalletSettings` (`src/components/settings/WalletSettings.tsx`)
- **Description:** Layout wrapper for wallet-related settings.
- **Main Elements:** `Card`, `CardHeader`, `CardContent` containing `StartingBalanceForm`.
- **Purpose:** Provides context and layout for the form.

### `StartingBalanceForm` (Refactor/Reuse `src/components/dashboard/StartingBalanceForm.tsx`)
- **Description:** Form to upsert the starting balance.
- **Main Elements:**
  - `Form` (react-hook-form)
  - `DatePicker` (Effective Date)
  - `Input` (Amount, type="number", step="0.01")
  - `Button` (Save)
- **Handled Interactions:**
  - `onSubmit`: Calls `startingBalanceService.upsertStartingBalance`.
- **Validation:**
  - `amount`: Required, Positive, Max 2 decimals.
  - `effective_date`: Required, Valid date.
- **Types:** `UpsertStartingBalanceCommand`.

### `AccountSettings` (`src/components/settings/AccountSettings.tsx`)
- **Description:** Wrapper for account security settings.
- **Main Elements:** `Card` containing `ChangePasswordForm`.

### `ChangePasswordForm` (`src/components/settings/ChangePasswordForm.tsx`)
- **Description:** Form to update the user's password.
- **Main Elements:**
  - `Input` (New Password)
  - `Input` (Confirm Password)
  - `Button` (Update Password)
- **Handled Interactions:**
  - `onSubmit`: Calls `supabase.auth.updateUser({ password })`.
- **Validation:**
  - Min length (e.g., 6 chars).
  - Passwords must match.
- **State:** `isLoading`, `successMessage`, `errorMessage`.

### `PrivacySettings` (`src/components/settings/PrivacySettings.tsx`)
- **Description:** Container for Data & Privacy actions.
- **Main Elements:** Stack containing `ExportDataCard` and `DeleteAccountCard`.

### `ExportDataCard` (`src/components/settings/ExportDataCard.tsx`)
- **Description:** Card allowing users to download their data.
- **Main Elements:**
  - `DatePickerWithRange` (Optional: From/To dates)
  - `Select` (Optional: Entry Type filter)
  - `Button` ("Download CSV")
- **Handled Interactions:**
  - `onClick`: Constructs URL `/api/export/csv?from=...&to=...` and triggers download (or uses `window.open`).

### `DeleteAccountCard` (`src/components/settings/DeleteAccountCard.tsx`)
- **Description:** High-friction area for account deletion.
- **Main Elements:**
  - `Card` (Destructive styling hint)
  - `Button` (Trigger: "Delete Account", Variant: Destructive)
  - `DeleteAccountDialog` (Child component).

### `DeleteAccountDialog` (`src/components/settings/DeleteAccountDialog.tsx`)
- **Description:** Modal confirming account deletion.
- **Main Elements:**
  - `AlertDialog`
  - `Label`: "Type DELETE MY ACCOUNT to confirm"
  - `Input`: Validation text field.
  - `AlertDialogAction`: Disabled until input matches.
- **Handled Interactions:**
  - `onConfirm`: POST to `/api/account` (DELETE method not supported by HTML forms, so use fetch DELETE).
  - On success: `supabase.auth.signOut()` and redirect to `/`.

## 6. Types

### View Models & Props
- **`SettingsPageProps`**:
  ```typescript
  interface SettingsPageProps {
    initialStartingBalance?: StartingBalanceDTO | null;
  }
  ```

- **`ExportDataState`**:
  ```typescript
  interface ExportDataState {
    dateRange: DateRange | undefined;
    entryType: EntryType | 'all';
  }
  ```

### DTOs (Existing in `src/types.ts`)
- `UpsertStartingBalanceCommand`
- `StartingBalanceDTO`
- `DeleteAccountCommand` (`{ confirmation: "DELETE MY ACCOUNT" }`)

## 7. State Management
- **Global Auth State:** Uses existing auth hooks/context to get `userId` or Supabase client.
- **Starting Balance:** Uses `useQuery` or `useEffect` to fetch if not passed as prop, or manages local form state initialized by prop.
- **Forms:** Managed via `react-hook-form` + `zod` resolvers.
- **Async Status:** Local `useState` for `isSubmitting`, `error`, `success` messages within each card/form.

## 8. API Integration

### 1. Starting Balance
- **Endpoint:** `PUT /api/starting-balance`
- **Request:** `UpsertStartingBalanceCommand`
- **Response:** `StartingBalanceDTO`

### 2. Export Data
- **Endpoint:** `GET /api/export/csv`
- **Params:** `from_date`, `to_date`, `entry_type`
- **Action:** Browser navigation or Blob download.

### 3. Change Password
- **Client SDK:** `supabase.auth.updateUser({ password: ... })`
- **Note:** Does not use our internal API proxy, interacts directly with Supabase Auth.

### 4. Delete Account
- **Endpoint:** `DELETE /api/account`
- **Request:** `DeleteAccountCommand`
- **Headers:** `Content-Type: application/json`
- **Response:** `{ message: string }`

## 9. User Interactions
1.  **Navigate to Settings:** Click "Settings" in User Menu -> Load `/settings`.
2.  **Update Balance:** Switch to Wallet tab -> Edit amount/date -> Click Save -> Show toast success -> Update projection (if cached).
3.  **Change Password:** Switch to Account tab -> Enter new password twice -> Click Update -> Show toast success.
4.  **Export Data:** Switch to Privacy tab -> Select Range (optional) -> Click Export -> Browser downloads file.
5.  **Delete Account:** Privacy tab -> Click Delete -> Modal opens -> Type confirmation -> Click Confirm -> App redirects to Login.

## 10. Conditions and Validation
- **Starting Balance:**
  - Prevent submission if amount < 0.
  - Prevent submission if date is invalid.
  - Show field errors inline.
- **Password:**
  - `newPassword === confirmPassword`.
  - `newPassword.length >= 6`.
- **Delete Account:**
  - Confirmation button **disabled** until input value strictly equals "DELETE MY ACCOUNT".

## 11. Error Handling
- **API Errors (4xx/5xx):** Display using `sonner` toast notifications (e.g., "Failed to update balance").
- **Validation Errors:** Displayed via `FormMessage` components in Shadcn forms.
- **Auth Errors:** Redirect to login if 401 received during API calls.

## 12. Implementation Steps

1.  **Install Shadcn Tabs Component**
    - Run: `npx shadcn@latest add tabs`
    - This creates `src/components/ui/tabs.tsx`

2.  **Frontend: Setup Page**
    - Create `src/pages/settings.astro`.
    - Apply `DashboardLayout` **with `client:load` directive**.
    - Fetch initial starting balance server-side.
    - **⚠️ CRITICAL:** Ensure `SettingsPage` uses `client:load`:
      ```astro
      ---
      import Layout from "../layouts/Layout.astro";
      import { DashboardLayout } from "../components/layout/DashboardLayout";
      import { SettingsPage } from "../components/settings/SettingsPage";
      // ... fetch starting balance ...
      ---
      <Layout title="Settings">
        <DashboardLayout client:load user={user}>
          <SettingsPage client:load initialStartingBalance={startingBalance} />
        </DashboardLayout>
      </Layout>
      ```

3.  **Frontend: Create Components**
    - Create folder `src/components/settings`.
    - Implement `SettingsPage.tsx` using `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs`.
    - Implement `WalletSettings.tsx` reusing/adapting `StartingBalanceForm`.
    - Implement `ChangePasswordForm.tsx` with Zod validation.
    - Implement `ExportDataCard.tsx` with date range picker.
    - Implement `DeleteAccountDialog.tsx` and `DeleteAccountCard.tsx`.

4.  **Integration**
    - Connect components to `src/pages/settings.astro`.
    - Ensure `StartingBalanceForm` correctly calls the `PUT` endpoint.
    - Connect `DeleteAccountDialog` to the `DELETE /api/account` endpoint.

5.  **Testing**
    - **First verify tabs work:** Click each tab and confirm content switches.
    - Verify flow: Login -> Settings -> Update Balance -> Verify persistence.
    - Verify flow: Export CSV -> Check file content.
    - Verify flow: Delete Account -> Type wrong string (blocked) -> Type correct string -> Account deleted & Logout.

## 13. Common Issues & Troubleshooting

### Tabs Not Working (Clicks Do Nothing)

**Symptom:** Clicking on tab triggers does nothing; the content doesn't switch.

**Cause:** React components in Astro are rendered as static HTML by default. Without hydration, no JavaScript runs, so event handlers don't work.

**Solution:** Add `client:load` directive to all interactive React components in the Astro page:

```astro
<!-- ❌ WRONG - No hydration, tabs won't work -->
<SettingsPage initialStartingBalance={startingBalance} />

<!-- ✅ CORRECT - Component is hydrated, tabs will work -->
<SettingsPage client:load initialStartingBalance={startingBalance} />
```

### Tabs Component Not Found

**Symptom:** Import error for `@/components/ui/tabs`.

**Solution:** Install the tabs component:
```bash
npx shadcn@latest add tabs
```