# Testing Guide

This project uses **Vitest** for unit and integration tests, and **Playwright** for end-to-end (E2E) tests.

## 🧪 Unit & Integration Testing (Vitest)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with UI interface
npm run test:ui

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

### Writing Unit Tests

Unit tests should be placed in the `tests/unit/` directory or co-located with source files using the `*.test.ts` or `*.test.tsx` naming convention.

Example:

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('MyFunction', () => {
  it('should return expected value', () => {
    const result = myFunction(42);
    expect(result).toBe(84);
  });

  it('should handle edge cases', () => {
    expect(myFunction(0)).toBe(0);
  });
});
```

### Testing React Components

Use React Testing Library for component tests:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Mocking

Vitest provides powerful mocking capabilities:

```typescript
import { vi } from 'vitest';

// Mock a function
const mockFn = vi.fn().mockReturnValue('mocked');

// Spy on existing function
const spy = vi.spyOn(obj, 'method');

// Mock a module
vi.mock('@/lib/service', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mock' }),
}));
```

## 🎭 E2E Testing (Playwright)

### Running E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Generate test code using codegen
npm run test:e2e:codegen

# Show test report
npm run test:e2e:report
```

### Writing E2E Tests

E2E tests should be placed in the `e2e/` directory with the `*.spec.ts` naming convention.

Example:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should allow user to login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });
});
```

### Page Object Model

For better maintainability, use the Page Object Model pattern:

```typescript
// e2e/pages/LoginPage.ts
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

// e2e/login.spec.ts
test('should login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password123');
  
  await expect(page).toHaveURL('/dashboard');
});
```

## 🎯 Best Practices

### Unit Tests
- Follow the Arrange-Act-Assert pattern
- Test one thing per test case
- Use descriptive test names
- Mock external dependencies
- Leverage `vi` object for test doubles
- Use inline snapshots for readable assertions

### E2E Tests
- Use the Page Object Model for maintainability
- Use semantic locators (role, label, etc.)
- Avoid hard-coded waits (use `waitFor` instead)
- Test critical user journeys
- Keep tests independent and isolated
- Use browser contexts for isolation

## 📊 Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

To view the HTML report, open `coverage/index.html` in your browser.

## 🔧 Configuration

- Vitest configuration: `vitest.config.ts`
- Playwright configuration: `playwright.config.ts`
- Test setup file: `src/test/setup.ts`

## 📚 Documentation

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)

