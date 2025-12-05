# View Implementation Plan: Main Dashboard

## 1. Overview
The Main Dashboard is the primary interface of the application, accessible at the root path. It serves as the central hub for managing financial occurrences (incomes and expenses) and viewing real-time balance projections. Key features include a non-dismissible onboarding modal for setting the initial starting balance and a responsive projection panel that displays the calculated balance for a specific date.

## 2. View Routing
- **Path:** `/`
- **Page Component:** `src/pages/index.astro`

## 3. Component Structure

- `src/pages/index.astro` (Astro Page Wrapper)
  - `DashboardLayout` (React Layout Component)
    - `AppHeader` (Navigation & User Menu)
    - `Dashboard` (Main Container)
      - `DashboardToolbar` (Placeholder - Filter & Actions)
      - `OccurrencesList` (Placeholder - Infinite Scroll List)
      - `ProjectionPanel` (Responsive Side/Bottom Panel)
        - `BalanceDisplay`
        - `ProjectionDatePicker`
        - `CalculationBreakdown`
      - `StartingBalanceOnboardingModal` (Blocking Onboarding Dialog)
        - `StartingBalanceForm`

## 4. Component Details

### `Dashboard` (Container)
- **Description:** The main smart component that orchestrates state, data fetching, and layout for the dashboard view.
- **Main Elements:** Container `div` wrapping the content and the projection panel.
- **Handled Interactions:** 
  - Initial data fetching (Starting Balance).
  - Coordination between date selection and projection updates.
- **Handled Validation:** N/A (Logic container).
- **Types:** `DashboardState` (internal state).
- **Props:** None.

### `ProjectionPanel`
- **Description:** Displays the projected balance, date picker, and calculation breakdown. Adapts layout for mobile (sticky footer/bottom sheet) and desktop (side drawer/panel).
- **Main Elements:** 
  - Container with responsive classes (`fixed bottom-0` for mobile, `lg:fixed lg:right-0` for desktop).
  - `BalanceDisplay`: Shows large currency amount.
  - `ProjectionDatePicker`: Calendar/Date input.
  - `CalculationBreakdown`: List of Income, Expense, Net Change.
- **Handled Interactions:**
  - Date selection changes.
- **Handled Validation:**
  - Disables dates before `startingBalance.effective_date` and after `today + 10 years`.
- **Types:** `ProjectionDTO`, `StartingBalanceDTO`.
- **Props:** 
  - `projection`: `ProjectionDTO | null`
  - `startingBalance`: `StartingBalanceDTO | null`
  - `selectedDate`: `Date`
  - `onDateChange`: `(date: Date) => void`
  - `isLoading`: `boolean`

### `StartingBalanceOnboardingModal`
- **Description:** A non-dismissible dialog that forces new users to set a starting balance before using the app.
- **Main Elements:** `Dialog` (Shadcn), `DialogContent`, `StartingBalanceForm`.
- **Handled Interactions:**
  - Form submission (calls `PUT /api/starting-balance`).
- **Handled Validation:**
  - Form cannot be closed without success.
  - Client-side validation via Zod schema.
- **Types:** `UpsertStartingBalanceCommand`.
- **Props:**
  - `isOpen`: `boolean`
  - `onSuccess`: `() => void`

### `StartingBalanceForm`
- **Description:** Form to input amount and date for starting balance.
- **Main Elements:** `Input` (Amount), `DatePicker` (Effective Date), `Button` (Submit).
- **Handled Interactions:** User input, Submit.
- **Handled Validation:**
  - `amount`: Positive number, max 2 decimal places.
  - `effective_date`: Valid date required.
- **Types:** `UpsertStartingBalanceCommand`.
- **Props:** `onSubmit`: `(data: UpsertStartingBalanceCommand) => Promise<void>`.

### `AppHeader`
- **Description:** Application header with Logo and User Menu.
- **Main Elements:** `header`, `Logo`, `UserMenu` (Dropdown).
- **Handled Interactions:** Navigation (Logout, Settings).
- **Types:** None.
- **Props:** None.

### `DashboardToolbar` (Placeholder)
- **Description:** Placeholder for filters (Date Range, Entry Type) and "Add Entry" button.
- **Main Elements:** `div`, `Skeleton` or static placeholder text.
- **Props:** None.

### `OccurrencesList` (Placeholder)
- **Description:** Placeholder for the list of transactions.
- **Main Elements:** `div`, `Skeleton` or static placeholder text.
- **Props:** None.

## 5. Types

### `DashboardState`
- `startingBalance`: `StartingBalanceDTO | null`
- `projection`: `ProjectionDTO | null`
- `selectedDate`: `Date`
- `isLoading`: `boolean`
- `isStartingBalanceModalOpen`: `boolean`

### `StartingBalanceFormSchema` (Zod)
- `amount`: `z.number().positive().max(9999999999.99)`
- `effective_date`: `z.date()`

*Note: Other types (DTOs) are already defined in `src/types.ts`.*

## 6. State Management

The `Dashboard` component will serve as the primary state container:
- **`startingBalance`**: Stores the user's starting balance. `null` triggers the onboarding modal.
- **`projection`**: Stores the projection data for the `selectedDate`.
- **`selectedDate`**: Controls the date used for projection queries.
- **`isLoading`**: Tracks API request status for UI feedback.

**Custom Hooks:**
- `useDashboardData()`: Encapsulates fetching logic for starting balance and projection.
  - `fetchStartingBalance()`: Calls GET /api/starting-balance.
  - `fetchProjection(date)`: Calls GET /api/projection.
  - `saveStartingBalance(data)`: Calls PUT /api/starting-balance.

## 7. API Integration

### 1. Get Starting Balance
- **Endpoint:** `GET /api/starting-balance`
- **Response:** `StartingBalanceDTO`
- **Handling:** 
  - 200: Set `startingBalance` state.
  - 404: Open `StartingBalanceOnboardingModal`.

### 2. Update/Create Starting Balance
- **Endpoint:** `PUT /api/starting-balance`
- **Request:** `UpsertStartingBalanceCommand`
- **Response:** `StartingBalanceDTO`
- **Handling:** 
  - 200/201: Update `startingBalance` state, close modal, fetch initial projection.

### 3. Get Projection
- **Endpoint:** `GET /api/projection`
- **Query Param:** `date` (YYYY-MM-DD)
- **Response:** `ProjectionDTO`
- **Handling:**
  - 200: Update `projection` state.
  - 400/404: Handle errors (e.g., date out of range).

## 8. User Interactions

1.  **Initial Load:**
    - App checks if starting balance exists.
    - **Scenario A (New User):** Modal opens. User enters amount/date. Submit -> Modal closes -> Dashboard loads.
    - **Scenario B (Returning User):** Dashboard loads with today's projection.
2.  **Changing Projection Date:**
    - User clicks date in `ProjectionPanel`.
    - App fetches projection for new date.
    - `BalanceDisplay` updates with loading state then new value.
3.  **Mobile Navigation:**
    - User scrolls `OccurrencesList` (placeholder).
    - `ProjectionPanel` stays sticky at the bottom.

## 9. Conditions and Validation

- **Onboarding Modal:**
  - Condition: `startingBalance === null` (after initial fetch).
  - Validation: Amount > 0, Date is valid.
- **Projection Date:**
  - Condition: `minDate` = `startingBalance.effective_date`.
  - Condition: `maxDate` = Today + 10 years.
  - Validation: UI prevents selecting outside this range.

## 10. Error Handling

- **API Errors:** Display generic error Toast ("Failed to load data") for 500s.
- **Validation Errors:** Inline form errors in `StartingBalanceForm` (e.g., "Amount is required").
- **Loading States:**
  - Show full-screen loader or skeleton while checking starting balance.
  - Show local loader in `ProjectionPanel` when changing dates.

## 10. Implementation Steps

1.  **Create Types/Schemas:** Define Zod schemas for the starting balance form.
2.  **Implement Shared Components:** Ensure `AppHeader` is implemented.
3.  **Implement Placeholders:** Create simple `DashboardToolbar` and `OccurrencesList` components.
4.  **Implement Onboarding:**
    - Create `StartingBalanceForm` with validation.
    - Create `StartingBalanceOnboardingModal` using Shadcn Dialog (ensure non-dismissible).
5.  **Implement Projection Panel:**
    - Create responsive layout (desktop side / mobile bottom).
    - Integrate `Calendar` or DatePicker.
    - Create `BalanceDisplay` and `Breakdown` sub-components.
6.  **Implement Dashboard Container:**
    - Wire up `useDashboardData` hook.
    - Manage state flow (Auth -> Check Balance -> Show Modal/View).
    - Combine all components into the main view.
7.  **Integration:** Mount `Dashboard` in `src/pages/index.astro`.
8.  **Review:** Verify against User Stories (US-006, US-021, US-022, US-028).
