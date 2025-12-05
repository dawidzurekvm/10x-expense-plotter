/**
 * Entry-Specific Occurrences API Endpoint
 * Handles GET request to retrieve expanded occurrences for a specific entry series
 */

import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../../db/database.types";
import { getAuthenticatedUser } from "../../../../lib/utils/auth.utils";
import { EntriesService } from "../../../../lib/services/entries.service";
import { OccurrencesService } from "../../../../lib/services/occurrences.service";
import { getEntryOccurrencesQuerySchema, uuidSchema } from "../../../../lib/validation/occurrences.validation";
import {
  createUnauthorizedError,
  createValidationError,
  createNotFoundError,
  createInternalServerError,
  formatZodErrors,
  generateRequestId,
} from "../../../../lib/utils/error-response.utils";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/entries/:id/occurrences
 * Retrieve expanded occurrences for a specific entry series with exception metadata
 *
 * URL Parameters:
 * - id: UUID of the entry series
 *
 * Query Parameters:
 * - from_date (required): Start date in YYYY-MM-DD format
 * - to_date (required): End date in YYYY-MM-DD format
 *
 * Returns:
 * - 200: EntryOccurrencesResponseDTO with occurrences and exception metadata
 * - 400: Validation error (invalid UUID or parameters)
 * - 401: Unauthorized (missing/invalid authentication)
 * - 404: Entry series not found
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals, params, request }) => {
  const requestId = generateRequestId();

  try {
    // Extract Supabase client from context
    const supabase = locals.supabase as SupabaseClient<Database>;

    // Verify user session exists
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      console.log(`[WARN] [${requestId}] Unauthorized access attempt to GET entry occurrences for id ${params.id}`);
      const error = createUnauthorizedError();
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = user;

    // Validate entry ID (UUID format)
    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      console.log(`[WARN] [${requestId}] Invalid ID format for user ${userId}: ${params.id}`);
      const error = createValidationError({ id: "id must be a valid UUID" });
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = idValidation.data;

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validationResult = getEntryOccurrencesQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      console.log(
        `[WARN] [${requestId}] Query validation failed for user ${userId}, entry ${id}:`,
        validationResult.error
      );
      const details = formatZodErrors(validationResult.error);
      const error = createValidationError(details);
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const queryData = validationResult.data;
    console.log(
      `[INFO] [${requestId}] Fetching occurrences for entry ${id}, user ${userId}, ` +
        `date range: ${queryData.from_date} to ${queryData.to_date}`
    );

    // Verify entry exists and belongs to the user
    const entriesService = new EntriesService(supabase);
    const entry = await entriesService.findById(userId, id);

    if (!entry) {
      console.log(`[WARN] [${requestId}] Entry not found for user ${userId}, id ${id}`);
      const error = createNotFoundError(`Entry series with id ${id} not found`);
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Retrieve occurrences with exception metadata
    const occurrencesService = new OccurrencesService(supabase);
    const occurrencesData = await occurrencesService.findBySeriesId(userId, id, queryData);

    console.log(
      `[INFO] [${requestId}] Successfully retrieved ${occurrencesData.data.length} occurrences ` +
        `for entry ${id}, user ${userId}`
    );

    return new Response(JSON.stringify(occurrencesData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[ERROR] [${requestId}] Error retrieving entry occurrences:`, error);
    const errorResponse = createInternalServerError(requestId);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
