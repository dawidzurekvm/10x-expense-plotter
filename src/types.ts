/**
 * Data Transfer Objects (DTOs) and Command Models
 *
 * This file contains all type definitions for API requests and responses.
 * All types are derived from database entity types defined in database.types.ts
 */

import type { Database } from "./db/database.types";

// ============================================================================
// Database Entity Type Aliases
// ============================================================================

export type StartingBalanceRow =
  Database["public"]["Tables"]["starting_balances"]["Row"];
export type EntrySeriesRow =
  Database["public"]["Tables"]["entry_series"]["Row"];
export type SeriesExceptionRow =
  Database["public"]["Tables"]["series_exceptions"]["Row"];
export type AnalyticsEventRow =
  Database["public"]["Tables"]["analytics_events"]["Row"];

// ============================================================================
// Database Enum Type Aliases
// ============================================================================

export type EntryType = Database["public"]["Enums"]["entry_type"];
export type RecurrenceType = Database["public"]["Enums"]["recurrence_type"];
export type ExceptionType = Database["public"]["Enums"]["exception_type"];

// ============================================================================
// Scope Types for Edit/Delete Operations
// ============================================================================

/**
 * Edit scope determines how an entry update is applied:
 * - occurrence: Edit single occurrence (creates override exception)
 * - future: Edit this and future occurrences (creates new series)
 * - entire: Edit entire series
 */
export type EditScope = "occurrence" | "future" | "entire";

/**
 * Delete scope determines how an entry deletion is applied:
 * - occurrence: Delete single occurrence (creates skip exception)
 * - future: Delete this and future occurrences (updates end_date)
 * - entire: Delete entire series
 */
export type DeleteScope = "occurrence" | "future" | "entire";

// ============================================================================
// Reusable DTOs
// ============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationDTO {
  total: number;
  limit: number;
  offset: number;
}

/**
 * Date range limits for projections
 */
export interface DateRangeLimitsDTO {
  min_date: string;
  max_date: string;
}

// ============================================================================
// Starting Balance DTOs
// ============================================================================

/**
 * Starting balance response (GET /api/starting-balance)
 * Derived from starting_balances table Row type
 */
export type StartingBalanceDTO = StartingBalanceRow;

/**
 * Create or update starting balance command (PUT /api/starting-balance)
 * Only requires effective_date and amount
 */
export interface UpsertStartingBalanceCommand {
  effective_date: string; // YYYY-MM-DD
  amount: number; // decimal(12,2)
}

/**
 * Starting balance information embedded in projection response
 */
export interface StartingBalanceInfoDTO {
  amount: number;
  effective_date: string;
}

// ============================================================================
// Entry Series DTOs
// ============================================================================

/**
 * Entry series response (GET /api/entries)
 * Derived from entry_series table Row type
 */
export type EntrySeriesDTO = EntrySeriesRow;

/**
 * Entry series detail response with exceptions (GET /api/entries/:id)
 * Extends base entry with exceptions array
 */
export interface EntrySeriesDetailDTO extends EntrySeriesRow {
  exceptions: SeriesExceptionDTO[];
}

/**
 * Paginated list of entry series (GET /api/entries)
 */
export interface EntryListResponseDTO {
  data: EntrySeriesDTO[];
  pagination: PaginationDTO;
}

/**
 * Create entry command (POST /api/entries)
 * Omits auto-generated fields: id, user_id, parent_series_id, created_at, updated_at, effective_range
 */
export interface CreateEntryCommand {
  entry_type: EntryType;
  recurrence_type: RecurrenceType;
  title: string; // 1-120 characters
  description?: string | null; // max 500 characters
  amount: number; // > 0, max 2 decimal places
  start_date: string; // YYYY-MM-DD
  end_date?: string | null; // YYYY-MM-DD, must be >= start_date
  weekday?: number | null; // 0-6 for weekly, null otherwise
  day_of_month?: number | null; // 1-31 for monthly, null otherwise
}

/**
 * Update entry command (PUT /api/entries/:id)
 * Same structure as CreateEntryCommand
 */
export type UpdateEntryCommand = CreateEntryCommand;

/**
 * Response for occurrence-scoped edit (PUT /api/entries/:id?scope=occurrence)
 */
export interface OccurrenceEditResponseDTO {
  exception: ExceptionResponseDTO;
}

/**
 * Response for future-scoped edit (PUT /api/entries/:id?scope=future)
 */
export interface FutureEditResponseDTO {
  original_series: {
    id: string;
    end_date: string;
    updated_at: string;
  };
  new_series: EntrySeriesDTO;
}

/**
 * Response for entire-scoped edit (PUT /api/entries/:id?scope=entire)
 */
export type EntireEditResponseDTO = EntrySeriesDTO;

/**
 * Delete entry response (DELETE /api/entries/:id)
 */
export interface DeleteEntryResponseDTO {
  message: string;
  scope: DeleteScope;
  affected: {
    series_deleted: boolean;
    exception_created: boolean;
  };
}

// ============================================================================
// Series Exception DTOs
// ============================================================================

/**
 * Series exception embedded in entry detail response
 * Omits internal fields: series_id, user_id, created_at
 */
export type SeriesExceptionDTO = Omit<
  SeriesExceptionRow,
  "series_id" | "user_id" | "created_at"
>;

/**
 * Exception response when creating an exception
 * Full exception data from database
 */
export type ExceptionResponseDTO = SeriesExceptionRow;

// ============================================================================
// Occurrence DTOs
// ============================================================================

/**
 * Expanded occurrence from expand_occurrences() function
 * (GET /api/occurrences)
 */
export interface OccurrenceDTO {
  occurrence_id: string; // UUID v5 generated from (series_id, date)
  series_id: string;
  entry_type: EntryType;
  title: string;
  description: string; // Empty string if null
  occurrence_date: string; // YYYY-MM-DD
  amount: number; // decimal(12,2)
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/**
 * Paginated list of occurrences (GET /api/occurrences)
 */
export interface OccurrenceListResponseDTO {
  data: OccurrenceDTO[];
  pagination: PaginationDTO;
}

/**
 * Occurrence for specific entry with exception metadata
 * (GET /api/entries/:id/occurrences)
 */
export interface EntryOccurrenceDTO {
  occurrence_id: string;
  entry_type: EntryType;
  title: string;
  description: string;
  occurrence_date: string;
  amount: number;
  is_exception: boolean;
  exception_type: ExceptionType | null;
}

/**
 * Response for entry-specific occurrences
 * (GET /api/entries/:id/occurrences)
 */
export interface EntryOccurrencesResponseDTO {
  series_id: string;
  data: EntryOccurrenceDTO[];
}

// ============================================================================
// Projection DTOs
// ============================================================================

/**
 * Computation breakdown for projection
 */
export interface ProjectionComputationDTO {
  total_income: number; // decimal(12,2)
  total_expense: number; // decimal(12,2)
  net_change: number; // decimal(12,2)
}

/**
 * Balance projection response (GET /api/projection)
 */
export interface ProjectionDTO {
  target_date: string; // YYYY-MM-DD
  projected_balance: number; // decimal(12,2)
  starting_balance: StartingBalanceInfoDTO;
  computation: ProjectionComputationDTO;
  date_range_limits: DateRangeLimitsDTO;
}

// ============================================================================
// Export DTOs
// ============================================================================

/**
 * CSV export row structure (GET /api/export/csv)
 * Represents a single row in the CSV export
 */
export interface CSVExportRowDTO {
  occurrence_id: string; // UUID v5 from (series_id, date)
  series_id: string;
  type: EntryType;
  title: string;
  description: string; // Empty string if null
  date: string; // YYYY-MM-DD
  amount_pln: number; // Signed: positive for income, negative for expense
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

// ============================================================================
// Account Management DTOs
// ============================================================================

/**
 * Delete account command (DELETE /api/account)
 * Requires explicit confirmation string
 */
export interface DeleteAccountCommand {
  confirmation: "DELETE MY ACCOUNT";
}

/**
 * Delete account response
 */
export interface DeleteAccountResponseDTO {
  message: string;
}

// ============================================================================
// Analytics DTOs
// ============================================================================

/**
 * Analytics event type definition
 */
export type AnalyticsEventType =
  | "entry_created"
  | "entry_updated"
  | "entry_deleted"
  | "projection_viewed";

/**
 * Analytics event metadata structure
 */
export interface AnalyticsEventMetadata {
  entry_type?: EntryType;
  recurrence_type?: RecurrenceType;
  edit_scope?: EditScope;
  date_range_days?: number;
  has_end_date?: boolean;
}

/**
 * Analytics event (client-side insertion)
 * Derived from analytics_events table Row type
 */
export type AnalyticsEventDTO = AnalyticsEventRow;

// ============================================================================
// Error Response DTOs
// ============================================================================

/**
 * Validation error response (400 Bad Request)
 */
export interface ValidationErrorDTO {
  error: "Validation failed";
  details: Record<string, string>; // field_name -> error_message
}

/**
 * Generic error response
 */
export interface ErrorResponseDTO {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string;
}

/**
 * Unauthorized error response (401 Unauthorized)
 */
export interface UnauthorizedErrorDTO {
  error: "Unauthorized";
  message: "Invalid or missing authentication token";
}

/**
 * Forbidden error response (403 Forbidden)
 */
export interface ForbiddenErrorDTO {
  error: "Forbidden";
  message: "You do not have permission to access this resource";
}

/**
 * Not found error response (404 Not Found)
 */
export interface NotFoundErrorDTO {
  error: "Not found";
  message: string;
}

/**
 * Conflict error response (409 Conflict)
 */
export interface ConflictErrorDTO {
  error: "Conflict";
  message: string;
  details?: {
    constraint?: string;
  };
}

/**
 * Internal server error response (500 Internal Server Error)
 */
export interface InternalServerErrorDTO {
  error: "Internal server error";
  message: "An unexpected error occurred. Please try again later.";
  request_id: string;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Query parameters for GET /api/entries
 */
export interface GetEntriesQueryParams {
  entry_type?: EntryType;
  recurrence_type?: RecurrenceType;
  start_date_from?: string; // YYYY-MM-DD
  start_date_to?: string; // YYYY-MM-DD
  limit?: number; // default: 50, max: 100
  offset?: number; // default: 0
  sort_by?: "start_date" | "created_at" | "amount"; // default: start_date
  sort_order?: "asc" | "desc"; // default: desc
}

/**
 * Query parameters for GET /api/occurrences
 */
export interface GetOccurrencesQueryParams {
  from_date: string; // YYYY-MM-DD, required
  to_date: string; // YYYY-MM-DD, required
  entry_type?: EntryType;
  limit?: number; // default: 100, max: 1000
  offset?: number; // default: 0
}

/**
 * Query parameters for GET /api/entries/:id/occurrences
 */
export interface GetEntryOccurrencesQueryParams {
  from_date: string; // YYYY-MM-DD, required
  to_date: string; // YYYY-MM-DD, required
}

/**
 * Query parameters for GET /api/projection
 */
export interface GetProjectionQueryParams {
  date: string; // YYYY-MM-DD, required
}

/**
 * Query parameters for GET /api/export/csv
 */
export interface GetExportCSVQueryParams {
  from_date?: string; // YYYY-MM-DD, optional (defaults to starting balance date)
  to_date?: string; // YYYY-MM-DD, optional (defaults to current date + 10 years)
  entry_type?: EntryType;
}

/**
 * Query parameters for PUT /api/entries/:id
 */
export interface UpdateEntryQueryParams {
  scope: EditScope; // required
  date?: string; // YYYY-MM-DD, required if scope is occurrence or future
}

/**
 * Query parameters for DELETE /api/entries/:id
 */
export interface DeleteEntryQueryParams {
  scope: DeleteScope; // required
  date?: string; // YYYY-MM-DD, required if scope is occurrence or future
}

// ============================================================================
// Success Response DTOs
// ============================================================================

/**
 * Generic success message response
 */
export interface SuccessMessageDTO {
  message: string;
}
