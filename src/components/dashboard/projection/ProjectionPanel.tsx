import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BalanceDisplay } from "./BalanceDisplay";
import { CalculationBreakdown } from "./CalculationBreakdown";
import type { ProjectionDTO } from "@/types";

interface ProjectionPanelProps {
  projection: ProjectionDTO | null;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  isLoading: boolean;
}

export const ProjectionPanel: React.FC<ProjectionPanelProps> = ({
  projection,
  selectedDate,
  onDateChange,
  isLoading,
}) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onDateChange(new Date(e.target.value));
    }
  };

  const dateString = selectedDate.toISOString().split("T")[0];
  const minDate = projection?.date_range_limits?.min_date;
  const maxDate = projection?.date_range_limits?.max_date;

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-40 w-full border-t bg-background p-4 shadow-2xl lg:bottom-auto lg:left-auto lg:right-0 lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-80 lg:border-l lg:border-t-0 lg:shadow-none">
      <div className="flex flex-col gap-6 h-full lg:overflow-y-auto lg:p-6">
        {/* Mobile Header / Desktop Title */}
        <div className="flex items-center justify-between lg:flex-col lg:items-start lg:gap-4">
          <h2 className="text-lg font-semibold lg:text-xl">Projection</h2>

          {/* Date Picker */}
          <div className="w-40 lg:w-full">
            <Label htmlFor="projection-date" className="sr-only lg:not-sr-only lg:mb-2 lg:block">
              Target Date
            </Label>
            <Input
              id="projection-date"
              type="date"
              value={dateString}
              onChange={handleDateChange}
              min={minDate}
              max={maxDate}
              className="w-full"
              disabled={isLoading}
              data-testid="projection-date-input"
            />
          </div>
        </div>

        {/* Balance Display */}
        <div className="flex justify-end lg:w-full lg:flex-col lg:items-start lg:gap-2">
          <BalanceDisplay amount={projection?.projected_balance ?? null} isLoading={isLoading} />
        </div>

        {/* Breakdown (Hidden on mobile if height is small, or maybe collapsible? Plan says responsive panel) */}
        {/* For now, let's keep it visible but maybe condensed or just always there as it fits in the panel */}
        <div className="hidden lg:block lg:w-full">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">Breakdown</h3>
          <div className="rounded-md border p-3">
            <CalculationBreakdown computation={projection?.computation ?? null} />
          </div>
        </div>

        {/* Mobile Breakdown (Optional, could be in a drawer or just listed) */}
        <div className="lg:hidden w-full pt-2 border-t mt-2">
          <div className="text-xs text-muted-foreground mb-1">Breakdown</div>
          <CalculationBreakdown computation={projection?.computation ?? null} />
        </div>
      </div>
    </aside>
  );
};
