import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { startingBalanceFormSchema, type StartingBalanceFormValues } from "./schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type UpsertStartingBalanceCommand } from "@/types";

interface StartingBalanceFormProps {
  onSubmit: (data: UpsertStartingBalanceCommand) => Promise<void>;
}

export const StartingBalanceForm: React.FC<StartingBalanceFormProps> = ({ onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StartingBalanceFormValues>({
    resolver: zodResolver(startingBalanceFormSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const handleFormSubmit = async (data: StartingBalanceFormValues) => {
    setIsLoading(true);
    try {
      // Transform Date to string for API
      const command: UpsertStartingBalanceCommand = {
        amount: data.amount,
        effective_date: data.effective_date.toISOString().split("T")[0],
      };
      await onSubmit(command);
    } catch (error) {
      console.error("Failed to submit starting balance", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Starting Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="effective_date">Effective Date</Label>
        <Input
          id="effective_date"
          type="date"
          {...register("effective_date", {
            valueAsDate: true,
          })}
        />
        {errors.effective_date && <p className="text-sm text-red-500">{errors.effective_date.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : "Set Starting Balance"}
      </Button>
    </form>
  );
};
