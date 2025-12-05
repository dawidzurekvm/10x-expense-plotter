import { useState, useEffect, useCallback } from "react";
import type { StartingBalanceDTO, ProjectionDTO, UpsertStartingBalanceCommand } from "@/types";

export interface DashboardState {
  startingBalance: StartingBalanceDTO | null;
  projection: ProjectionDTO | null;
  selectedDate: Date;
  isLoading: boolean;
  error: string | null;
  isStartingBalanceModalOpen: boolean;
}

export function useDashboardData() {
  const [state, setState] = useState<DashboardState>({
    startingBalance: null,
    projection: null,
    selectedDate: new Date(),
    isLoading: true,
    error: null,
    isStartingBalanceModalOpen: false,
  });

  const fetchStartingBalance = useCallback(async () => {
    try {
      const response = await fetch("/api/starting-balance", {
        headers: { "Cache-Control": "no-cache" }
      });
      if (response.status === 404) {
        setState((prev) => ({
          ...prev,
          startingBalance: null,
          isStartingBalanceModalOpen: true,
          isLoading: false,
        }));
        return null;
      }

      if (!response.ok) throw new Error("Failed to fetch starting balance");

      const data: StartingBalanceDTO = await response.json();
      setState((prev) => ({
        ...prev,
        startingBalance: data,
        isStartingBalanceModalOpen: false,
      }));
      return data;
    } catch (error) {
      console.error(error);
      setState((prev) => ({ ...prev, error: "Failed to load starting balance", isLoading: false }));
      return null;
    }
  }, []);

  const fetchProjection = useCallback(async (date: Date) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const dateStr = date.toISOString().split("T")[0];
      const response = await fetch(`/api/projection?date=${dateStr}`, {
        headers: { "Cache-Control": "no-cache" }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch projection");
      }

      const data: ProjectionDTO = await response.json();
      setState((prev) => ({
        ...prev,
        projection: data,
        selectedDate: date,
        isLoading: false,
      }));
    } catch (error) {
      console.error(error);
      // Keep old projection if possible, but stop loading
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to load projection",
      }));
    }
  }, []);

  const saveStartingBalance = useCallback(
    async (command: UpsertStartingBalanceCommand) => {
      try {
        const response = await fetch("/api/starting-balance", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(command),
        });

        if (!response.ok) throw new Error("Failed to save starting balance");

        const data: StartingBalanceDTO = await response.json();
        setState((prev) => ({
          ...prev,
          startingBalance: data,
          isStartingBalanceModalOpen: false,
        }));

        // Fetch projection for the current selected date (or today)
        await fetchProjection(state.selectedDate);
      } catch (error) {
        console.error(error);
        throw error; // Re-throw for the form to handle
      }
    },
    [state.selectedDate, fetchProjection]
  );

  // Initial Load
  useEffect(() => {
    const init = async () => {
      const balance = await fetchStartingBalance();
      if (balance) {
        await fetchProjection(new Date());
      }
    };
    init();
  }, [fetchStartingBalance, fetchProjection]);

  return {
    ...state,
    setProjectionDate: fetchProjection,
    saveStartingBalance,
    retry: fetchStartingBalance,
  };
}
