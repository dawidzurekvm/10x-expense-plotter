import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OccurrenceCard } from "./OccurrenceCard";
import type { OccurrenceDTO } from "@/types";

interface OccurrencesListProps {
  occurrences: OccurrenceDTO[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onEditClick: (occurrence: OccurrenceDTO) => void;
  onDeleteClick: (occurrence: OccurrenceDTO) => void;
}

export const OccurrencesList = ({
  occurrences,
  isLoading,
  hasMore,
  onLoadMore,
  onEditClick,
  onDeleteClick,
}: OccurrencesListProps) => {
  return (
    <div className="space-y-4 py-4">
      <h3 className="text-lg font-medium px-1">Recent Activity</h3>
      
      {occurrences.length === 0 && !isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          No entries found for the selected period.
        </div>
      ) : (
        <div className="space-y-3">
          {occurrences.map((occurrence) => (
            <OccurrenceCard
              key={occurrence.occurrence_id}
              occurrence={occurrence}
              onEdit={() => onEditClick(occurrence)}
              onDelete={() => onDeleteClick(occurrence)}
            />
          ))}
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onLoadMore}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};
