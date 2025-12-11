/**
 * Account Management Validation Schemas
 * Handles validation for account-related operations
 */

import { z } from "zod";
import type { DeleteAccountCommand } from "../../types";

/**
 * Validation schema for DELETE /api/account
 * Requires exact confirmation string to prevent accidental deletion
 */
export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT", {
    errorMap: () => ({
      message: 'Confirmation must be exactly "DELETE MY ACCOUNT"',
    }),
  }),
}) satisfies z.ZodSchema<DeleteAccountCommand>;

export type DeleteAccountCommandValidated = z.infer<typeof deleteAccountSchema>;

