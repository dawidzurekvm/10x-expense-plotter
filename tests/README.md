# Unit & Integration Tests Directory

This directory contains unit and integration tests using Vitest.

## Directory Structure

```
tests/
├── unit/           # Unit tests
└── integration/    # Integration tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode (recommended for development)
npm run test:watch

# Run with UI
npm run test:ui

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

## Writing Unit Tests

Place unit tests in `tests/unit/` or co-locate with source files using `*.test.ts` or `*.test.tsx` extension.

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('MyFunction', () => {
  it('should perform calculation', () => {
    const result = myFunction(5);
    expect(result).toBe(10);
  });
  
  it('should handle edge cases', () => {
    expect(myFunction(0)).toBe(0);
  });
});
```

## Testing React Components

Use React Testing Library:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render and handle clicks', async () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

## Writing Integration Tests

Place integration tests in `tests/integration/` to test API endpoints, database interactions, and component integrations.

```typescript
import { describe, it, expect } from 'vitest';

describe('API Integration', () => {
  it('should fetch data from API', async () => {
    const response = await fetch('/api/data');
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data).toHaveProperty('items');
  });
});
```

## Mocking with Vitest

### Mock Functions

```typescript
const mockFn = vi.fn().mockReturnValue('mocked');
const result = mockFn();
expect(mockFn).toHaveBeenCalled();
```

### Mock Modules

```typescript
vi.mock('@/lib/service', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'mock' }),
}));
```

### Spy on Functions

```typescript
const spy = vi.spyOn(obj, 'method');
obj.method();
expect(spy).toHaveBeenCalled();
```

## Best Practices

1. **Arrange-Act-Assert** - Structure tests clearly
2. **One assertion per test** - Test one thing at a time
3. **Descriptive names** - Use clear test descriptions
4. **Mock external dependencies** - Isolate the code under test
5. **Use type checking** - Leverage TypeScript in tests
6. **Avoid implementation details** - Test behavior, not implementation
7. **Use inline snapshots** - For complex output validation

