import { z } from "zod";

export const startingBalanceFormSchema = z.object({
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be positive")
    .max(9999999999.99, "Amount is too large"),
  effective_date: z.date({
    required_error: "Date is required",
    invalid_type_error: "Date is invalid",
  }),
});

export type StartingBalanceFormValues = z.infer<typeof startingBalanceFormSchema>;
