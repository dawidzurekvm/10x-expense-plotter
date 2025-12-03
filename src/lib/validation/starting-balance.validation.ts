/**
 * Validation schemas for Starting Balance endpoints
 * Uses Zod for runtime type checking and validation
 */

import { z } from "zod";

/**
 * Helper function to validate if a string is a valid date in YYYY-MM-DD format
 */
function isValidDate(dateString: string): boolean {
  // Check format with regex
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }

  // Parse and validate the date
  const date = new Date(dateString);
  const [year, month, day] = dateString.split("-").map(Number);

  // Check if the date is valid (not NaN and matches the input)
  return (
    !isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  );
}

/**
 * Helper function to validate that a number has at most 2 decimal places
 */
function hasAtMostTwoDecimalPlaces(value: number): boolean {
  // Convert to string and check decimal places
  const stringValue = value.toString();
  const decimalIndex = stringValue.indexOf(".");

  // If no decimal point, it's valid
  if (decimalIndex === -1) {
    return true;
  }

  // Check if there are more than 2 decimal places
  const decimalPlaces = stringValue.length - decimalIndex - 1;
  return decimalPlaces <= 2;
}

/**
 * Validation schema for UpsertStartingBalanceCommand
 * Used to validate PUT /api/starting-balance request body
 */
export const upsertStartingBalanceSchema = z.object({
  effective_date: z
    .string({
      required_error: "Effective date is required",
      invalid_type_error: "Effective date must be a string",
    })
    .refine((val) => isValidDate(val), {
      message: "Must be a valid date in YYYY-MM-DD format",
    }),
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .min(0, {
      message: "Amount must be non-negative",
    })
    .refine((val) => hasAtMostTwoDecimalPlaces(val), {
      message: "Amount must have at most 2 decimal places",
    }),
});

/**
 * Type inference from schema
 */
export type UpsertStartingBalanceInput = z.infer<
  typeof upsertStartingBalanceSchema
>;
