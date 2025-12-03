/**
 * Occurrences Service
 *
 * This service handles business logic for retrieving expanded occurrences
 * from entry series using the expand_occurrences() database function.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  OccurrenceDTO,
  OccurrenceListResponseDTO,
  EntryOccurrencesResponseDTO,
  EntryOccurrenceDTO,
  GetOccurrencesQueryParams,
  GetEntryOccurrencesQueryParams,
  ExceptionType,
} from "../../types";

/**
 * Raw occurrence data returned from expand_occurrences RPC function
 */
interface ExpandOccurrencesResult {
  occurrence_id: string;
  series_id: string;
  entry_type: "income" | "expense";
  title: string;
  description: string | null;
  occurrence_date: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

/**
 * Service for managing occurrence operations
 */
export class OccurrencesService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Retrieves all expanded occurrences for the authenticated user
   * within a specified date range with optional filtering and pagination.
   *
   * @param userId - The authenticated user's ID
   * @param params - Query parameters including date range, filters, and pagination
   * @returns Paginated list of occurrences with metadata
   * @throws Error if database operation fails
   */
  async findAll(userId: string, params: GetOccurrencesQueryParams): Promise<OccurrenceListResponseDTO> {
    try {
      // Call the expand_occurrences database function
      const { data: rawOccurrences, error } = await this.supabase.rpc("expand_occurrences", {
        p_user_id: userId,
        p_from_date: params.from_date,
        p_to_date: params.to_date,
      });

      if (error) {
        console.error("[OccurrencesService.findAll] RPC error:", error);
        throw new Error(`Failed to expand occurrences: ${error.message}`);
      }

      // Convert raw results to OccurrenceDTO format
      let occurrences: OccurrenceDTO[] = (rawOccurrences || []).map((occ: ExpandOccurrencesResult) => ({
        occurrence_id: occ.occurrence_id,
        series_id: occ.series_id,
        entry_type: occ.entry_type,
        title: occ.title,
        description: occ.description || "", // Convert null to empty string
        occurrence_date: occ.occurrence_date,
        amount: occ.amount,
        created_at: occ.created_at,
        updated_at: occ.updated_at,
      }));

      // Apply entry_type filter if provided
      if (params.entry_type) {
        occurrences = occurrences.filter((occ) => occ.entry_type === params.entry_type);
      }

      // Get total count before pagination
      const total = occurrences.length;

      // Apply pagination
      const { limit = 100, offset = 0 } = params;
      const paginatedOccurrences = occurrences.slice(offset, offset + limit);

      return {
        data: paginatedOccurrences,
        pagination: {
          total,
          limit,
          offset,
        },
      };
    } catch (error) {
      console.error("[OccurrencesService.findAll] Error:", error);
      throw error;
    }
  }

  /**
   * Retrieves expanded occurrences for a specific entry series
   * with exception metadata (is_exception and exception_type).
   *
   * @param userId - The authenticated user's ID
   * @param seriesId - The entry series ID
   * @param params - Query parameters including date range
   * @returns List of occurrences for the series with exception metadata
   * @throws Error if database operation fails
   */
  async findBySeriesId(
    userId: string,
    seriesId: string,
    params: GetEntryOccurrencesQueryParams
  ): Promise<EntryOccurrencesResponseDTO> {
    try {
      // Call the expand_occurrences database function
      const { data: rawOccurrences, error: rpcError } = await this.supabase.rpc("expand_occurrences", {
        p_user_id: userId,
        p_from_date: params.from_date,
        p_to_date: params.to_date,
      });

      if (rpcError) {
        console.error("[OccurrencesService.findBySeriesId] RPC error:", rpcError);
        throw new Error(`Failed to expand occurrences: ${rpcError.message}`);
      }

      // Filter occurrences for this specific series
      const seriesOccurrences = (rawOccurrences || []).filter(
        (occ: ExpandOccurrencesResult) => occ.series_id === seriesId
      );

      // Query series_exceptions for this series in the date range
      // to get exception metadata
      const { data: exceptions, error: exceptionsError } = await this.supabase
        .from("series_exceptions")
        .select("exception_date, exception_type")
        .eq("series_id", seriesId)
        .gte("exception_date", params.from_date)
        .lte("exception_date", params.to_date);

      if (exceptionsError) {
        console.error("[OccurrencesService.findBySeriesId] Exceptions query error:", exceptionsError);
        throw new Error(`Failed to fetch exceptions: ${exceptionsError.message}`);
      }

      // Build exception map: date -> exception_type
      const exceptionMap = new Map<string, ExceptionType>();
      (exceptions || []).forEach((ex) => {
        exceptionMap.set(ex.exception_date, ex.exception_type);
      });

      // Enrich occurrences with exception metadata
      // Note: Skip exceptions won't appear in results (filtered by expand_occurrences)
      // So is_exception=true implies exception_type="override"
      const enrichedOccurrences: EntryOccurrenceDTO[] = seriesOccurrences.map((occ: ExpandOccurrencesResult) => {
        const exceptionType = exceptionMap.get(occ.occurrence_date);
        return {
          occurrence_id: occ.occurrence_id,
          entry_type: occ.entry_type,
          title: occ.title,
          description: occ.description || "", // Convert null to empty string
          occurrence_date: occ.occurrence_date,
          amount: occ.amount,
          is_exception: exceptionType !== undefined,
          exception_type: exceptionType || null,
        };
      });

      return {
        series_id: seriesId,
        data: enrichedOccurrences,
      };
    } catch (error) {
      console.error("[OccurrencesService.findBySeriesId] Error:", error);
      throw error;
    }
  }
}
