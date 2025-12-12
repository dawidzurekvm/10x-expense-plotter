# E2E Tests Directory

This directory contains end-to-end tests using Playwright.

## Directory Structure

```
e2e/
├── pages/          # Page Object Models
├── fixtures/       # Test fixtures and data
├── utils/          # Helper utilities
└── *.spec.ts       # Test files
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug

# Generate tests with codegen
npm run test:e2e:codegen

# View test report
npm run test:e2e:report
```

## Writing Tests

Follow the Page Object Model pattern for maintainable tests:

```typescript
// pages/LoginPage.ts
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}

// login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  
  await expect(page).toHaveURL('/dashboard');
});
```

## Best Practices

1. **Use Page Object Model** - Encapsulate page interactions
2. **Use semantic locators** - Prefer role, label over CSS selectors
3. **Isolate tests** - Use browser contexts for test isolation
4. **Avoid hard waits** - Use `waitFor*` methods
5. **Test critical paths** - Focus on key user journeys
6. **Visual testing** - Use `toHaveScreenshot()` for visual regression

