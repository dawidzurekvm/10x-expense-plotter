import React from "react";
import type { ProjectionComputationDTO } from "@/types";
import { ArrowDownIcon, ArrowUpIcon, ActivityIcon } from "lucide-react";

interface CalculationBreakdownProps {
  computation: ProjectionComputationDTO | null;
}

export const CalculationBreakdown: React.FC<CalculationBreakdownProps> = ({ computation }) => {
  if (!computation) return null;

  const formatCurrency = (val: number) => val.toLocaleString("pl-PL", { style: "currency", currency: "PLN" });

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between text-green-600">
        <span className="flex items-center gap-2">
          <ArrowUpIcon className="h-4 w-4" /> Income
        </span>
        <span className="font-semibold">{formatCurrency(computation.total_income)}</span>
      </div>
      <div className="flex items-center justify-between text-red-600">
        <span className="flex items-center gap-2">
          <ArrowDownIcon className="h-4 w-4" /> Expenses
        </span>
        <span className="font-semibold">{formatCurrency(computation.total_expense)}</span>
      </div>
      <div className="border-t pt-2 flex items-center justify-between font-medium">
        <span className="flex items-center gap-2">
          <ActivityIcon className="h-4 w-4 text-muted-foreground" /> Net Change
        </span>
        <span className={computation.net_change >= 0 ? "text-green-600" : "text-red-600"}>
          {formatCurrency(computation.net_change)}
        </span>
      </div>
    </div>
  );
};
