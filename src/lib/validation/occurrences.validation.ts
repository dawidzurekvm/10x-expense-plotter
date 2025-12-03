/**
 * Validation schemas for occurrences endpoints
 *
 * This file contains Zod schemas for validating query parameters
 * for the occurrences API endpoints.
 */

import { z } from "zod";
import type { GetOccurrencesQueryParams, GetEntryOccurrencesQueryParams } from "../../types";

// ============================================================================
// Date Validation Helpers
// ============================================================================

/**
 * Regex pattern for YYYY-MM-DD date format
 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Maximum allowed date range in days (10 years)
 */
const MAX_DATE_RANGE_DAYS = 3650;

/**
 * Validates a date string and ensures it's a valid date
 */
const dateStringSchema = z
  .string()
  .regex(DATE_PATTERN, "Date must be in YYYY-MM-DD format")
  .refine(
    (dateStr) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    },
    { message: "Invalid date" }
  );

/**
 * Calculates the difference in days between two dates
 */
function calculateDateRangeDays(fromDate: string, toDate: string): number {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffTime = to.getTime() - from.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================================================
// Query Parameter Schemas
// ============================================================================

/**
 * Schema for GET /api/occurrences query parameters
 *
 * Validates:
 * - from_date: required, YYYY-MM-DD format
 * - to_date: required, YYYY-MM-DD format
 * - entry_type: optional, "income" or "expense"
 * - limit: optional, 1-1000, default 100
 * - offset: optional, >= 0, default 0
 * - to_date >= from_date
 * - date range <= 10 years (3650 days)
 */
export const getOccurrencesQuerySchema = z
  .object({
    from_date: dateStringSchema,
    to_date: dateStringSchema,
    entry_type: z.enum(["income", "expense"]).optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1, "limit must be at least 1")
      .max(1000, "limit must not exceed 1000")
      .default(100),
    offset: z.coerce.number().int().min(0, "offset must be at least 0").default(0),
  })
  .refine(
    (data) => {
      return data.to_date >= data.from_date;
    },
    {
      message: "to_date must be greater than or equal to from_date",
      path: ["to_date"],
    }
  )
  .refine(
    (data) => {
      const rangeDays = calculateDateRangeDays(data.from_date, data.to_date);
      return rangeDays <= MAX_DATE_RANGE_DAYS;
    },
    {
      message: `Date range cannot exceed 10 years (${MAX_DATE_RANGE_DAYS} days)`,
      path: ["date_range"],
    }
  ) satisfies z.ZodSchema<GetOccurrencesQueryParams>;

/**
 * Schema for GET /api/entries/:id/occurrences query parameters
 *
 * Validates:
 * - from_date: required, YYYY-MM-DD format
 * - to_date: required, YYYY-MM-DD format
 * - to_date >= from_date
 */
export const getEntryOccurrencesQuerySchema = z
  .object({
    from_date: dateStringSchema,
    to_date: dateStringSchema,
  })
  .refine(
    (data) => {
      return data.to_date >= data.from_date;
    },
    {
      message: "to_date must be greater than or equal to from_date",
      path: ["to_date"],
    }
  ) satisfies z.ZodSchema<GetEntryOccurrencesQueryParams>;

/**
 * Schema for validating UUID format
 * Used for validating entry series ID in URL parameters
 */
export const uuidSchema = z.string().uuid("id must be a valid UUID");
