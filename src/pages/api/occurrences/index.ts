/**
 * Occurrences API Endpoint - List All Occurrences
 * Handles GET request to retrieve all expanded occurrences across all entry series
 */

import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import { getAuthenticatedUser } from "../../../lib/utils/auth.utils";
import { OccurrencesService } from "../../../lib/services/occurrences.service";
import { getOccurrencesQuerySchema } from "../../../lib/validation/occurrences.validation";
import {
  createUnauthorizedError,
  createValidationError,
  createInternalServerError,
  formatZodErrors,
  generateRequestId,
} from "../../../lib/utils/error-response.utils";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/occurrences
 * Retrieve paginated list of expanded occurrences with optional filtering
 *
 * Query Parameters:
 * - from_date (required): Start date in YYYY-MM-DD format
 * - to_date (required): End date in YYYY-MM-DD format
 * - entry_type (optional): Filter by "income" or "expense"
 * - limit (optional): Number of results per page (default: 100, max: 1000)
 * - offset (optional): Number of results to skip (default: 0)
 *
 * Returns:
 * - 200: OccurrenceListResponseDTO with paginated occurrences
 * - 400: Validation error (invalid parameters)
 * - 401: Unauthorized (missing/invalid authentication)
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ locals, request }) => {
  const requestId = generateRequestId();

  try {
    // Extract Supabase client from context
    const supabase = locals.supabase as SupabaseClient<Database>;

    // Verify user session exists
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      console.log(`[WARN] [${requestId}] Unauthorized access attempt to GET occurrences`);
      const error = createUnauthorizedError();
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = user;
    console.log(`[INFO] [${requestId}] Fetching occurrences for user ${userId}`);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validationResult = getOccurrencesQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      console.log(`[WARN] [${requestId}] Query validation failed for user ${userId}:`, validationResult.error);
      const details = formatZodErrors(validationResult.error);
      const error = createValidationError(details);
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const params = validationResult.data;
    console.log(`[INFO] [${requestId}] Validated query params:`, {
      from_date: params.from_date,
      to_date: params.to_date,
      entry_type: params.entry_type,
      limit: params.limit,
      offset: params.offset,
    });

    // Instantiate service and retrieve occurrences
    const service = new OccurrencesService(supabase);
    const occurrencesList = await service.findAll(userId, params);

    console.log(
      `[INFO] [${requestId}] Successfully retrieved ${occurrencesList.data.length} occurrences ` +
        `(total: ${occurrencesList.pagination.total}) for user ${userId}`
    );

    return new Response(JSON.stringify(occurrencesList), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[ERROR] [${requestId}] Error retrieving occurrences:`, error);
    const errorResponse = createInternalServerError(requestId);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
