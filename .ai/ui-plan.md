# UI Architecture for 10x Expense Plotter

## 1. UI Structure Overview

The UI architecture for 10x Expense Plotter is designed around a **minimal single-page application (SPA)** model, prioritizing simplicity and immediate feedback. The core of the application is a unified **Entry Management Dashboard** where users can view, add, and modify their financial entries.

A key feature is the **persistent Projection Panel**, which is always visible and updates in real-time. On desktop, this panel appears as a side drawer. On mobile devices, it transforms into a sticky footer/collapsible bottom sheet to optimize screen real estate while maintaining its core function of providing instant financial feedback.

User flows for creating and editing data are handled through non-intrusive modals and dialogs. The application enforces a critical onboarding step: new users are met with a blocking modal to set their initial financial balance, ensuring the projection engine has a valid starting point before the main interface is accessible. Navigation is streamlined, with most actions occurring within the main dashboard, supplemented by a separate, tab-organized settings page for account and data management.

## 2. View List

### 1. Authentication View
- **View Path:** `/login` (also handles sign-up and password reset)
- **Main Purpose:** To manage user authentication, including login, account creation, and password recovery. The application will redirect all unauthenticated users to this view.
- **Key Information to Display:**
    - Email and Password fields.
    - Forms for Login, Sign Up, and Password Reset.
    - Links to toggle between forms.
- **Key View Components:**
    - `AuthForm`: A single component that adapts its state for login, sign-up, or password reset flows.
    - `EmailInput`, `PasswordInput`: Standard input components with validation.
- **UX, Accessibility, and Security Considerations:**
    - **UX:** Clear error messages are displayed at the field level (e.g., "Invalid email format," "Password is too weak").
    - **Accessibility:** All form fields have associated labels. Focus is managed programmatically, especially when switching between forms.
    - **Security:** The view communicates with Supabase Auth endpoints. No sensitive data is stored client-side.

### 2. Main Dashboard (Entry Management)
- **View Path:** `/`
- **Main Purpose:** To provide a centralized view for managing all financial occurrences (incomes and expenses) and viewing the real-time balance projection. This is the primary user interface.
- **Key Information to Display:**
    - A list of individual transaction occurrences, sorted by date.
    - The projected balance for a user-selected date.
    - A breakdown of the projection calculation (Starting Balance + Incomes - Expenses).
    - Filters for the occurrence list (date range, entry type).
- **Key View Components:**
    - `AppHeader`: Contains the application logo and a `UserMenu` for navigating to Settings or logging out.
    - `DashboardToolbar`: Houses the `DateRangeFilter`, `EntryTypeToggle`, and a persistent "Add Entry" button.
    - `OccurrencesList`: An infinite-scroll container displaying `OccurrenceCard` components. It shows skeleton loaders while fetching data.
    - `ProjectionPanel`: A responsive component that renders as a side drawer on desktop and a sticky footer/bottom sheet on mobile. It contains the `BalanceDisplay`, a dedicated `ProjectionDatePicker`, and the `CalculationBreakdown`.
    - `AddEditEntryDialog`: A modal for creating or editing entries.
    - `EditScopeModal`: A secondary modal triggered when saving an edit to a recurring entry, forcing a choice of scope (occurrence, future, entire).
    - `StartingBalanceOnboardingModal`: A non-dismissible modal that blocks the UI until a new user has set their starting balance.
- **UX, Accessibility, and Security Considerations:**
    - **UX:** Infinite scroll provides a seamless browsing experience. Real-time projection updates offer immediate feedback on any CUD action. Toast notifications confirm actions like saving or deleting.
    - **Accessibility:** The mobile sticky footer must be keyboard-navigable and not obscure other content. All interactive elements must be clearly labeled.
    - **Security:** All data is fetched via authenticated API endpoints that rely on Supabase's Row-Level Security (RLS) to ensure data isolation.

### 3. Settings View
- **View Path:** `/settings`
- **Main Purpose:** To allow users to manage their wallet, account credentials, and data privacy settings.
- **Key Information to Display:**
    - Forms for updating the starting balance and changing the password.
    - Controls for exporting data and deleting the account.
- **Key View Components:**
    - `SettingsTabs`: A container with three tabs: "Wallet," "Account," and "Data & Privacy."
    - `StartingBalanceForm`: (Wallet Tab) Allows updating the starting balance amount and effective date.
    - `ChangePasswordForm`: (Account Tab) A standard change password form.
    - `DataPrivacyPanel`: (Data & Privacy Tab) Contains a button to trigger a CSV export and a `DeleteAccountForm`.
    - `DeleteAccountForm`: A high-friction form requiring the user to type a confirmation phrase (e.g., "DELETE MY ACCOUNT") into a text field to enable the final delete button.
- **UX, Accessibility, and Security Considerations:**
    - **UX:** Settings are logically grouped into tabs for clarity. The account deletion process is deliberately cumbersome to prevent accidental data loss.
    - **Accessibility:** The tabbed interface is navigable via keyboard.
    - **Security:** The account deletion confirmation provides a strong safeguard against accidental or malicious actions.

## 3. User Journey Map

### New User Onboarding Flow
1.  **Start:** A new user accesses the application and is redirected to the **Authentication View** (`/login`).
2.  **Sign Up:** The user switches to the sign-up form, enters their credentials, and creates an account.
3.  **Redirection:** Upon successful sign-up, the user is redirected to the **Main Dashboard** (`/`).
4.  **Onboarding Trigger:** The application detects no starting balance (`GET /api/starting-balance` returns 404). The `StartingBalanceOnboardingModal` is displayed, blocking all other UI interactions.
5.  **Set Balance:** The user enters their starting balance and an effective date and submits the form.
6.  **Completion:** The modal closes. The user now has full access to the **Main Dashboard** and its features. The `ProjectionPanel` displays the initial balance.

### Core Use Case: Editing a Single Occurrence of a Recurring Expense
1.  **Navigate List:** The user scrolls through the `OccurrencesList` on the **Main Dashboard**.
2.  **Select Entry:** The user identifies a specific expense from a recurring series and clicks its "Edit" button.
3.  **Open Dialog:** The `AddEditEntryDialog` opens, pre-populated with the data for that specific occurrence.
4.  **Modify Data:** The user modifies the amount or title of the expense and clicks "Save."
5.  **Select Scope:** Because the entry is part of a series, the `EditScopeModal` appears, prompting the user to choose the scope of the edit: "This occurrence only," "This and future occurrences," or "Entire series."
6.  **Confirm Scope:** The user selects "This occurrence only."
7.  **API Call & Feedback:** An API request is sent (`PUT /api/entries/:id?scope=occurrence&date=...`). Upon success, both modals close, and a confirmation toast appears.
8.  **UI Update:** The CUD action triggers a refresh of both the `OccurrencesList` and the `ProjectionPanel`, showing the immediate impact of the change on the projected balance.

## 4. Layout and Navigation Structure

The application employs a minimal navigation structure, centered on the Main Dashboard.

- **Header:** A persistent `AppHeader` is present on all authenticated views. It contains the application logo and a `UserMenu`.
- **User Menu:** This dropdown menu is the primary navigation hub. It contains links to:
    - **Settings (`/settings`):** Takes the user to the Settings View.
    - **Logout:** Ends the user's session and redirects to the Authentication View.
- **Layout:**
    - **Desktop:** A two-column layout on the Main Dashboard. The `OccurrencesList` takes up the main column, and the `ProjectionPanel` occupies a fixed-width side drawer.
    - **Mobile:** A single-column layout. The `OccurrencesList` fills the screen, and the `ProjectionPanel` becomes a sticky footer that can be expanded into a bottom sheet for more detail.
- **Routing:**
    - `/`: Main Dashboard (requires authentication).
    - `/login`: Authentication View.
    - `/settings`: Settings View (requires authentication).

## 5. Key Components

- **`OccurrenceCard`:** A component representing a single transaction in the main list. It displays the title, amount, date, and visual indicators for recurrence type or exceptions (overrides/skips).
- **`ProjectionPanel`:** A responsive container for the balance projection. It adapts its layout (drawer vs. bottom sheet) based on screen size and provides real-time financial feedback.
- **`AddEditEntryDialog`:** A modal form for all entry CUD operations. Its state is managed to handle both creation and editing of one-time and recurring entries.
- **`EditScopeModal`:** A simple modal with three distinct buttons for selecting the edit scope. It appears as an intermediary step in the recurring entry edit flow.
- **`CurrencyInput`:** A controlled input component that masks user input to enforce positive numbers with a maximum of two decimal places, ensuring clean data is sent to the API.
- **`DateRangeFilter`:** A toolbar component using a calendar for selecting `from_date` and `to_date`, which controls the data fetched for the `OccurrencesList`.
- **`UserMenu`:** A dropdown in the header providing navigation to the `Settings` page and the `Logout` action.
- **`GlobalStateProvider (ExpenseContext)`:** A React Context provider that wraps the application. It exposes a `refreshProjection` function that can be called by any component after a CUD operation to trigger a data refetch for the projection and occurrence list.
