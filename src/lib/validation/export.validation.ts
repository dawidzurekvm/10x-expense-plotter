import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validation schema for CSV export query parameters
 * GET /api/export/csv
 */
export const exportCSVQuerySchema = z
  .object({
    from_date: z.string().regex(dateRegex, "Invalid date format. Expected YYYY-MM-DD").optional(),
    to_date: z.string().regex(dateRegex, "Invalid date format. Expected YYYY-MM-DD").optional(),
    entry_type: z
      .enum(["income", "expense"], {
        errorMap: () => ({ message: "Invalid entry type. Must be 'income' or 'expense'" }),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.from_date && data.to_date) {
        return new Date(data.to_date) >= new Date(data.from_date);
      }
      return true;
    },
    {
      message: "End date must be greater than or equal to start date",
      path: ["to_date"],
    }
  )
  .refine(
    (data) => {
      if (data.from_date && data.to_date) {
        const daysDiff = Math.abs(
          (new Date(data.to_date).getTime() - new Date(data.from_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysDiff <= 36500; // 100 years
      }
      return true;
    },
    {
      message: "Date range cannot exceed 100 years",
      path: ["to_date"],
    }
  );
