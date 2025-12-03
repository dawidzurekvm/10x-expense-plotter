/**
 * Starting Balance Service
 * Handles all business logic for starting balance operations
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  StartingBalanceDTO,
  UpsertStartingBalanceCommand,
} from "../../types";

// Type alias for Supabase client with database types
type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Get the starting balance for a user
 * @param supabase - Typed Supabase client
 * @param userId - User ID from authenticated session
 * @returns Starting balance or null if not found
 * @throws Error if database operation fails
 */
export async function getStartingBalance(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<StartingBalanceDTO | null> {
  const { data, error } = await supabase
    .from("starting_balances")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // PGRST116 is the "no rows returned" error code from PostgREST
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Create or update a starting balance for a user (upsert operation)
 * @param supabase - Typed Supabase client
 * @param userId - User ID from authenticated session
 * @param command - Command object with effective_date and amount
 * @returns Object containing the starting balance data and whether it was newly created
 * @throws Error if database operation fails
 */
export async function upsertStartingBalance(
  supabase: TypedSupabaseClient,
  userId: string,
  command: UpsertStartingBalanceCommand,
): Promise<{ data: StartingBalanceDTO; isNew: boolean }> {
  // First, check if a starting balance exists for this user
  const existingBalance = await getStartingBalance(supabase, userId);

  // Prepare the data for upsert
  const now = new Date().toISOString();
  const upsertData = {
    user_id: userId,
    effective_date: command.effective_date,
    amount: command.amount,
    updated_at: now,
    // Only set created_at if creating new record
    ...(existingBalance ? {} : { created_at: now }),
  };

  const { data, error } = await supabase
    .from("starting_balances")
    .upsert(upsertData, {
      onConflict: "user_id",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Upsert operation returned no data");
  }

  // Determine if this was a new record by checking if we found an existing balance
  const isNew = !existingBalance;

  return { data, isNew };
}

/**
 * Delete the starting balance for a user
 * @param supabase - Typed Supabase client
 * @param userId - User ID from authenticated session
 * @returns true if a record was deleted, false if no record existed
 * @throws Error if database operation fails
 */
export async function deleteStartingBalance(
  supabase: TypedSupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("starting_balances")
    .delete()
    .eq("user_id", userId)
    .select();

  if (error) {
    throw error;
  }

  // If data array is empty or null, no record was deleted
  return data !== null && data.length > 0;
}

/**
 * Export service as object for easier mocking in tests
 */
export const startingBalanceService = {
  getStartingBalance,
  upsertStartingBalance,
  deleteStartingBalance,
};
