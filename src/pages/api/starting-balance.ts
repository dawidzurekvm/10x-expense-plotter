/**
 * Starting Balance API Endpoints
 * Handles GET, PUT, and DELETE operations for user starting balance
 */

import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { startingBalanceService } from "../../lib/services/starting-balance.service";
import { upsertStartingBalanceSchema } from "../../lib/validation/starting-balance.validation";
import {
  createUnauthorizedError,
  createNotFoundError,
  createInternalServerError,
  createValidationError,
  formatZodErrors,
  generateRequestId,
} from "../../lib/utils/error-response.utils";
import type { SuccessMessageDTO } from "../../types";
import { getAuthenticatedUser } from "../../lib/utils/auth.utils";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/starting-balance
 * Retrieve the authenticated user's starting balance
 */
export const GET: APIRoute = async ({ locals }) => {
  const requestId = generateRequestId();

  try {
    // Extract Supabase client from context
    const supabase = locals.supabase as SupabaseClient<Database>;

    // Verify user session exists
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      console.log(
        `[WARN] [${requestId}] Unauthorized access attempt to GET starting balance`,
      );
      const error = createUnauthorizedError();
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = user;
    console.log(
      `[INFO] [${requestId}] Fetching starting balance for user ${userId}`,
    );

    // Call service to get starting balance
    const startingBalance = await startingBalanceService.getStartingBalance(
      supabase,
      userId,
    );

    // Handle not found case
    if (!startingBalance) {
      console.log(
        `[WARN] [${requestId}] Starting balance not found for user ${userId}`,
      );
      const error = createNotFoundError("Starting balance not found");
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success response
    console.log(
      `[INFO] [${requestId}] Successfully retrieved starting balance for user ${userId}`,
    );
    return new Response(JSON.stringify(startingBalance), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with stack trace
    console.error(
      `[ERROR] [${requestId}] Error retrieving starting balance:`,
      error,
    );
    const errorResponse = createInternalServerError(requestId);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PUT /api/starting-balance
 * Create or update the authenticated user's starting balance
 */
export const PUT: APIRoute = async ({ request, locals }) => {
  const requestId = generateRequestId();

  try {
    // Extract Supabase client from context
    const supabase = locals.supabase as SupabaseClient<Database>;

    // Verify user session exists
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      console.log(
        `[WARN] [${requestId}] Unauthorized access attempt to PUT starting balance`,
      );
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
    const validationResult = upsertStartingBalanceSchema.safeParse(body);
    if (!validationResult.success) {
      console.log(
        `[WARN] [${requestId}] Validation failed for user ${userId}:`,
        validationResult.error,
      );
      const details = formatZodErrors(validationResult.error);
      const error = createValidationError(details);
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const command = validationResult.data;
    console.log(
      `[INFO] [${requestId}] Upserting starting balance for user ${userId}`,
    );

    // Call service to upsert starting balance
    const result = await startingBalanceService.upsertStartingBalance(
      supabase,
      userId,
      command,
    );

    // Return appropriate status code based on whether it was created or updated
    const statusCode = result.isNew ? 201 : 200;
    console.log(
      `[INFO] [${requestId}] Successfully ${result.isNew ? "created" : "updated"} starting balance for user ${userId}`,
    );

    return new Response(JSON.stringify(result.data), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with stack trace
    console.error(
      `[ERROR] [${requestId}] Error upserting starting balance:`,
      error,
    );
    const errorResponse = createInternalServerError(requestId);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/starting-balance
 * Delete the authenticated user's starting balance
 */
export const DELETE: APIRoute = async ({ locals }) => {
  const requestId = generateRequestId();

  try {
    // Extract Supabase client from context
    const supabase = locals.supabase as SupabaseClient<Database>;

    // Verify user session exists
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      console.log(
        `[WARN] [${requestId}] Unauthorized access attempt to DELETE starting balance`,
      );
      const error = createUnauthorizedError();
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = user;
    console.log(
      `[INFO] [${requestId}] Deleting starting balance for user ${userId}`,
    );

    // Call service to delete starting balance
    const deleted = await startingBalanceService.deleteStartingBalance(
      supabase,
      userId,
    );

    // Handle not found case
    if (!deleted) {
      console.log(
        `[WARN] [${requestId}] Starting balance not found for deletion for user ${userId}`,
      );
      const error = createNotFoundError("Starting balance not found");
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success response
    console.log(
      `[INFO] [${requestId}] Successfully deleted starting balance for user ${userId}`,
    );
    const response: SuccessMessageDTO = {
      message: "Starting balance deleted successfully",
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with stack trace
    console.error(
      `[ERROR] [${requestId}] Error deleting starting balance:`,
      error,
    );
    const errorResponse = createInternalServerError(requestId);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
