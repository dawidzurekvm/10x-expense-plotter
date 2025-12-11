# Testing Scenarios for 10x Expense Plotter

This document outlines common testing scenarios for the expense plotter application.

## 🔐 Authentication Tests

### Unit Tests
- [ ] Validate email format
- [ ] Validate password strength
- [ ] Test auth utility functions
- [ ] Test session token parsing

### E2E Tests
- [ ] User can register with valid credentials
- [ ] User cannot register with invalid email
- [ ] User cannot register with weak password
- [ ] User can login with correct credentials
- [ ] User cannot login with incorrect credentials
- [ ] User can reset password via email
- [ ] User stays logged in after page refresh
- [ ] User can logout

## 💰 Starting Balance Tests

### Unit Tests
- [ ] Validate starting balance amount (positive/negative/zero)
- [ ] Test starting balance service CRUD operations
- [ ] Test validation schema

### Integration Tests
- [ ] Create starting balance via API
- [ ] Update starting balance via API
- [ ] Get starting balance via API
- [ ] Handle missing starting balance

### E2E Tests
- [ ] User can set initial starting balance
- [ ] User can update starting balance
- [ ] Starting balance persists after logout/login
- [ ] Starting balance onboarding modal shows for new users

## 📝 Entry Series Tests

### Unit Tests
- [ ] Validate entry data (amount, date, type, frequency)
- [ ] Test entry validation schema
- [ ] Test entry service CRUD operations
- [ ] Test recurring entry calculations
- [ ] Test weekly frequency handling
- [ ] Test monthly frequency handling

### Integration Tests
- [ ] Create one-time entry via API
- [ ] Create recurring entry via API
- [ ] Update entry via API
- [ ] Delete entry via API
- [ ] Filter entries by type (income/expense)
- [ ] Filter entries by frequency

### E2E Tests
- [ ] User can create one-time income entry
- [ ] User can create one-time expense entry
- [ ] User can create recurring monthly income
- [ ] User can create recurring weekly expense
- [ ] User can edit entry
- [ ] User can delete entry
- [ ] User can view all entries in dashboard
- [ ] Entry form validates required fields
- [ ] Entry form validates amount format
- [ ] Entry form validates date format

## 🔄 Occurrences Tests

### Unit Tests
- [ ] Test occurrence generation from entry series
- [ ] Test weekly occurrence expansion
- [ ] Test monthly occurrence expansion
- [ ] Test one-time occurrence handling
- [ ] Test date range filtering
- [ ] Test exception handling

### Integration Tests
- [ ] Get occurrences within date range via API
- [ ] Occurrences respect entry start/end dates
- [ ] Occurrences handle exceptions correctly
- [ ] Performance with large datasets

### E2E Tests
- [ ] User sees expanded occurrences in calendar view
- [ ] User sees correct count of future occurrences
- [ ] Recurring entries show multiple occurrences
- [ ] One-time entries show single occurrence

## 📊 Projection Tests

### Unit Tests
- [ ] Test balance calculation algorithm
- [ ] Test projection with income only
- [ ] Test projection with expenses only
- [ ] Test projection with mixed entries
- [ ] Test projection date range handling
- [ ] Test projection with starting balance

### Integration Tests
- [ ] Get projection via API
- [ ] Projection accuracy with real data
- [ ] Projection respects date range
- [ ] Projection handles empty entries

### E2E Tests
- [ ] User sees projected balance in dashboard
- [ ] User can select different projection dates
- [ ] Projection updates when entries change
- [ ] Chart displays projection correctly
- [ ] Projection tooltip shows details

## 📤 Export Tests

### Unit Tests
- [ ] Test CSV generation
- [ ] Test data formatting for export
- [ ] Test export service

### Integration Tests
- [ ] Export entries as CSV via API
- [ ] CSV contains correct headers
- [ ] CSV contains all user entries
- [ ] CSV format is valid

### E2E Tests
- [ ] User can download entries as CSV
- [ ] Downloaded file has correct filename
- [ ] CSV file opens correctly in spreadsheet

## ⚙️ Settings Tests

### Unit Tests
- [ ] Test password change validation
- [ ] Test email update validation
- [ ] Test data validation

### Integration Tests
- [ ] User can change password via API
- [ ] User can update profile via API
- [ ] User can delete account via API

### E2E Tests
- [ ] User can access settings page
- [ ] User can change password
- [ ] User receives confirmation after password change
- [ ] User can update email preferences
- [ ] User can delete account with confirmation
- [ ] User is logged out after account deletion
- [ ] User can export data before deletion

## 🎨 UI Component Tests

### Dashboard Components
- [ ] Dashboard layout renders correctly
- [ ] Dashboard toolbar shows correct actions
- [ ] Occurrence card displays data correctly
- [ ] Occurrences list renders entries
- [ ] Empty state shows when no entries
- [ ] Loading state displays correctly

### Form Components
- [ ] Entry form validates all fields
- [ ] Entry form submits correctly
- [ ] Form shows error messages
- [ ] Form resets after submission
- [ ] Date picker works correctly
- [ ] Amount input formats correctly

### UI Library Components
- [ ] Button component renders variants
- [ ] Button handles click events
- [ ] Dialog opens/closes correctly
- [ ] Dropdown menu works
- [ ] Alert dialog confirms actions
- [ ] Toast notifications appear

## 🔒 Authorization Tests

### Integration Tests
- [ ] Unauthorized users cannot access API endpoints
- [ ] Users can only access their own data
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are handled

### E2E Tests
- [ ] Unauthenticated users redirect to login
- [ ] Protected routes require authentication
- [ ] Session expires after timeout
- [ ] User is redirected after session expiry

## 🐛 Error Handling Tests

### Unit Tests
- [ ] Test error response formatting
- [ ] Test validation error messages
- [ ] Test error logging

### Integration Tests
- [ ] API returns correct error codes
- [ ] API returns descriptive error messages
- [ ] Invalid data returns 400 Bad Request
- [ ] Unauthorized access returns 401
- [ ] Not found returns 404
- [ ] Server errors return 500

### E2E Tests
- [ ] Form shows validation errors
- [ ] Network errors show user-friendly message
- [ ] Failed submissions can be retried
- [ ] Error notifications dismiss correctly

## 🎯 Performance Tests

### Unit Tests
- [ ] Algorithms run in acceptable time
- [ ] Memoization works correctly
- [ ] Debouncing works as expected

### Integration Tests
- [ ] API responds within acceptable time (<500ms)
- [ ] Batch operations are efficient
- [ ] Database queries are optimized

### E2E Tests
- [ ] Dashboard loads within 2 seconds
- [ ] Forms submit without lag
- [ ] Chart renders smoothly
- [ ] Large datasets don't freeze UI

## ♿ Accessibility Tests

### E2E Tests
- [ ] Keyboard navigation works throughout app
- [ ] Focus indicators are visible
- [ ] Form labels are associated correctly
- [ ] Error messages are announced
- [ ] Buttons have accessible names
- [ ] Images have alt text
- [ ] Color contrast meets WCAG standards

## 📱 Responsive Design Tests

### E2E Tests
- [ ] Dashboard is usable on mobile
- [ ] Forms work on mobile
- [ ] Charts adapt to screen size
- [ ] Navigation works on mobile
- [ ] Touch interactions work correctly

## 🔄 State Management Tests

### Unit Tests
- [ ] React hooks work correctly
- [ ] State updates are correct
- [ ] useEntryMutations handles optimistic updates
- [ ] useDashboardData fetches correctly
- [ ] useOccurrences filters correctly

### E2E Tests
- [ ] State persists between page navigations
- [ ] Optimistic updates work
- [ ] State recovers from errors

## Priority Testing Roadmap

### Phase 1: Critical Path (Must Have)
1. Authentication E2E tests
2. Entry CRUD operations (Unit + Integration + E2E)
3. Starting balance tests
4. Authorization tests

### Phase 2: Core Features
1. Occurrence generation tests
2. Projection calculation tests
3. Export functionality tests
4. Settings page tests

### Phase 3: Polish
1. UI component tests
2. Error handling tests
3. Performance tests
4. Accessibility tests

### Phase 4: Optimization
1. Visual regression tests
2. Load testing
3. Responsive design tests
4. Cross-browser E2E tests

## Testing Metrics Goals

- **Unit Test Coverage:** >80%
- **Critical Path Coverage:** 100%
- **E2E Test Coverage:** All critical user flows
- **Test Execution Time:** <2 minutes for unit tests, <5 minutes for E2E
- **Flakiness Rate:** <1%

## Continuous Testing Strategy

1. **Pre-commit:** Lint + Type check
2. **Pre-push:** Unit tests
3. **PR:** Full test suite (Unit + Integration + E2E)
4. **Main branch:** Full suite + Coverage report
5. **Production deployment:** Smoke tests

---

*Use this document as a checklist for implementing comprehensive test coverage.*

