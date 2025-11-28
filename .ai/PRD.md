# Product Requirements Document (PRD) - 10x Expense Plotter

## 1. Product Overview

10x Expense Plotter is a minimal, privacy-conscious web app that enables Polish households to track incomes and expenses (one-time and recurring), then project their account balance across time to plan bigger purchases and vacations with confidence.

Personas
- Married couple managing a shared household budget with one shared login.
- Single adult planning larger purchases and monthly spending discipline.

Value proposition
- Rapid entry of incomes and expenses with simple recurrence.
- Deterministic balance projection on a specific date (without complex charts for MVP; may add later).
- One wallet and one starting balance to keep cognitive load low.

Scope summary
- CRUD for incomes and expenses (one-time, weekly, monthly with optional end date).
- Single wallet and single starting balance with effective date.
- Projection engine for dates up to 10 years forward and back to the starting balance date.
- Hard delete only; series edit options for occurrence, future, or entire series.
- Authentication via Supabase email+password with password reset.
- CSV export and account deletion for GDPR/RODO.

Tech, hosting, and compliance constraints
- Tech stack: Astro 5, TypeScript 5, React 19, Tailwind 4, shadcn/ui; Supabase (EU region, e.g., eu-central).
- Currency: PLN only; pl-PL display; two-decimal rounding; users input positive numbers with type determining sign.
- Time: Date-only entries; Europe/Warsaw timezone; computations over whole days.
- GDPR/RODO: EU data residency, DPA signed; Polish Privacy Policy and Terms of Service.

Principles and assumptions
- Simplicity over breadth: single wallet, single currency, deterministic computation.
- No onboarding tour; users land on Projection with empty states and a clear CTA to add income/expense.
- No rate limiting or session timeout for MVP (may add later).


## 2. User Problem

Manual budgeting in spreadsheets is time-consuming and error-prone, which discourages consistent updates. Users want a fast way to record income/expense items and immediately see their projected balance on specific dates to plan bigger purchases or vacations. The MVP addresses this by streamlining CRUD for incomes/expenses, offering simple recurrence, and providing a deterministic projection to a target date without complex analytics.


## 3. Functional Requirements

FR-1 Authentication and access
- Email+password authentication using Supabase. Password reset via email.
- No rate limiting or session timeout in MVP.
- All app pages require authentication; one shared login per household is supported.

FR-2 Wallet and balance model
- One wallet per account.
- Single starting balance with an effective date; balance changes occur via normal income/expense entries only.
- Users can create and update the single starting balance record (value and date).

FR-3 Currency and formatting
- PLN only, displayed with pl-PL locale formatting and two decimal places.
- Users always input amounts as positive decimals with up to two fractional digits; the entry type determines the sign (income adds; expense subtracts).
- All calculations use two-decimal rounding at the item level and at final sums to prevent floating errors.

FR-4 Time handling
- Date-only fields for entries; no time-of-day.
- Europe/Warsaw timezone; compute over whole days.
- On a selected projection date D, include entries scheduled on D (inclusive).

FR-5 Entries: types and CRUD
- Entries may be one-time or recurring.
- Supported recurrence: weekly (by weekday) and monthly (by day-of-month).
- Optional end date for recurring series; without end date, the series is open-ended.
- Short-month clamping: for monthly recurrence, if the target month has fewer days than the series’ anchor day, schedule on the last valid day of that month (e.g., 31st -> 30th/29th/28th as appropriate; 29th handles leap years by clamping to 29 in leap years and 28 otherwise).
- Users can create, read, update, and delete entries.

FR-6 Series editing and exceptions
- Edit granularity: this occurrence, this and future occurrences, or the entire series.
- Without soft-delete, occurrence-specific edits are stored as exceptions for that date:
  - Skip exception (occurrence removed on that date).
  - Override exception (occurrence attributes replaced for that date).
- For “this and future” split effective parameters for future dates from the selected occurrence date onward.

FR-7 Deletion behavior
- Hard delete only.
- Deleting a one-time entry removes it permanently.
- Deleting a single occurrence in a series creates a skip exception for that date.
- Deleting “this and future occurrences” ends or splits the series accordingly from the selected date.
- Deleting “entire series” removes the base series and all related exceptions.

FR-8 Projection engine
- Deterministic computation: Balance(D) = StartingBalance + Sum(incomes up to and including D) − Sum(expenses up to and including D), where expansions of recurrence and applied exceptions are considered.
- Range: up to 10 years forward from the current date and back to the starting balance effective date. If the starting balance date is in the future, projection begins at that date.
- Performance goal: Projection recomputation for a target date within 1 second for up to 1,000 active series and reasonable exception counts.

FR-9 Projection UI
- Landing screen is the Projection view with an empty state when there are no entries and a prominent “Add income/expense” CTA linking to CRUD.
- Date selector lets users pick any date within the allowed range, defaulting to today if within range or to the starting balance date otherwise.
- Display the projected balance for the selected date and a simple contextual list of entries around that date as needed for clarity. No advanced charts in MVP.

FR-10 Validation rules
- Amount: positive number with up to two decimals; required.
- Type: income or expense; required.
- Date fields: valid calendar dates; start date required; end date optional but must be on or after start date if provided.
- Title: required, up to 120 characters. Description: optional, up to 500 characters.
- Recurrence: weekly (weekday) or monthly (day-of-month); enforce monthly clamping rules.
- Prevent duplicate submission on double-click (client-side guard).

FR-11 Error handling
- Use form-level and field-level error messages explaining what failed and how to fix it.
- For projection out-of-range requests, show a clear message and prompt to pick an in-range date.

FR-12 CSV export
- Export transactions as expanded occurrences over a user-selected date range; default to full available range from starting balance date to 10 years ahead of the current date.
- CSV columns: occurrence_id, series_id (nullable), type (income|expense), title, description, date (YYYY-MM-DD), amount_pln (signed, two decimals), created_at, updated_at.
- Export is downloadable by the authenticated user only.

FR-13 Account deletion
- Authenticated users can permanently delete their account and all associated data.
- Action requires clear confirmation flow and final confirmation prompt.

FR-14 Policies and compliance
- Host in Supabase EU region; sign DPA with Supabase.
- Publish Polish-language Privacy Policy and Terms of Service. Provide links in the app.
- Implement data export (CSV) and account deletion to support GDPR data subject rights.

FR-15 Telemetry and metrics instrumentation
- Instrument events: entry_created, entry_updated, entry_deleted, projection_viewed.
- Retain basic metadata: user_id, timestamp, entry_type, recurrence_type, and selection for edit scope (occurrence/future/entire).
- Use the chosen analytics tool (Supabase) with 4-week retention minimum for MVP.

FR-16 Accessibility and i18n
- UI in Polish for MVP. Ensure basic keyboard navigation and sufficient contrast.

FR-17 Non-functional
- Availability target: 99% for MVP.
- Security: rely on Supabase authentication; HTTPS enforced; no public data leakage.
- Performance target: P95 projection compute under 1s with the defined scale; basic caching permitted.


## 4. Product Boundaries

In scope
- One wallet, single PLN currency, and one starting balance with effective date.
- CRUD for income/expense entries with weekly and monthly recurrence, optional end date, and monthly day clamping.
- Deterministic projection for a selected date within the defined range.
- Series edit granularity (occurrence, future, entire) with hard delete semantics and stored exceptions.
- Authentication with password reset; CSV export; account deletion; Polish Policies/ToS; EU hosting.

Out of scope for MVP
- Multiple wallets; multiple currencies; currency conversion.
- Categories, tags, or envelope budgeting.
- Advanced charts or budget analytics beyond a simple projection display.
- Credit or debt modeling; loan amortization; future interest.
- Sharing budgets between multiple accounts or granular permissions.
- Mobile apps; native push notifications; in-app onboarding wizard.
- Rate limiting, session timeouts, and MFA (may be added later).

Open questions to track (implementation notes)
- Occurrence-only edits and storage: use explicit exception records (skip/override) keyed by series and date. Confirm exact schema during implementation.
- CSV export window defaults to full available range; UI offers date range selection. Confirm performance for very long expansions.
- Analytics stack choice: Supabase, retention settings, and basic dashboarding.
- Detailed validation limits and duplicate safeguards may be refined during implementation without changing user-visible behavior.
- Leap day handling is clamped by rule; confirm acceptance tests for series anchored on the 29th.


## 5. User Stories

US-001 Authentication: Sign up
- Description: As a user, I can create an account with email and password.
- Acceptance Criteria:
  - Given the sign-up form, when I provide a valid email and strong password, my account is created.
  - When the email is already in use, I see a clear error message.
  - After successful sign-up, I am signed in and redirected to Projection.

US-002 Authentication: Log in
- Description: As a user, I can log in with email and password.
- Acceptance Criteria:
  - Given valid credentials, I am authenticated and redirected to Projection.
  - Given invalid credentials, I see an error and remain on the login page.

US-003 Authentication: Log out
- Description: As a user, I can log out.
- Acceptance Criteria:
  - When I log out, my session ends and I am shown the login screen.

US-004 Authentication: Password reset
- Description: As a user, I can request a password reset link and set a new password.
- Acceptance Criteria:
  - Given my email, I can request a reset link and receive confirmation.
  - Using the link, I can set a new password and then log in.

US-005 Access control
- Description: As a user, I cannot access any app page without being authenticated.
- Acceptance Criteria:
  - Unauthenticated requests are redirected to login.

US-006 Starting balance: Create
- Description: As a user, I can set a single starting balance with an effective date.
- Acceptance Criteria:
  - The starting balance requires a decimal amount (two decimals) and a valid date.
  - Only one starting balance record exists; creating when none exists succeeds.
  - The projection earliest date is the starting balance effective date.

US-007 Starting balance: Update
- Description: As a user, I can update the starting balance value and effective date.
- Acceptance Criteria:
  - Updating replaces the single starting balance record.
  - Projection recomputes based on the updated record.

US-008 Starting balance: Validation
- Description: As a user, I am prevented from invalid starting balance inputs.
- Acceptance Criteria:
  - Amount must be a positive number with up to two decimals.
  - Date must be a valid calendar date.

US-009 Create one-time income
- Description: As a user, I can create a one-time income.
- Acceptance Criteria:
  - Required fields: title, amount, date; type = income.
  - Amount input is positive; the system adds it as income.

US-010 Create one-time expense
- Description: As a user, I can create a one-time expense.
- Acceptance Criteria:
  - Required fields: title, amount, date; type = expense.
  - Amount input is positive; the system subtracts it as expense.

US-011 Create monthly recurring income
- Description: As a user, I can create a monthly recurring income on a chosen day-of-month.
- Acceptance Criteria:
  - Start date defines the first occurrence and anchors the day-of-month.
  - Optional end date must be on or after start date.
  - For short months, schedule on the last valid day.

US-012 Create weekly recurring expense
- Description: As a user, I can create a weekly recurring expense on a specific weekday.
- Acceptance Criteria:
  - Select weekday; the series schedules on that weekday weekly.
  - Optional end date must be on or after start date.

US-013 Monthly clamping rules
- Description: As a user, I expect consistent scheduling for 29th/30th/31st across months.
- Acceptance Criteria:
  - A series anchored to the 31st occurs on 30th/29th/28th in months without the 31st.
  - A series anchored to the 29th occurs on 29th in leap years and 28th otherwise.

US-014 Recurrence end date validation
- Description: As a user, I cannot set an end date before the start date.
- Acceptance Criteria:
  - If end < start, form shows an error and blocks saving.

US-015 Edit: This occurrence only
- Description: As a user, I can edit a single occurrence without changing the series.
- Acceptance Criteria:
  - Choosing “this occurrence” creates an override exception for that date.
  - The override is reflected in projection and CSV export for that date only.

US-016 Edit: This and future
- Description: As a user, I can edit a series from a specific occurrence forward.
- Acceptance Criteria:
  - Choosing “this and future” splits effective parameters from that date onward.
  - Past occurrences remain unchanged; projection reflects the split behavior.

US-017 Edit: Entire series
- Description: As a user, I can edit all occurrences in a series.
- Acceptance Criteria:
  - Choosing “entire series” updates the base series; exceptions still apply.

US-018 Delete: Single occurrence
- Description: As a user, I can delete one occurrence of a series.
- Acceptance Criteria:
  - Choosing delete for a single date creates a skip exception for that date.
  - Projection and CSV exclude that occurrence.

US-019 Delete: This and future
- Description: As a user, I can delete occurrences from a specific date forward.
- Acceptance Criteria:
  - Choosing “this and future” ends or splits the series starting from that date.
  - Past occurrences remain unchanged.

US-020 Delete: Entire series
- Description: As a user, I can delete an entire series.
- Acceptance Criteria:
  - The base series and all exceptions are removed.
  - Projection and CSV reflect the deletion.

US-021 Projection: View balance on a date
- Description: As a user, I can select a date and view my projected balance.
- Acceptance Criteria:
  - The default date is today if within range, otherwise the starting balance date.
  - The projected balance includes entries up to and including the selected date.
  - Out-of-range selections prompt me to pick an allowed date.

US-022 Projection: Range limits
- Description: As a user, I cannot project beyond allowed dates.
- Acceptance Criteria:
  - Earliest date is the starting balance effective date.
  - Latest date is current date plus 10 years.

US-023 Amount input and rounding
- Description: As a user, I enter positive decimals and see consistent two-decimal rounding.
- Acceptance Criteria:
  - Inputs accept up to two decimal places.
  - Display and CSV round to two decimals using standard rounding.

US-024 CSV export
- Description: As a user, I can export all expanded transactions within a date range as CSV.
- Acceptance Criteria:
  - I can pick a date range; default is full available range.
  - CSV includes the defined columns and signed amounts.
  - Only authenticated users can export their own data.

US-025 Account deletion
- Description: As a user, I can permanently delete my account and data.
- Acceptance Criteria:
  - The flow requires explicit confirmation.
  - After deletion, I cannot log in and my data is no longer exportable.

US-026 Telemetry events
- Description: As a product team, we can measure key behaviors.
- Acceptance Criteria:
  - entry_created, entry_updated, entry_deleted, projection_viewed events are emitted with timestamps and minimal metadata.
  - Events are attributed to the authenticated user.

US-027 Validation: Positive amounts and type-determined sign
- Description: As a user, I cannot submit negative amounts; type decides sign.
- Acceptance Criteria:
  - Income always adds; expense always subtracts; UI prevents negative input.

US-028 Timezone and date-only handling
- Description: As a user, I see consistent behavior regardless of DST changes.
- Acceptance Criteria:
  - Europe/Warsaw timezone is applied.
  - Date-only logic prevents time-of-day and DST boundary issues.

US-029 Single wallet and access
- Description: As a household, we use one login and one wallet.
- Acceptance Criteria:
  - The app does not support multiple wallets or sharing between logins in MVP.

US-030 Error messages
- Description: As a user, I see clear validation and system error messages.
- Acceptance Criteria:
  - Field-level and form-level errors are visible and actionable.

US-031 Policies visibility
- Description: As a user, I can view Polish Privacy Policy and Terms of Service.
- Acceptance Criteria:
  - Footer or account menu contains links to Privacy Policy and ToS pages.

US-032 Session behavior
- Description: As a user, I stay logged in until I log out.
- Acceptance Criteria:
  - No automatic session timeout is enforced in MVP.


## 6. Success Metrics

Behavioral metrics
- Monthly update target: At least one new or updated spending or income item per user per calendar month.
- Retention: 4-week retention measurement based on active users returning within 28 days.

Instrumentation metrics
- Event coverage: Percentage of create/edit/delete entry actions captured; percentage of projection views captured.
- Activation: Percentage of newly registered users who add at least one entry in the first session.

Performance and quality metrics
- Projection compute performance: P95 under 1s for the stated scale.
- Error rate: Less than 1% failed requests for authenticated operations.
- Availability: 99% monthly for MVP.

Compliance metrics
- Supabase EU region configured and DPA executed.
- Polish Privacy Policy and Terms of Service published and accessible.
- CSV export and account deletion verified via end-to-end tests.


