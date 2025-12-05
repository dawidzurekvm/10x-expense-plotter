import { z } from "zod";
import type { EntryType, OccurrenceDTO, EntrySeriesDetailDTO } from "@/types";

// We can't import runtime values from type-only imports, so we redefine literals for Zod
// These must match the database enums
export const ENTRY_TYPES = ["income", "expense"] as const;
export const RECURRENCE_TYPES = ["one_time", "weekly", "monthly"] as const;

export const entryFormSchema = z
  .object({
    entry_type: z.enum(ENTRY_TYPES),
    title: z.string().min(1, "Title is required").max(120, "Title must be 120 characters or less"),
    amount: z.coerce.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
    description: z.string().max(500, "Description must be 500 characters or less").optional().or(z.literal("")),
    start_date: z.date({
      required_error: "Start date is required",
      invalid_type_error: "Invalid date",
    }),
    recurrence_type: z.enum(RECURRENCE_TYPES),
    end_date: z.date().optional(),
    // Derived/Hidden fields
    weekday: z.number().min(0).max(6).optional(),
    day_of_month: z.number().min(1).max(31).optional(),
  })
  .refine(
    (data) => {
      if (data.end_date && data.start_date) {
        return data.end_date >= data.start_date;
      }
      return true;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["end_date"],
    }
  );

export type EntryFormValues = z.infer<typeof entryFormSchema>;

export interface DashboardFilters {
  dateRange: { from: Date | undefined; to: Date | undefined };
  entryType: EntryType | "all";
}

export interface EntryMutationState {
  type: "create" | "edit" | "delete";
  occurrence?: OccurrenceDTO; // The occurrence that triggered the action
  seriesDetail?: EntrySeriesDetailDTO; // Fetched details for editing/deleting
  formData?: EntryFormValues; // Temporarily holds form data while waiting for scope
}
