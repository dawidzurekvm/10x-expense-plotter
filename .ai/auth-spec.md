# Authentication Specification

## Overview
This document outlines the technical specification for implementing user authentication (Registration, Login, Password Recovery, Account Deletion) using Supabase Auth in the 10x Expense Plotter application. The implementation will leverage Astro's Server-Side Rendering (SSR) capabilities and React for client-side interactivity.

## 1. User Interface Architecture

### 1.1. Pages & Routes
New pages will be added to handle authentication flows. All existing application pages will become protected routes.

| Path | Type | Access | Description |
|------|------|--------|-------------|
| `/login` | Astro Page | Public | Login form. Redirects to `/` on success. |
| `/register` | Astro Page | Public | Registration form. Redirects to `/` (or confirmation pending) on success. |
| `/forgot-password` | Astro Page | Public | Form to request a password reset link via email. |
| `/reset-password` | Astro Page | Public | Form to input new password. Accessed via email link. |
| `/auth/callback` | API Route | Public | Handles OAuth/MagicLink callbacks and exchanges codes for sessions. |
| `/settings` | Astro Page | **Protected** | User settings (profile, account management). Contains account deletion option. |
| `/` (and others) | Astro Page | **Protected** | Main application. Redirects to `/login` if unauthenticated. |

### 1.2. Layouts
*   **`AuthLayout.astro`** (New): A simplified layout for auth pages.
    *   **Structure**: Centered card layout on a neutral background.
    *   **Content**: No navigation bar, no sidebar. Just the branding (Logo/Title) and the form slot.
*   **`Layout.astro`** (Existing): The main application layout.
    *   **Changes**: Will now assume an authenticated context (user data available via middleware/locals).

### 1.3. Components (Client-Side React)
Located in `src/components/auth/`.

*   **`LoginForm.tsx`**
    *   **Fields**: Email, Password.
    *   **Actions**: `signInWithPassword`.
    *   **State**: Loading, Error (invalid credentials).
    *   **Validation**: Zod schema (email format, password required).
*   **`RegisterForm.tsx`**
    *   **Fields**: Email, Password, Confirm Password.
    *   **Actions**: `signUp`.
    *   **State**: Loading, Error (user exists), Success (check email message).
    *   **Validation**: Zod schema (password strength, match confirmation).
*   **`ForgotPasswordForm.tsx`**
    *   **Fields**: Email.
    *   **Actions**: `resetPasswordForEmail`.
    *   **State**: Loading, Success (email sent).
*   **`ResetPasswordForm.tsx`**
    *   **Fields**: New Password, Confirm New Password.
    *   **Actions**: `updateUser`.
    *   **Context**: Requires a valid session (handled by the link flow).
*   **`UserMenu.tsx`** (Existing in `AppHeader`)
    *   **Changes**: Add "Sign Out" action. Add "Settings" navigation link (links to `/settings`).
*   **`SettingsPage`** (New)
    *   **Path**: `/settings`
    *   **Components**: Profile display, "Danger Zone" section with "Delete Account" button.
*   **`DeleteAccountDialog.tsx`**
    *   **Location**: Used in `SettingsPage`.
    *   **Type**: Alert Dialog (destructive).
    *   **Content**: Warning about permanent data loss.
    *   **Action**: Calls API to delete account.

### 1.4. UX & Validation
*   **Validation**: Use `zod` + `react-hook-form` for instant feedback.
*   **Error Handling**:
    *   Display user-friendly error messages from Supabase (e.g., "Invalid login credentials").
    *   Handle rate limiting or network errors gracefully.
*   **Redirects**:
    *   Authenticated user visiting `/login` -> Redirect to `/`.
    *   Unauthenticated user visiting `/` -> Redirect to `/login`.

## 2. Backend Logic

### 2.1. Server-Side Rendering (SSR) & Middleware
The application uses Astro in `server` mode. We must implement robust session handling.

*   **Middleware (`src/middleware/index.ts`)**:
    *   **Responsibility**:
        1.  Create a Supabase Server Client (using `@supabase/ssr`) for every request.
        2.  Refresh expired sessions automatically.
        3.  Protect routes: Check `supabase.auth.getUser()`.
        4.  Inject `user` and `supabase` client into `context.locals`.
    *   **Logic**:
        *   Define `PUBLIC_ROUTES` = `['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback']`.
        *   If request path is NOT public and user is null -> Redirect to `/login`.
        *   If request path IS public (like login) and user is present -> Redirect to `/`.

### 2.2. API Endpoints (`src/pages/api/`)
*   **`auth/callback.ts`** (GET):
    *   Handles the PKCE auth code exchange.
    *   Redirects user to `/` after setting the session cookie.
*   **`auth/signout.ts`** (POST):
    *   Server-side sign-out to clear cookies effectively.
*   **`auth/user.ts`** (DELETE):
    *   **Purpose**: Permanently delete the user account (US-025).
    *   **Security**: Protected route (requires valid session).
    *   **Implementation**:
        *   Requires `SUPABASE_SERVICE_ROLE_KEY` (Environment Variable) to bypass RLS constraints if standard deletion isn't allowed, or simply use the Admin API `deleteUser(id)`.
        *   Perform cleanup of data if not handled by `ON DELETE CASCADE` (Database handles cascade).

### 2.3. Environment Variables
Ensure `.env` contains:
*   `PUBLIC_SUPABASE_URL`
*   `PUBLIC_SUPABASE_ANON_KEY`
*   `SUPABASE_SERVICE_ROLE_KEY` (New - for account deletion/admin tasks)

## 3. Authentication System (Supabase)

### 3.1. Configuration
*   **Library**: Replace generic usages with `@supabase/ssr` package for better Astro integration.
*   **Client Types**:
    *   **Browser Client**: For `LoginForm`, `RegisterForm` (interactivity).
    *   **Server Client**: For Middleware and API routes (cookie handling).

### 3.2. Flows
*   **Registration**: `supabase.auth.signUp({ email, password })`.
*   **Login**: `supabase.auth.signInWithPassword({ email, password })`.
*   **Logout**: `supabase.auth.signOut()`.
*   **Password Reset**:
    1.  User requests link: `supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })`.
    2.  User clicks link -> Supabase redirects to `/auth/callback` (exchanges code) -> Redirects to `/reset-password`.
    3.  User sets new password: `supabase.auth.updateUser({ password })`.

### 3.3. Dependencies
*   Add `@supabase/ssr` to `package.json`.
*   Ensure `react-hook-form` and `zod` are available (already present).

## 4. Implementation Roadmap

1.  **Setup**: Install `@supabase/ssr`, configure `SUPABASE_SERVICE_ROLE_KEY`.
2.  **Helpers**: Create `src/lib/supabase.ts` to export `createBrowserClient` and `createServerClient` helpers.
3.  **Middleware**: Update `src/middleware/index.ts` to enforce auth.
4.  **Pages & Layouts**: Create `AuthLayout`, auth page shells, and `Settings` page.
5.  **Forms**: Implement the React form components with validation.
6.  **Account Deletion**: Implement the DELETE API route.
7.  **Integration**: Wire up the forms to the pages and test flows.

