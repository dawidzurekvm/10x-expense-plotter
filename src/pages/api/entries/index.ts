/**
 * Entries API Endpoints - List and Create
 * Handles GET (list) and POST (create) for entry series
 */

import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import { getAuthenticatedUser } from "../../../lib/utils/auth.utils";
import { EntriesService } from "../../../lib/services/entries.service";
import { getEntriesQuerySchema, createEntrySchema } from "../../../lib/validation/entries.validation";
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
 * GET /api/entries
 * Retrieve paginated list of entry series with filtering
 */
export const GET: APIRoute = async ({ locals, request }) => {
  const requestId = generateRequestId();

  try {
    // Extract Supabase client from context
    const supabase = locals.supabase as SupabaseClient<Database>;

    // Verify user session exists
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      console.log(`[WARN] [${requestId}] Unauthorized access attempt to GET entries`);
      const error = createUnauthorizedError();
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = user;
    console.log(`[INFO] [${requestId}] Fetching entries list for user ${userId}`);

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validationResult = getEntriesQuerySchema.safeParse(queryParams);
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

    // Instantiate service and call findAll
    const service = new EntriesService(supabase);
    const entriesList = await service.findAll(userId, params);

    console.log(`[INFO] [${requestId}] Successfully retrieved ${entriesList.data.length} entries for user ${userId}`);

    return new Response(JSON.stringify(entriesList), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[ERROR] [${requestId}] Error retrieving entries list:`, error);
    const errorResponse = createInternalServerError(requestId);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST /api/entries
 * Create a new entry series
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const requestId = generateRequestId();

  try {
    // Extract Supabase client from context
    const supabase = locals.supabase as SupabaseClient<Database>;

    // Verify user session exists
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      console.log(`[WARN] [${requestId}] Unauthorized access attempt to POST entry`);
      const error = createUnauthorizedError();
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = user;

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      console.log(`[WARN] [${requestId}] Invalid JSON in request body`);
      const error = createValidationError({
        body: "Request body must be valid JSON",
      });
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body using Zod schema
    const validationResult = createEntrySchema.safeParse(body);
    if (!validationResult.success) {
      console.log(`[WARN] [${requestId}] Validation failed for user ${userId}:`, validationResult.error);
      const details = formatZodErrors(validationResult.error);
      const error = createValidationError(details);
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const command = validationResult.data;
    console.log(`[INFO] [${requestId}] Creating new entry for user ${userId}`);

    // Instantiate service and call create
    const service = new EntriesService(supabase);
    const createdEntry = await service.create(userId, command);

    console.log(`[INFO] [${requestId}] Successfully created entry ${createdEntry.id} for user ${userId}`);

    return new Response(JSON.stringify(createdEntry), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[ERROR] [${requestId}] Error creating entry:`, error);
    const errorResponse = createInternalServerError(requestId);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
