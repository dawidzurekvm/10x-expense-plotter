import React from "react";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OccurrenceDTO } from "@/types";
import { cn } from "@/lib/utils";

interface OccurrenceCardProps {
  occurrence: OccurrenceDTO;
  onEdit: () => void;
  onDelete: () => void;
}

export const OccurrenceCard = ({ occurrence, onEdit, onDelete }: OccurrenceCardProps) => {
  const isIncome = occurrence.entry_type === "income";
  // TODO: We might need to know if it's an exception from DTO, currently OccurrenceDTO doesn't have is_exception explicit flag unless we infer or add it.
  // Checking types.ts, OccurrenceDTO doesn't have is_exception. EntryOccurrenceDTO does.
  // The plan says "OccurrenceCard ... Visual distinction for ... Recurrence".
  // Maybe we can infer recurrence from the series? But fetching series is separate.
  // For now, we'll stick to what we have.

  return (
    <Card className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            isIncome ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
          )}
        >
          {isIncome ? "+" : "-"}
        </div>
        <div className="space-y-1">
          <h4 className="font-medium leading-none">{occurrence.title}</h4>
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarIcon className="mr-1 h-3 w-3" />
            <span>{format(new Date(occurrence.occurrence_date), "MMM d, yyyy")}</span>
            {/* We could show recurrence info if available */}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className={cn("font-semibold", isIncome ? "text-emerald-600" : "text-rose-600")}>
          {isIncome ? "+" : "-"}
          {new Intl.NumberFormat("pl-PL", {
            style: "currency",
            currency: "PLN",
          }).format(occurrence.amount)}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-rose-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};
