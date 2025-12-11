import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StartingBalanceDTO, UpsertStartingBalanceCommand } from "@/types";

// Form schema for starting balance
const startingBalanceFormSchema = z.object({
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .min(0, "Amount cannot be negative")
    .max(9999999999.99, "Amount is too large"),
  effective_date: z.string().min(1, "Date is required"),
});

type StartingBalanceFormValues = z.infer<typeof startingBalanceFormSchema>;

interface WalletSettingsProps {
  initialStartingBalance?: StartingBalanceDTO | null;
}

export function WalletSettings({ initialStartingBalance }: WalletSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StartingBalanceFormValues>({
    resolver: zodResolver(startingBalanceFormSchema),
    defaultValues: {
      amount: initialStartingBalance?.amount ?? 0,
      effective_date: initialStartingBalance?.effective_date ?? new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: StartingBalanceFormValues) => {
    setIsLoading(true);
    try {
      const command: UpsertStartingBalanceCommand = {
        amount: data.amount,
        effective_date: data.effective_date,
      };

      const response = await fetch("/api/starting-balance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update starting balance");
      }

      toast.success("Starting balance updated successfully");
    } catch (error) {
      console.error("Failed to update starting balance:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update starting balance");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Starting Balance</CardTitle>
        <CardDescription>
          Set your initial wallet balance and the date it becomes effective. This is used as
          the starting point for all balance projections.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (PLN)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="effective_date">Effective Date</Label>
            <Input
              id="effective_date"
              type="date"
              {...register("effective_date")}
            />
            {errors.effective_date && (
              <p className="text-sm text-destructive">{errors.effective_date.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

