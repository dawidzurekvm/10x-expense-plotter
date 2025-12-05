# View Implementation Plan: Dashboard Entries Extension

## 1. Overview
This plan covers the extension of the Main Dashboard (`/`) to include full Entry Management capabilities. It builds upon the foundation established in `dashboard-view-implementation-plan.md` and replaces existing placeholders with a functional list of occurrences, filtering controls, and comprehensive Add/Edit/Delete workflows for one-time and recurring entries.

## 2. View Routing
- **Path:** `/` (Root)
- **Existing Component:** `src/pages/index.astro` wrapping `Dashboard.tsx`

## 3. Component Structure
- `Dashboard` (Smart Container)
  - `DashboardToolbar` (Filters & Actions)
    - `DateRangePicker`
    - `EntryTypeToggle`
    - `Button` (Add Entry)
  - `OccurrencesList` (Data Display)
    - `OccurrenceCard` (Repeated Item)
      - `ActionsDropdown` (Edit/Delete triggers)
  - `AddEditEntryDialog` (Modal)
    - `EntryForm`
  - `EditScopeModal` (Intermediate Modal for Recurring Edits)
  - `DeleteEntryDialog` (Modal for Deletion + Scope)
  - `ProjectionPanel` (Existing)
  - `StartingBalanceOnboardingModal` (Existing)

## 4. Component Details

### `DashboardToolbar`
- **Description:** Provides controls to filter the occurrence list and a primary action to add new entries.
- **Main elements:**
  - Shadcn `Popover` + `Calendar` (Date Range Picker).
  - `ToggleGroup` (Income / Expense / All).
  - `Button` ("Add Entry").
- **Handled interactions:**
  - `onFilterChange`: Emits new date range or type filter to parent.
  - `onAddClick`: Emits event to open `AddEditEntryDialog`.
- **Props:**
  - `dateRange`: `{ from: Date, to: Date }`
  - `entryType`: `EntryType | 'all'`
  - `onFilterChange`: `(filters: DashboardFilters) => void`
  - `onAddClick`: `() => void`

### `OccurrencesList`
- **Description:** A scrollable list displaying occurrences fetched from the API. Supports infinite scrolling or "Load More" functionality.
- **Main elements:**
  - `div` container with overflow handling.
  - `OccurrenceCard` map.
  - `Skeleton` loaders for fetching state.
  - `Button` "Load More" or `IntersectionObserver` target.
- **Handled interactions:**
  - `onEditClick`: Passes specific `OccurrenceDTO` to parent.
  - `onDeleteClick`: Passes specific `OccurrenceDTO` to parent.
- **Props:**
  - `occurrences`: `OccurrenceDTO[]`
  - `isLoading`: `boolean`
  - `hasMore`: `boolean`
  - `onLoadMore`: `() => void`
  - `onEditClick`: `(occurrence: OccurrenceDTO) => void`
  - `onDeleteClick`: `(occurrence: OccurrenceDTO) => void`

### `OccurrenceCard`
- **Description:** Displays a single occurrence with visual distinction for Income/Expense and Recurrence.
- **Main elements:**
  - `Card` or styled `div`.
  - Icon/Color indicator (Green for Income, Red for Expense).
  - Text: Date, Title, Amount.
  - `DropdownMenu`: "Edit", "Delete".
- **Props:**
  - `occurrence`: `OccurrenceDTO`
  - `onEdit`: `() => void`
  - `onDelete`: `() => void`

### `AddEditEntryDialog`
- **Description:** Modal containing the form for creating or editing entries.
- **Main elements:**
  - Shadcn `Dialog`.
  - `EntryForm` component.
- **Handled interactions:**
  - Submits form data.
  - Handles API errors.
- **Props:**
  - `isOpen`: `boolean`
  - `onOpenChange`: `(open: boolean) => void`
  - `initialData`: `EntrySeriesDetailDTO | null` (null for create mode)
  - `onSubmit`: `(data: EntryFormValues) => Promise<void>`

### `EntryForm`
- **Description:** The actual form fields and validation logic.
- **Main elements:**
  - `RadioGroup` (Income/Expense).
  - `Input` (Title, Amount).
  - `Textarea` (Description).
  - `DatePicker` (Start Date, End Date).
  - `Select` / `RadioGroup` (Recurrence: One-time, Weekly, Monthly).
- **Handled validation:**
  - Zod schema matching `CreateEntryCommand`.
  - `end_date` must be >= `start_date`.
  - Amount > 0.
  - Required fields.
- **Types:** `EntryFormValues` (Zod inferred type).
- **Props:**
  - `defaultValues`: `EntryFormValues`
  - `onSubmit`: `(data: EntryFormValues) => void`
  - `isSubmitting`: `boolean`

### `EditScopeModal`
- **Description:** Prompts user to select scope when updating a recurring series.
- **Main elements:**
  - `Dialog`.
  - `RadioGroup` or 3 distinct Buttons: "This Occurrence Only", "This and Future", "Entire Series".
- **Props:**
  - `isOpen`: `boolean`
  - `onClose`: `() => void`
  - `onSelectScope`: `(scope: EditScope) => void`

### `DeleteEntryDialog`
- **Description:** Confirmation dialog for deletion, asking for scope if the entry is recurring.
- **Main elements:**
  - `AlertDialog` or `Dialog`.
  - Dynamic content: Simple confirmation for one-time, Scope selection for recurring.
- **Props:**
  - `isOpen`: `boolean`
  - `isRecurring`: `boolean`
  - `onClose`: `() => void`
  - `onConfirm`: `(scope: DeleteScope) => void`

## 5. Types

### View Models & Schemas
**`EntryFormSchema` (Zod)**
```typescript
z.object({
  entry_type: z.enum(["income", "expense"]),
  title: z.string().min(1).max(120),
  amount: z.number().positive(), // UI handles sign based on type
  description: z.string().max(500).optional(),
  start_date: z.date(),
  recurrence_type: z.enum(["one_time", "weekly", "monthly"]),
  end_date: z.date().optional(), // Must be >= start_date
  // Derived/Hidden fields populated before submit
  weekday: z.number().min(0).max(6).optional(),
  day_of_month: z.number().min(1).max(31).optional(),
})
```

**`DashboardFilters`**
```typescript
interface DashboardFilters {
  dateRange: { from: Date; to: Date };
  entryType: 'all' | 'income' | 'expense';
}
```

### State Interfaces
**`EntryMutationState`**
```typescript
interface EntryMutationState {
  type: 'create' | 'edit' | 'delete';
  occurrence?: OccurrenceDTO; // The occurrence that triggered the action
  seriesDetail?: EntrySeriesDetailDTO; // Fetched details for editing/deleting
  formData?: EntryFormValues; // Temporarily holds form data while waiting for scope
}
```

## 6. State Management

### `useOccurrences(filters: DashboardFilters)` hook
- **Purpose:** Manages fetching list data.
- **State:** `data`, `isLoading`, `error`, `pagination`.
- **Actions:** `refresh()`, `loadMore()`.

### `useEntryMutations()` hook
- **Purpose:** Wrapper around API calls.
- **Actions:**
  - `createEntry(data: CreateEntryCommand)`
  - `updateEntry(id: string, data: UpdateEntryCommand, scope: EditScope, date: string)`
  - `deleteEntry(id: string, scope: DeleteScope, date: string)`
  - `fetchEntryDetails(id: string)`: Helper to get full series data before edit.

### Dashboard Component State
- `filters`: `DashboardFilters`
- `mutationState`: `EntryMutationState | null`
- `isEntryModalOpen`: boolean
- `isScopeModalOpen`: boolean
- `isDeleteModalOpen`: boolean

## 7. API Integration

**1. List Occurrences**
- **Req:** `GET /api/occurrences` with params `from_date`, `to_date`, `entry_type`.
- **Res:** `OccurrenceListResponseDTO`.

**2. Get Entry Details** (Triggered on Edit/Delete click)
- **Req:** `GET /api/entries/:id`
- **Res:** `EntrySeriesDetailDTO`.

**3. Create Entry**
- **Req:** `POST /api/entries` with `CreateEntryCommand`.
- **Res:** `EntrySeriesDTO`.

**4. Update Entry**
- **Req:** `PUT /api/entries/:id` with `UpdateEntryCommand` + query params `scope`, `date`.
- **Res:** `OccurrenceEditResponseDTO | FutureEditResponseDTO | EntireEditResponseDTO`.

**5. Delete Entry**
- **Req:** `DELETE /api/entries/:id` with query params `scope`, `date`.
- **Res:** `DeleteEntryResponseDTO`.

## 8. User Interactions

**Flow: Create Entry**
1. User clicks "Add Entry".
2. `AddEditEntryDialog` opens (empty state).
3. User fills form, clicks "Save".
4. App calls `createEntry`.
5. On success: Close dialog, `refresh()` occurrences, `refresh()` projection.

**Flow: Edit Entry**
1. User clicks "Edit" on an occurrence.
2. App calls `fetchEntryDetails(occurrence.series_id)`.
3. `AddEditEntryDialog` opens (pre-filled).
4. User modifies data, clicks "Save".
5. **Condition:**
   - If `recurrence_type === 'one_time'`: Call `updateEntry` immediately (scope='entire' or 'occurrence' - for one-time effectively same).
   - If `recurrence_type !== 'one_time'`: Store form data, open `EditScopeModal`.
6. User selects Scope -> Call `updateEntry` with scope and occurrence date.
7. On success: Close modals, refresh data.

**Flow: Delete Entry**
1. User clicks "Delete" on an occurrence.
2. App calls `fetchEntryDetails`.
3. `DeleteEntryDialog` opens.
   - If recurring: Show scope options.
   - If one-time: Show simple confirmation.
4. User confirms -> Call `deleteEntry`.
5. On success: Close dialog, refresh data.

## 9. Conditions and Validation

- **End Date Validation:** Form validation prevents `end_date` < `start_date`.
- **Recurrence Logic:**
  - If "Weekly" selected: `weekday` is derived from `start_date`.
  - If "Monthly" selected: `day_of_month` is derived from `start_date`.
- **Scope Availability:**
  - "This Occurrence" / "This and Future" require a valid occurrence date (passed from the clicked card).

## 10. Error Handling

- **Form Errors:** Inline validation messages (via Zod + React Hook Form).
- **API Errors:** Display generic error Toast for 500s.
- **Conflict Errors (409):** Handle "Overlapping series" specifically if reported by `scope=future` updates.

## 11. Implementation Steps

1.  **Create Types & Schemas:** Define `EntryFormSchema` and helper types in a new file `src/components/dashboard/entries/schema.ts`.
2.  **Implement Hooks:**
    - `useOccurrences` in `src/hooks/useOccurrences.ts`.
    - `useEntryMutations` in `src/hooks/useEntryMutations.ts`.
3.  **Implement Dumb Components:**
    - `OccurrenceCard`.
    - `EntryForm`.
    - `DashboardToolbar`.
4.  **Implement Modals:**
    - `AddEditEntryDialog` (integrating `EntryForm`).
    - `EditScopeModal`.
    - `DeleteEntryDialog`.
5.  **Implement List Container:** `OccurrencesList` with skeleton loading and mapping logic.
6.  **Integrate into Dashboard:**
    - Update `Dashboard.tsx`.
    - Add state for filters and active mutation.
    - Connect `DashboardToolbar` to filter state.
    - Connect `OccurrencesList` to `useOccurrences`.
    - Implement `handleEdit`, `handleDelete` flows connecting Modals to Hooks.
7.  **Review & Polish:** Verify one-time vs recurring behaviors, check clamping (backend) logic is respected by frontend dates, ensure projection updates on change.