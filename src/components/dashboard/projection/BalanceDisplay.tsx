import React from "react";

interface BalanceDisplayProps {
  amount: number | null;
  isLoading: boolean;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({ amount, isLoading }) => {
  if (isLoading && amount === null) {
    return <div className="h-12 w-48 animate-pulse rounded bg-muted" />;
  }

  const formattedAmount =
    amount?.toLocaleString("pl-PL", {
      style: "currency",
      currency: "PLN",
    }) ?? "---";

  const isNegative = amount !== null && amount < 0;

  return (
    <div className="flex flex-col items-end" data-testid="balance-display">
      <span className="text-sm text-muted-foreground">Projected Balance</span>
      <span 
        className={`text-4xl font-bold tracking-tight ${isNegative ? "text-red-500" : "text-foreground"}`}
        data-testid="projected-balance-amount"
      >
        {formattedAmount}
      </span>
    </div>
  );
};
