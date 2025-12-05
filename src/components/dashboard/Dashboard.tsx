import React, { useState } from "react";
import { startOfMonth, endOfMonth, format, getDay, getDate } from "date-fns";
import { toast } from "sonner";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useOccurrences } from "@/hooks/useOccurrences";
import { useEntryMutations } from "@/hooks/useEntryMutations";
import { DashboardToolbar } from "./DashboardToolbar";
import { OccurrencesList } from "./OccurrencesList";
import { ProjectionPanel } from "./projection/ProjectionPanel";
import { StartingBalanceOnboardingModal } from "./StartingBalanceOnboardingModal";
import { AddEditEntryDialog } from "./entries/AddEditEntryDialog";
import { EditScopeModal } from "./entries/EditScopeModal";
import { DeleteEntryDialog } from "./entries/DeleteEntryDialog";
import type { DashboardFilters, EntryFormValues } from "./entries/schema";
import type { 
  OccurrenceDTO, 
  EntrySeriesDetailDTO, 
  EditScope, 
  DeleteScope, 
  CreateEntryCommand 
} from "@/types";

export const Dashboard = () => {
  // 1. Global Dashboard Data (Projection, Balance)
  const { 
    projection, 
    selectedDate, 
    isLoading: isProjectionLoading, 
    isStartingBalanceModalOpen, 
    saveStartingBalance, 
    setProjectionDate 
  } = useDashboardData();

  // 2. Local State for Filters
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
    entryType: "all",
  });

  // 3. Occurrences Data
  const { 
    occurrences, 
    isLoading: isListLoading, 
    hasMore, 
    loadMore, 
    refresh: refreshOccurrences 
  } = useOccurrences(filters);

  // 4. Mutations & Modal State
  const { 
    createEntry, 
    updateEntry, 
    deleteEntry, 
    fetchEntryDetails 
  } = useEntryMutations();

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isScopeOpen, setIsScopeOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // State to track active interaction
  const [selectedOccurrence, setSelectedOccurrence] = useState<OccurrenceDTO | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<EntrySeriesDetailDTO | null>(null);
  const [pendingFormValues, setPendingFormValues] = useState<EntryFormValues | null>(null);

  // 5. Handlers

  const refreshAll = () => {
    refreshOccurrences();
    setProjectionDate(selectedDate); // Refresh projection
  };

  // Helper to prepare command with derived fields
  const prepareEntryCommand = (data: EntryFormValues) => {
    // Derive weekday or day_of_month if needed
    let weekday: number | null = null;
    let day_of_month: number | null = null;

    if (data.recurrence_type === "weekly") {
      weekday = getDay(data.start_date);
    } else if (data.recurrence_type === "monthly") {
      day_of_month = getDate(data.start_date);
    }

    return {
      ...data,
      start_date: format(data.start_date, "yyyy-MM-dd"),
      end_date: data.end_date ? format(data.end_date, "yyyy-MM-dd") : null,
      description: data.description || null,
      weekday,
      day_of_month,
    };
  };

  // --- Create Flow ---
  const handleAddClick = () => {
    setSelectedSeries(null);
    setSelectedOccurrence(null);
    setIsAddEditOpen(true);
  };

  const handleCreateSubmit = async (data: EntryFormValues) => {
    try {
      const command: CreateEntryCommand = prepareEntryCommand(data);
      await createEntry(command);
      toast.success("Entry created successfully");
      refreshAll();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create entry");
      throw error; // Let form handle loading state reset if needed
    }
  };

  // --- Edit Flow ---
  const handleEditClick = async (occurrence: OccurrenceDTO) => {
    try {
      const details = await fetchEntryDetails(occurrence.series_id);
      setSelectedOccurrence(occurrence);
      setSelectedSeries(details);
      setIsAddEditOpen(true);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load entry details");
    }
  };

  const handleEditSubmit = async (data: EntryFormValues) => {
    // If one-time, update immediately with 'entire' scope (simplest for 1-time)
    // Or if series is one_time, scope doesn't really matter much but 'entire' is correct.
    if (data.recurrence_type === "one_time" || selectedSeries?.recurrence_type === "one_time") {
        // Just update
        await performUpdate(data, "entire");
    } else {
        // It's recurring, ask for scope
        setPendingFormValues(data);
        // Close form dialog first? Or keep it open? 
        // Usually better to close form or stack modals. 
        // Let's close form dialog and open scope modal.
        setIsAddEditOpen(false);
        setIsScopeOpen(true);
    }
  };

  const handleScopeSelect = async (scope: EditScope) => {
    if (!pendingFormValues) return;
    await performUpdate(pendingFormValues, scope);
  };

  const performUpdate = async (data: EntryFormValues, scope: EditScope) => {
    if (!selectedSeries || !selectedOccurrence) return;

    try {
        const updateData = prepareEntryCommand(data);
        // Add required recurrence_type to satisfy CreateEntryCommand type if missing in partial form values
        // But data is EntryFormValues which has recurrence_type.
        
        // Ensure weekday/day_of_month are explicitly null if not applicable to clear them in DB
        // prepareEntryCommand returns undefined, but JSON.stringify drops undefined.
        // If we need to clear them, we should send null.
        const command = {
          ...updateData,
          weekday: updateData.weekday ?? null,
          day_of_month: updateData.day_of_month ?? null,
        };

        await updateEntry(
            selectedSeries.id, 
            command, 
            scope, 
            selectedOccurrence.occurrence_date // Date needed for split/exception
        );
        
        toast.success("Entry updated successfully");
        refreshAll();
    } catch (error) {
        console.error(error);
        toast.error("Failed to update entry");
        // If we failed from scope modal, maybe re-open form? 
        // For now just stop.
    }
  };

  // --- Delete Flow ---
  const handleDeleteClick = async (occurrence: OccurrenceDTO) => {
    try {
        const details = await fetchEntryDetails(occurrence.series_id);
        setSelectedOccurrence(occurrence);
        setSelectedSeries(details);
        setIsDeleteOpen(true);
    } catch (error) {
        console.error(error);
        toast.error("Failed to prepare delete action");
    }
  };

  const handleDeleteConfirm = async (scope: DeleteScope) => {
    if (!selectedSeries || !selectedOccurrence) return;
    try {
        await deleteEntry(
            selectedSeries.id,
            scope,
            selectedOccurrence.occurrence_date
        );
        toast.success("Entry deleted successfully");
        refreshAll();
    } catch (error) {
        console.error(error);
        toast.error("Failed to delete entry");
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Main Content Area */}
      <main className="container mx-auto max-w-screen-2xl pb-64 lg:pb-8 lg:pr-80">
        <DashboardToolbar 
            dateRange={filters.dateRange}
            entryType={filters.entryType}
            onFilterChange={setFilters}
            onAddClick={handleAddClick}
        />

        <div className="px-4">
          <OccurrencesList 
            occurrences={occurrences}
            isLoading={isListLoading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
          />
        </div>
      </main>

      {/* Side/Bottom Panel */}
      <ProjectionPanel
        projection={projection}
        selectedDate={selectedDate}
        onDateChange={setProjectionDate}
        isLoading={isProjectionLoading}
      />

      {/* Modals */}
      <StartingBalanceOnboardingModal 
        isOpen={isStartingBalanceModalOpen} 
        onSubmit={saveStartingBalance} 
      />

      <AddEditEntryDialog 
        isOpen={isAddEditOpen}
        onOpenChange={setIsAddEditOpen}
        initialData={selectedSeries}
        onSubmit={selectedSeries ? handleEditSubmit : handleCreateSubmit}
      />

      <EditScopeModal 
        isOpen={isScopeOpen}
        onClose={() => setIsScopeOpen(false)}
        onSelectScope={handleScopeSelect}
      />

      <DeleteEntryDialog 
        isOpen={isDeleteOpen}
        isRecurring={selectedSeries?.recurrence_type !== 'one_time'}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};
