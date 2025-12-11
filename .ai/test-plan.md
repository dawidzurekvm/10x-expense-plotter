# Test Plan: 10x Expense Plotter

## 1. Introduction and Testing Objectives

### 1.1 Project Overview

10x Expense Plotter is a personal finance management application that allows users to track their income and expenses, manage recurring transactions, and project future balances. The application is built with a modern tech stack including Astro 5, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/ui for the frontend, and Supabase for backend services and database.

### 1.2 Testing Objectives

The primary objectives of this test plan are:

1. **Functional Verification**: Ensure all features work correctly according to specifications
2. **Data Integrity**: Validate that financial calculations and projections are accurate
3. **Security Assurance**: Verify authentication, authorization, and data isolation between users
4. **User Experience**: Confirm the application is intuitive and responsive
5. **Reliability**: Ensure the system handles edge cases and error conditions gracefully
6. **Performance**: Verify acceptable response times for data operations and projections

### 1.3 Scope

This test plan covers:
- User authentication and account management
- Entry (income/expense) CRUD operations
- Recurring entry management and occurrence expansion
- Balance projection calculations
- Data export functionality
- Settings management
- Cross-browser and responsive design testing

---

## 2. Test Scope

### 2.1 In-Scope Features

| Module | Features |
|--------|----------|
| **Authentication** | Login, Registration, Password Reset, Email Verification, Logout |
| **Dashboard** | Occurrences list, Date filtering, Entry type filtering, Pagination |
| **Entry Management** | Create, Read, Update, Delete entries (one-time, weekly, monthly) |
| **Occurrence Handling** | Edit scope (occurrence, future, entire), Delete scope |
| **Series Exceptions** | Skip exceptions, Override exceptions |
| **Projection** | Balance calculation, Date range selection, Computation breakdown |
| **Starting Balance** | Initial setup modal, Update balance, Effective date management |
| **Settings** | Wallet settings, Account settings (password change), Privacy settings |
| **Data Export** | CSV export with filters, Date range selection |
| **Account Management** | Delete account with confirmation |

### 2.2 Out-of-Scope

- Load testing beyond basic performance validation
- Penetration testing (separate security audit recommended)
- Third-party service failure scenarios (Supabase infrastructure)
- Mobile native applications (web-only application)

### 2.3 Testing Priorities

| Priority | Area | Justification |
|----------|------|---------------|
| **Critical** | Authentication & Authorization | Core security requirement |
| **Critical** | Entry CRUD Operations | Primary application functionality |
| **Critical** | Projection Calculations | Financial accuracy is paramount |
| **High** | Recurring Entry Management | Complex business logic |
| **High** | Data Isolation (RLS) | Security and privacy |
| **Medium** | CSV Export | Supporting functionality |
| **Medium** | Settings Management | User preferences |
| **Low** | UI/UX Polish | Non-blocking issues |

---

## 3. Types of Testing

### 3.1 Unit Testing

**Scope**: Individual functions, utilities, and service methods

**Focus Areas**:
- Zod validation schemas (`src/lib/validation/*.ts`)
- Date manipulation utilities
- Error response formatters (`src/lib/utils/error-response.utils.ts`)
- Entry command preparation logic
- CSV content generation

**Framework**: Vitest (recommended for Astro/Vite ecosystem)

### 3.2 Integration Testing

**Scope**: API endpoints, service layer, database interactions

**Focus Areas**:
- API route handlers (`src/pages/api/**/*.ts`)
- Service classes with Supabase client (`src/lib/services/*.ts`)
- Middleware authentication flow (`src/middleware/index.ts`)
- Database functions (`expand_occurrences`, `project_balance`)

**Framework**: Vitest + Native Fetch / Supabase Client (Test against Supabase Local)

### 3.3 Component Testing

**Scope**: React components in isolation

**Focus Areas**:
- Form components (LoginForm, RegisterForm, EntryForm)
- Dialog components (AddEditEntryDialog, DeleteEntryDialog)
- Dashboard components (OccurrencesList, ProjectionPanel)
- Settings tabs (WalletSettings, AccountSettings)

**Framework**: Vitest + React Testing Library

### 3.4 End-to-End Testing

**Scope**: Complete user flows through the application

**Focus Areas**:
- User registration and onboarding flow
- Entry creation and management workflows
- Balance projection viewing
- Account deletion process

**Framework**: Playwright (recommended for Astro SSR support)

### 3.5 Database Testing

**Scope**: PostgreSQL functions, triggers, constraints, and RLS policies

**Focus Areas**:
- `expand_occurrences()` function accuracy
- `project_balance()` calculation correctness
- `compute_monthly_occurrence()` date handling
- RLS policy enforcement
- Foreign key and constraint violations

**Framework**: Vitest + Supabase Client (Integration tests instead of pure SQL tests)

### 3.6 Security Testing

**Scope**: Authentication, authorization, input validation

**Focus Areas**:
- Session management
- CSRF protection
- SQL injection prevention
- XSS prevention
- Row-level security bypass attempts

---

## 4. Test Scenarios

### 4.1 Authentication Module

#### TC-AUTH-001: User Registration

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Registration form displayed |
| 2 | Enter valid email and password | Form accepts input |
| 3 | Submit form | Success message, email verification sent |
| 4 | Attempt login before verification | Error: "Please verify your email" |
| 5 | Verify email | Account activated |
| 6 | Login with credentials | Redirect to dashboard |

#### TC-AUTH-002: User Login

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login form displayed |
| 2 | Enter valid credentials | Form accepts input |
| 3 | Submit form | Redirect to dashboard (`/`) |
| 4 | Verify session cookie set | Valid auth session |

#### TC-AUTH-003: Invalid Login Attempts

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit empty form | Validation errors displayed |
| 2 | Submit invalid email format | "Invalid email" error |
| 3 | Submit wrong password | "Invalid credentials" error |
| 4 | Submit non-existent email | "Invalid credentials" error |

#### TC-AUTH-004: Password Reset Flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/forgot-password` | Password reset form displayed |
| 2 | Enter registered email | Success: "Reset link sent" |
| 3 | Click link in email | Redirect to `/reset-password` |
| 4 | Enter new password | Password updated |
| 5 | Login with new password | Success |

#### TC-AUTH-005: Protected Route Access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Access `/` without auth | Redirect to `/login` |
| 2 | Access `/settings` without auth | Redirect to `/login` |
| 3 | Access `/api/entries` without auth | 401 Unauthorized |
| 4 | Access `/login` while authenticated | Redirect to `/` |

### 4.2 Entry Management Module

#### TC-ENTRY-001: Create One-Time Income Entry

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Add Entry" button | Entry dialog opens |
| 2 | Select "Income" type | Entry type set |
| 3 | Enter title "Bonus" | Title validated (1-120 chars) |
| 4 | Enter amount "5000" | Amount validated (positive) |
| 5 | Select date "2025-01-15" | Date set |
| 6 | Select "One-time" recurrence | Recurrence type set |
| 7 | Submit form | Entry created, toast shown |
| 8 | Verify in occurrences list | Entry appears on correct date |

#### TC-ENTRY-002: Create Weekly Recurring Expense

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open entry dialog | Dialog displayed |
| 2 | Select "Expense" type | Entry type set |
| 3 | Enter title "Groceries" | Title set |
| 4 | Enter amount "200" | Amount set |
| 5 | Select start date (Monday) | Date set, weekday derived |
| 6 | Select "Weekly" recurrence | Recurrence type set |
| 7 | Optionally set end date | End date validated >= start |
| 8 | Submit form | Entry created |
| 9 | View month with multiple Mondays | Multiple occurrences displayed |

#### TC-ENTRY-003: Create Monthly Recurring Entry

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create monthly entry on 31st | day_of_month set to 31 |
| 2 | View February month | Occurrence on 28th/29th (clamped) |
| 3 | View April month | Occurrence on 30th (clamped) |
| 4 | View January month | Occurrence on 31st |

#### TC-ENTRY-004: Edit Single Occurrence

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click edit on recurring occurrence | Entry dialog opens |
| 2 | Modify amount to "250" | Form updated |
| 3 | Submit with "This occurrence only" scope | Override exception created |
| 4 | Verify modified occurrence | Shows "250" |
| 5 | Verify other occurrences | Still show original amount |

#### TC-ENTRY-005: Edit This and Future Occurrences

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Edit recurring occurrence | Dialog opens |
| 2 | Change title to "Updated Title" | Form updated |
| 3 | Submit with "This and future" scope | Series split |
| 4 | Original series ends day before edit | end_date updated |
| 5 | New series starts from edit date | New series created |
| 6 | Parent reference maintained | parent_series_id set |

#### TC-ENTRY-006: Edit Entire Series

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Edit recurring occurrence | Dialog opens |
| 2 | Modify description | Form updated |
| 3 | Submit with "Entire series" scope | All occurrences updated |
| 4 | Verify past occurrences | Updated |
| 5 | Verify future occurrences | Updated |

#### TC-ENTRY-007: Delete Single Occurrence

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click delete on recurring occurrence | Delete dialog opens |
| 2 | Select "This occurrence only" | Scope selected |
| 3 | Confirm deletion | Skip exception created |
| 4 | Verify deleted occurrence | Not displayed |
| 5 | Verify other occurrences | Still displayed |

#### TC-ENTRY-008: Delete Future Occurrences

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Delete recurring occurrence | Dialog opens |
| 2 | Select "This and future" | Scope selected |
| 3 | Confirm deletion | Series truncated |
| 4 | Verify end_date updated | Set to day before |
| 5 | Verify future occurrences removed | Not displayed |
| 6 | Verify past occurrences | Still displayed |

#### TC-ENTRY-009: Delete Entire Series

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Delete any occurrence | Dialog opens |
| 2 | Select "Entire series" | Scope selected |
| 3 | Confirm deletion | Series deleted |
| 4 | Verify all occurrences removed | None displayed |

#### TC-ENTRY-010: Validation Errors

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit empty form | All required fields show errors |
| 2 | Enter title > 120 chars | "Max 120 characters" error |
| 3 | Enter negative amount | "Must be positive" error |
| 4 | Set end_date < start_date | "Must be >= start_date" error |
| 5 | Weekly without weekday derived | Validation error |

### 4.3 Projection Module

#### TC-PROJ-001: Initial Balance Setup

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | New user logs in | Starting balance modal appears |
| 2 | Enter amount "10000" | Amount validated |
| 3 | Select effective date | Date set |
| 4 | Submit | Balance saved, modal closes |
| 5 | Projection panel shows balance | Correct amount displayed |

#### TC-PROJ-002: Projection Calculation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set starting balance 10000 on 2025-01-01 | Balance saved |
| 2 | Create income 5000 on 2025-01-15 | Entry created |
| 3 | Create expense 2000 on 2025-01-20 | Entry created |
| 4 | View projection for 2025-01-31 | Balance: 13000 |
| 5 | Verify computation breakdown | Income: 5000, Expense: 2000, Net: +3000 |

#### TC-PROJ-003: Projection with Recurring Entries

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create weekly income 1000 starting 2025-01-01 | Entry created |
| 2 | Create monthly expense 3000 on 15th | Entry created |
| 3 | View projection for 2025-01-31 | Includes 4-5 weekly, 1 monthly |
| 4 | Verify calculation accuracy | Balance computed correctly |

#### TC-PROJ-004: Date Range Limits

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set starting balance effective 2025-01-01 | Balance saved |
| 2 | Request projection for 2024-12-31 | Error or null (before effective) |
| 3 | Request projection for 2035-01-01 | Valid (within +10 years) |
| 4 | Request projection for 2036-01-01 | Error (beyond max) |

### 4.4 Settings Module

#### TC-SET-001: Update Starting Balance

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings > Wallet | Wallet settings displayed |
| 2 | Edit starting balance amount | Form updated |
| 3 | Submit changes | Balance updated, toast shown |
| 4 | View projection | Uses new balance |

#### TC-SET-002: Change Password

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings > Account | Account settings displayed |
| 2 | Enter current password | Validated |
| 3 | Enter new password | Password requirements shown |
| 4 | Confirm new password | Match validated |
| 5 | Submit | Password updated |
| 6 | Logout and login with new password | Success |

#### TC-SET-003: Export Data (CSV)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings > Privacy | Privacy settings displayed |
| 2 | Click "Export Data" | Export initiated |
| 3 | CSV file downloaded | Valid CSV format |
| 4 | Verify headers | occurrence_id, series_id, type, title, description, date, amount_pln, created_at, updated_at |
| 5 | Verify data rows | All occurrences included |

#### TC-SET-004: Delete Account

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Settings > Privacy | Delete account section visible |
| 2 | Click "Delete Account" | Confirmation dialog opens |
| 3 | Type "DELETE MY ACCOUNT" | Confirmation validated |
| 4 | Confirm deletion | Account deleted |
| 5 | All user data removed | entries, exceptions, balance, analytics |
| 6 | Auth user removed | Cannot login |
| 7 | Redirect to login page | Session cleared |

### 4.5 Security Test Cases

#### TC-SEC-001: Row Level Security (Data Isolation)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User A creates entries | Entries saved |
| 2 | User B logs in | Session established |
| 3 | User B queries entries | Only User B's entries returned |
| 4 | User B attempts to access User A's entry by ID | 404 Not Found |

#### TC-SEC-002: API Authentication Bypass Attempts

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Call `/api/entries` without token | 401 Unauthorized |
| 2 | Call with expired token | 401 Unauthorized |
| 3 | Call with malformed token | 401 Unauthorized |
| 4 | Call with different user's token | Only that user's data |

#### TC-SEC-003: Input Validation Security

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit SQL injection in title | Properly escaped, no injection |
| 2 | Submit XSS payload in description | Sanitized output |
| 3 | Submit oversized payload | Validation error |
| 4 | Submit invalid data types | Type coercion/validation error |

### 4.6 Edge Cases and Error Handling

#### TC-EDGE-001: Monthly Recurrence on 29th-31st

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create monthly entry on 31st | day_of_month = 31 |
| 2 | Expand occurrences for Feb 2024 | Occurrence on Feb 29 |
| 3 | Expand occurrences for Feb 2025 | Occurrence on Feb 28 |
| 4 | Expand occurrences for April | Occurrence on April 30 |

#### TC-EDGE-002: Exception Date Validation

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create series from 2025-01-01 to 2025-03-31 | Series created |
| 2 | Attempt exception on 2024-12-31 | Error: "before start date" |
| 3 | Attempt exception on 2025-04-01 | Error: "after end date" |
| 4 | Create exception on 2025-02-15 | Success |

#### TC-EDGE-003: Concurrent Modification

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | User opens entry in two tabs | Both show same data |
| 2 | User edits in Tab A, submits | Update successful |
| 3 | User edits in Tab B, submits | Update with updated_at check |
| 4 | Verify final state | Consistent data |

#### TC-EDGE-004: Empty State Handling

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | New user with no entries | Empty state message displayed |
| 2 | Filter with no results | "No entries found" message |
| 3 | Export with no data | Empty CSV (headers only) or message |

---

## 5. Test Environment

### 5.1 Development Environment

| Component | Specification |
|-----------|---------------|
| **OS** | Windows 10/11, macOS, Linux |
| **Node.js** | 20.x LTS |
| **Package Manager** | npm |
| **Database** | Supabase Local (Docker) |
| **Browser** | Chrome DevTools |

### 5.2 Staging Environment

| Component | Specification |
|-----------|---------------|
| **Hosting** | DigitalOcean App Platform |
| **Database** | Supabase Cloud (Staging Project) |
| **Domain** | staging.expense-plotter.example.com |
| **SSL** | Enabled |

### 5.3 Production Environment

| Component | Specification |
|-----------|---------------|
| **Hosting** | DigitalOcean App Platform |
| **Database** | Supabase Cloud (Production Project) |
| **Domain** | expense-plotter.example.com |
| **SSL** | Enabled |
| **CDN** | DigitalOcean Spaces CDN |

### 5.4 Test Data Requirements

- **Users**: 5 test accounts with varying data volumes
- **Entries**: Mix of one-time, weekly, monthly entries
- **Date Range**: 2024-01-01 to 2026-12-31
- **Edge Cases**: Entries on month boundaries, leap years

---

## 6. Testing Tools

### 6.1 Test Frameworks

| Tool | Purpose | Configuration |
|------|---------|---------------|
| **Vitest** | Unit & Integration tests | `vitest.config.ts` |
| **React Testing Library** | Component tests | `@testing-library/react` |
| **Playwright** | E2E tests | `playwright.config.ts` |
| **MSW** | External API mocking | Only for 3rd party APIs (not internal backend) |

### 6.2 Code Quality Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code linting |
| **TypeScript** | Type checking |
| **Prettier** | Code formatting |

### 6.3 Database Testing

| Tool | Purpose |
|------|---------|
| **Supabase CLI** | Local database management & migrations |
| **Vitest** | Integration tests against local DB instance |
| **Supabase Client** | Executing DB functions & RLS verification |

### 6.4 CI/CD Integration

| Tool | Purpose |
|------|---------|
| **GitHub Actions** | Automated test execution |
| **Vitest / Codecov** | Coverage reporting (Native v8 or external) |

### 6.5 Recommended Test Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['node_modules', 'dist', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 7. Test Schedule

### 7.1 Sprint-Based Testing

| Phase | Duration | Activities |
|-------|----------|------------|
| **Unit Test Development** | Ongoing with features | Write tests alongside code |
| **Integration Testing** | End of each sprint | API and service layer tests |
| **E2E Testing** | End of each sprint | Critical path automation |
| **Regression Testing** | Before release | Full test suite execution |

### 7.2 Release Testing Timeline

| Day | Activity |
|-----|----------|
| D-5 | Code freeze, begin regression testing |
| D-4 | Complete automated regression suite |
| D-3 | Manual exploratory testing |
| D-2 | Bug fixes and retesting |
| D-1 | Final sanity check |
| D-0 | Production deployment |

### 7.3 Test Execution Frequency

| Test Type | Frequency | Trigger |
|-----------|-----------|---------|
| Unit Tests | Every commit | Pre-commit hook, CI |
| Integration Tests | Every PR | GitHub Actions |
| E2E Tests | Daily | Nightly build |
| Performance Tests | Weekly | Scheduled job |
| Security Scans | Weekly | Scheduled job |

---

## 8. Acceptance Criteria

### 8.1 Functional Acceptance

- [ ] All critical path test cases pass (100%)
- [ ] All high priority test cases pass (100%)
- [ ] All medium priority test cases pass (≥95%)
- [ ] No critical or high severity bugs open
- [ ] All regression tests pass

### 8.2 Code Coverage Thresholds

| Metric | Minimum | Target |
|--------|---------|--------|
| Line Coverage | 70% | 80% |
| Branch Coverage | 65% | 75% |
| Function Coverage | 75% | 85% |

### 8.3 Performance Criteria

| Metric | Threshold |
|--------|-----------|
| API Response Time (p95) | < 500ms |
| Page Load Time | < 3s |
| Time to Interactive | < 5s |
| Projection Calculation | < 1s for 1 year |

### 8.4 Security Criteria

- [ ] No high or critical vulnerabilities
- [ ] All RLS policies verified
- [ ] No unauthorized data access possible
- [ ] All inputs validated and sanitized

---

## 9. Roles and Responsibilities

### 9.1 RACI Matrix

| Activity | Developer | QA Engineer | Tech Lead | Product Owner |
|----------|-----------|-------------|-----------|---------------|
| Unit Test Writing | R | C | A | I |
| Integration Test Writing | R | R | A | I |
| E2E Test Writing | C | R | A | I |
| Test Plan Creation | C | R | A | I |
| Test Execution | R | R | I | I |
| Bug Triage | C | R | A | C |
| Release Sign-off | I | C | R | A |

**Legend**: R = Responsible, A = Accountable, C = Consulted, I = Informed

### 9.2 Role Descriptions

**Developer**
- Write unit tests for own code
- Fix bugs within SLA
- Participate in code reviews
- Maintain test coverage standards

**QA Engineer**
- Create and maintain test plan
- Write integration and E2E tests
- Execute manual exploratory testing
- Report and track defects

**Tech Lead**
- Review test strategy
- Approve test coverage thresholds
- Technical sign-off on releases
- Resolve testing blockers

**Product Owner**
- Define acceptance criteria
- Prioritize bug fixes
- Final release approval
- User acceptance testing coordination

---

## 10. Bug Reporting Procedures

### 10.1 Bug Report Template

```markdown
## Bug Title
[Clear, concise description]

## Severity
- [ ] Critical (System crash, data loss, security breach)
- [ ] High (Major feature broken, no workaround)
- [ ] Medium (Feature impaired, workaround exists)
- [ ] Low (Minor issue, cosmetic)

## Environment
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Environment: [Dev/Staging/Production]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Result
[What should happen]

## Actual Result
[What actually happened]

## Screenshots/Logs
[Attach relevant evidence]

## Additional Context
[Any other information]
```

### 10.2 Bug Severity Definitions

| Severity | Definition | SLA |
|----------|------------|-----|
| **Critical** | System unusable, data corruption, security issue | 4 hours |
| **High** | Major feature broken, no workaround | 1 business day |
| **Medium** | Feature impaired, workaround available | 3 business days |
| **Low** | Minor issue, cosmetic defect | Next sprint |

### 10.3 Bug Lifecycle

```
New → Triaged → In Progress → In Review → Verified → Closed
                    ↓
               Won't Fix / Duplicate / Cannot Reproduce
```

### 10.4 Bug Tracking

- **Tool**: GitHub Issues
- **Labels**: `bug`, `severity-*`, `module-*`
- **Milestones**: Sprint/Release based
- **Assignees**: Based on module ownership

---

## 11. Appendix

### A. Test Data Scenarios

#### A.1 User Profiles

| User ID | Description | Data Volume |
|---------|-------------|-------------|
| test-user-1 | New user, minimal data | 0 entries |
| test-user-2 | Typical user | 20 entries, mixed types |
| test-user-3 | Power user | 100+ entries, complex recurrence |
| test-user-4 | Edge case user | Entries on boundaries |
| test-user-5 | Historical user | 3+ years of data |

#### A.2 Entry Templates

```json
{
  "one_time_income": {
    "entry_type": "income",
    "recurrence_type": "one_time",
    "title": "Bonus Payment",
    "amount": 5000,
    "start_date": "2025-01-15"
  },
  "weekly_expense": {
    "entry_type": "expense",
    "recurrence_type": "weekly",
    "title": "Groceries",
    "amount": 200,
    "start_date": "2025-01-06",
    "weekday": 1
  },
  "monthly_expense": {
    "entry_type": "expense",
    "recurrence_type": "monthly",
    "title": "Rent",
    "amount": 3000,
    "start_date": "2025-01-01",
    "day_of_month": 1
  }
}
```

### B. API Endpoint Test Matrix

| Endpoint | Method | Auth | Test Coverage |
|----------|--------|------|---------------|
| `/api/auth/login` | POST | No | TC-AUTH-002, TC-AUTH-003 |
| `/api/auth/register` | POST | No | TC-AUTH-001 |
| `/api/auth/logout` | POST | Yes | TC-AUTH-005 |
| `/api/auth/change-password` | POST | Yes | TC-SET-002 |
| `/api/entries` | GET | Yes | TC-ENTRY-*, TC-SEC-001 |
| `/api/entries` | POST | Yes | TC-ENTRY-001-003 |
| `/api/entries/[id]` | GET | Yes | TC-SEC-001 |
| `/api/entries/[id]` | PUT | Yes | TC-ENTRY-004-006 |
| `/api/entries/[id]` | DELETE | Yes | TC-ENTRY-007-009 |
| `/api/occurrences` | GET | Yes | TC-PROJ-002-003 |
| `/api/projection` | GET | Yes | TC-PROJ-001-004 |
| `/api/starting-balance` | GET | Yes | TC-PROJ-001 |
| `/api/starting-balance` | PUT | Yes | TC-SET-001 |
| `/api/export/csv` | GET | Yes | TC-SET-003 |
| `/api/account` | DELETE | Yes | TC-SET-004 |

### C. Database Function Test Cases

#### C.1 expand_occurrences()

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| One-time within range | from: 2025-01-01, to: 2025-01-31, entry on 2025-01-15 | 1 occurrence |
| One-time outside range | from: 2025-02-01, to: 2025-02-28, entry on 2025-01-15 | 0 occurrences |
| Weekly full month | from: 2025-01-01, to: 2025-01-31, weekly Monday | 4-5 occurrences |
| Monthly with clamping | from: 2025-02-01, to: 2025-02-28, day_of_month: 31 | 1 occurrence on 28th |
| With skip exception | Series + skip on 2025-01-15 | Occurrence excluded |
| With override exception | Series + override on 2025-01-15 | Override values used |

#### C.2 project_balance()

| Test Case | Starting Balance | Entries | Target Date | Expected Balance |
|-----------|------------------|---------|-------------|------------------|
| No entries | 10000 | None | 2025-01-31 | 10000 |
| Income only | 10000 | +5000 on 15th | 2025-01-31 | 15000 |
| Expense only | 10000 | -3000 on 15th | 2025-01-31 | 7000 |
| Mixed | 10000 | +5000, -3000 | 2025-01-31 | 12000 |
| Before effective | 10000 (2025-01-01) | - | 2024-12-31 | NULL |

### D. Glossary

| Term | Definition |
|------|------------|
| **Entry Series** | A record representing an income or expense, can be one-time or recurring |
| **Occurrence** | A single instance of an entry on a specific date |
| **Exception** | A modification (skip or override) to a specific occurrence in a series |
| **Projection** | Calculated future balance based on starting balance and entries |
| **RLS** | Row Level Security - database-level access control |
| **Scope** | Edit/delete range: occurrence, future, or entire series |

---

*Document Version: 1.0*  
*Last Updated: 2025-01-11*  
*Author: QA Team*

