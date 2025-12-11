import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils', () => {
  describe('cn - className utility', () => {
    it('should merge class names correctly', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'truthy', false && 'falsy');
      expect(result).toContain('base');
      expect(result).toContain('truthy');
      expect(result).not.toContain('falsy');
    });

    it('should handle empty strings and undefined', () => {
      const result = cn('base', '', undefined, 'end');
      expect(result).toContain('base');
      expect(result).toContain('end');
    });
  });
});

