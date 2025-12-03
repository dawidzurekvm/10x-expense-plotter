import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectionDTO, StartingBalanceInfoDTO, ProjectionComputationDTO, DateRangeLimitsDTO } from "@/types";

/**
 * Service class for balance projection operations
 * Handles fetching starting balance, computing projections, and calculating totals
 */
export class ProjectionService {
  constructor(
    private supabase: SupabaseClient,
    private userId: string
  ) {}

  /**
   * Gets the balance projection for a specific target date
   * @param targetDate - The target date for projection (YYYY-MM-DD)
   * @returns Complete projection data including balance, computation breakdown, and limits
   * @throws Error if starting balance not found or database operation fails
   */
  async getProjection(targetDate: string): Promise<ProjectionDTO> {
    // Step 1: Fetch starting balance info
    const startingBalance = await this.getStartingBalance();

    if (!startingBalance) {
      throw new Error("No starting balance configured. Please set a starting balance first.");
    }

    // Step 2: Call project_balance() database function
    const projectedBalance = await this.callProjectBalance(targetDate);

    // Step 3: Fetch income and expense totals for computation breakdown
    const computation = await this.getProjectionTotals(startingBalance.effective_date, targetDate);

    // Step 4: Calculate date range limits
    const dateRangeLimits = this.calculateDateRangeLimits(startingBalance.effective_date);

    // Step 5: Assemble and return complete projection
    return {
      target_date: targetDate,
      projected_balance: projectedBalance,
      starting_balance: startingBalance,
      computation,
      date_range_limits: dateRangeLimits,
    };
  }

  /**
   * Fetches the starting balance for the authenticated user
   * @returns Starting balance info or null if not found
   * @private
   */
  private async getStartingBalance(): Promise<StartingBalanceInfoDTO | null> {
    try {
      const { data, error } = await this.supabase
        .from("starting_balances")
        .select("amount, effective_date")
        .eq("user_id", this.userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Error fetching starting balance:", error);
      throw new Error("Failed to fetch starting balance");
    }
  }

  /**
   * Calls the project_balance() database function to get projected balance
   * @param targetDate - The target date for projection (YYYY-MM-DD)
   * @returns The projected balance amount
   * @private
   */
  private async callProjectBalance(targetDate: string): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc("project_balance", {
        p_user_id: this.userId,
        p_target_date: targetDate,
      });

      if (error) {
        throw error;
      }

      // project_balance returns numeric, which comes as string from PostgreSQL
      return typeof data === "number" ? data : parseFloat(data);
    } catch (error) {
      console.error("Error calling project_balance:", error);
      throw new Error("Failed to calculate projected balance");
    }
  }

  /**
   * Fetches income and expense totals for the projection period
   * @param startingDate - Starting balance effective date (YYYY-MM-DD)
   * @param targetDate - Target projection date (YYYY-MM-DD)
   * @returns Computation breakdown with income, expense, and net change
   * @private
   */
  private async getProjectionTotals(startingDate: string, targetDate: string): Promise<ProjectionComputationDTO> {
    try {
      // Fetch all occurrences in the date range
      const { data, error } = await this.supabase.rpc("expand_occurrences", {
        p_user_id: this.userId,
        p_from_date: startingDate,
        p_to_date: targetDate,
      });

      if (error) {
        throw error;
      }

      // Calculate totals by entry type
      let totalIncome = 0;
      let totalExpense = 0;

      if (data && Array.isArray(data)) {
        for (const occurrence of data) {
          if (occurrence.entry_type === "income") {
            totalIncome += parseFloat(occurrence.amount);
          } else if (occurrence.entry_type === "expense") {
            totalExpense += parseFloat(occurrence.amount);
          }
        }
      }

      // Calculate net change
      const netChange = totalIncome - totalExpense;

      return {
        total_income: totalIncome,
        total_expense: totalExpense,
        net_change: netChange,
      };
    } catch (error) {
      console.error("Error fetching projection totals:", error);
      throw new Error("Failed to calculate projection totals");
    }
  }

  /**
   * Calculates the valid date range for projections
   * @param startingDate - Starting balance effective date (YYYY-MM-DD)
   * @returns Date range limits (min and max dates)
   * @private
   */
  private calculateDateRangeLimits(startingDate: string): DateRangeLimitsDTO {
    // Min date is the starting balance effective date
    const minDate = startingDate;

    // Max date is current date + 10 years
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 10);
    const maxDateStr = maxDate.toISOString().split("T")[0];

    return {
      min_date: minDate,
      max_date: maxDateStr,
    };
  }
}
