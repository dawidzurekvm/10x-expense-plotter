/**
 * Generates a unique entry title with timestamp for test isolation
 */
export function generateUniqueEntryTitle(prefix = 'Test Entry') {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${prefix} ${timestamp}-${randomSuffix}`;
}

/**
 * Generates test data for entry creation
 */
export function generateEntryData(overrides?: {
  titlePrefix?: string;
  amount?: number;
  recurrence?: 'one_time' | 'weekly' | 'monthly' | 'yearly';
}) {
  return {
    title: generateUniqueEntryTitle(overrides?.titlePrefix ?? 'Test Entry'),
    amount: overrides?.amount ?? Math.round(Math.random() * 10000) / 100,
    recurrence: overrides?.recurrence ?? 'one_time' as const,
  };
}

