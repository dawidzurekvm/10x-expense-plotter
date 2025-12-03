import { z } from "zod";
import type {
  CreateEntryCommand,
  UpdateEntryCommand,
  GetEntriesQueryParams,
  UpdateEntryQueryParams,
  DeleteEntryQueryParams,
} from "../../types";

// Define enums for Zod (matching types.ts)
const EntryTypeEnum = z.enum(["income", "expense"]);
const RecurrenceTypeEnum = z.enum(["one_time", "weekly", "monthly"]);

// Base schema for entry commands (create and update share the same structure)
const entryCommandBase = z.object({
  entry_type: EntryTypeEnum,
  recurrence_type: RecurrenceTypeEnum,
  title: z.string().min(1).max(120),
  description: z.string().max(500).nullable(),
  amount: z.number().positive(),
  start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "start_date must be YYYY-MM-DD")
    .transform((val) => new Date(val)),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "end_date must be YYYY-MM-DD")
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  weekday: z.number().int().min(0).max(6).nullable(),
  day_of_month: z.number().int().min(1).max(31).nullable(),
});

// Refinement for date range: end_date >= start_date
const entryCommandWithDateRefine = entryCommandBase.refine(
  (data) => !data.end_date || data.end_date >= data.start_date,
  {
    message: "end_date must be greater than or equal to start_date",
    path: ["end_date"],
  },
);

export const createEntrySchema = entryCommandWithDateRefine
  .refine(
    (data) => {
      const { recurrence_type, weekday, day_of_month } = data;
      switch (recurrence_type) {
        case "one_time":
          return weekday === null && day_of_month === null;
        case "weekly":
          return weekday !== null && day_of_month === null;
        case "monthly":
          return weekday === null && day_of_month !== null;
        default:
          return false;
      }
    },
    {
      message:
        "Recurrence type requires specific weekday or day_of_month configuration",
      path: ["recurrence_type"],
    },
  )
  .transform((val) => ({
    ...val,
    start_date: val.start_date.toISOString().split("T")[0],
    end_date: val.end_date ? val.end_date.toISOString().split("T")[0] : null,
  })) as z.ZodSchema<CreateEntryCommand>;

// Update uses the same schema as create
export const updateEntrySchema =
  createEntrySchema as z.ZodSchema<UpdateEntryCommand>;

// Query schema for GET /api/entries
export const getEntriesQuerySchema = z.object({
  entry_type: EntryTypeEnum.optional(),
  recurrence_type: RecurrenceTypeEnum.optional(),
  start_date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "start_date_from must be YYYY-MM-DD")
    .transform((val) => new Date(val))
    .transform((val) => val.toISOString().split("T")[0])
    .optional(),
  start_date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "start_date_to must be YYYY-MM-DD")
    .transform((val) => new Date(val))
    .transform((val) => val.toISOString().split("T")[0])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sort_by: z.enum(["start_date", "created_at", "amount"]).optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
}) satisfies z.ZodSchema<GetEntriesQueryParams>;

// Query schema for PUT /api/entries/:id and DELETE /api/entries/:id
const scopeQueryBase = z.object({
  scope: z.enum(["occurrence", "future", "entire"]),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
    .transform((val) => new Date(val))
    .transform((val) => val.toISOString().split("T")[0])
    .optional(),
});

// Refinement for date requirement based on scope
const scopeQueryWithRefine = scopeQueryBase.refine(
  (data) => {
    if (data.scope === "occurrence" || data.scope === "future") {
      return !!data.date;
    }
    return true;
  },
  {
    message: "date is required for scope=occurrence or scope=future",
    path: ["date"],
  },
);

export const updateEntryQuerySchema =
  scopeQueryWithRefine as z.ZodSchema<UpdateEntryQueryParams>;
export const deleteEntryQuerySchema =
  scopeQueryWithRefine as z.ZodSchema<DeleteEntryQueryParams>;
