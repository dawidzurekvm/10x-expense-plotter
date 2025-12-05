import React from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { DashboardToolbar } from "./DashboardToolbar";
import { OccurrencesList } from "./OccurrencesList";
import { ProjectionPanel } from "./projection/ProjectionPanel";
import { StartingBalanceOnboardingModal } from "./StartingBalanceOnboardingModal";

export const Dashboard = () => {
  const { projection, selectedDate, isLoading, isStartingBalanceModalOpen, saveStartingBalance, setProjectionDate } =
    useDashboardData();

  // Calculate padding for mobile bottom panel (approx height)
  // and desktop right panel (width 80 = 20rem)

  return (
    <div className="relative min-h-screen">
      {/* Main Content Area */}
      <main className="container mx-auto max-w-screen-2xl pb-64 lg:pb-8 lg:pr-80">
        <DashboardToolbar />

        <div className="px-4">
          {/* We can show a loading skeleton here for the list if needed, 
                but the hook handles loading state mostly for the projection. 
                The occurrences list is static placeholder for now. */}
          <OccurrencesList />
        </div>
      </main>

      {/* Side/Bottom Panel */}
      <ProjectionPanel
        projection={projection}
        selectedDate={selectedDate}
        onDateChange={setProjectionDate}
        isLoading={isLoading}
      />

      {/* Onboarding Modal */}
      <StartingBalanceOnboardingModal isOpen={isStartingBalanceModalOpen} onSubmit={saveStartingBalance} />
    </div>
  );
};
