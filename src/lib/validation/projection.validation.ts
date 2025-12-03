import { z } from "zod";

/**
 * Zod schema for validating GET /api/projection query parameters
 * Validates that date parameter is present and in correct format
 */
export const getProjectionQuerySchema = z.object({
  date: z
    .string({
      required_error: "Date parameter is required",
    })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD")
    .refine((dateStr) => {
      // Validate that it's a real calendar date
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) && dateStr === date.toISOString().split("T")[0];
    }, "Invalid date"),
});

/**
 * Validates that the target date is within acceptable range
 * @param targetDate - The target date to validate (YYYY-MM-DD)
 * @param startingBalanceDate - The starting balance effective date (YYYY-MM-DD)
 * @returns Validation result with error message if invalid
 */
export function validateProjectionDateRange(
  targetDate: string,
  startingBalanceDate: string
): { valid: boolean; error?: string } {
  const target = new Date(targetDate);
  const startingDate = new Date(startingBalanceDate);

  // Calculate max date (current date + 10 years)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 10);
  const maxDateStr = maxDate.toISOString().split("T")[0];

  // Validate target date is not before starting balance date
  if (target < startingDate) {
    return {
      valid: false,
      error: `Date must be on or after starting balance effective date (${startingBalanceDate})`,
    };
  }

  // Validate target date is not more than 10 years in the future
  if (target > maxDate) {
    return {
      valid: false,
      error: `Date cannot be more than 10 years in the future (max: ${maxDateStr})`,
    };
  }

  return { valid: true };
}
