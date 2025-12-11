import { describe, it, expect, vi } from 'vitest';

describe('Example Unit Test', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('should perform arithmetic operations', () => {
    expect(1 + 1).toBe(2);
    expect(5 * 3).toBe(15);
  });

  it('should mock a function', () => {
    const mockFn = vi.fn().mockReturnValue('mocked value');
    
    const result = mockFn();
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(result).toBe('mocked value');
  });

  it('should work with arrays', () => {
    const numbers = [1, 2, 3, 4, 5];
    
    expect(numbers).toHaveLength(5);
    expect(numbers).toContain(3);
    expect(numbers[0]).toBe(1);
  });

  it('should work with objects', () => {
    const user = {
      name: 'John Doe',
      age: 30,
      email: 'john@example.com',
    };
    
    expect(user).toHaveProperty('name');
    expect(user.name).toBe('John Doe');
    expect(user).toMatchObject({ age: 30 });
  });
});

