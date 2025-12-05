import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { DashboardFilters } from "./entries/schema";

interface DashboardToolbarProps {
  dateRange: { from: Date | undefined; to: Date | undefined };
  entryType: DashboardFilters["entryType"];
  onFilterChange: (filters: DashboardFilters) => void;
  onAddClick: () => void;
}

export const DashboardToolbar = ({ dateRange, entryType, onFilterChange, onAddClick }: DashboardToolbarProps) => {
  const handleDateRangeChange = (range: DateRange | undefined) => {
    onFilterChange({
      dateRange: { from: range?.from, to: range?.to },
      entryType,
    });
  };

  const handleTypeChange = (value: string) => {
    if (value) {
      onFilterChange({
        dateRange,
        entryType: value as DashboardFilters["entryType"],
      });
    }
  };

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 p-4">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !dateRange?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{ from: dateRange?.from, to: dateRange?.to }}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <ToggleGroup
            type="single"
            value={entryType}
            onValueChange={handleTypeChange}
            className="bg-muted/50 p-1 rounded-lg"
          >
            <ToggleGroupItem value="all" aria-label="All entries" className="h-8 px-3 text-xs">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="income" aria-label="Income only" className="h-8 px-3 text-xs">
              Income
            </ToggleGroupItem>
            <ToggleGroupItem value="expense" aria-label="Expense only" className="h-8 px-3 text-xs">
              Expense
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Button onClick={onAddClick} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>
    </div>
  );
};
