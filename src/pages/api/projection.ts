import type { APIRoute } from "astro";
import { getProjectionQuerySchema, validateProjectionDateRange } from "@/lib/validation/projection.validation";
import { ProjectionService } from "@/lib/services/projection.service";
import {
  createUnauthorizedError,
  createNotFoundError,
  createInternalServerError,
  createValidationError,
  generateRequestId,
} from "@/lib/utils/error-response.utils";
import { getAuthenticatedUser } from "@/lib/utils/auth.utils";

export const prerender = false;

/**
 * GET /api/projection
 * Computes the projected account balance for a specific target date
 *
 * Query Parameters:
 * - date (required): Target date in YYYY-MM-DD format
 *
 * Returns:
 * - 200: ProjectionDTO with balance, computation breakdown, and date limits
 * - 400: Validation error (invalid date format or out of range)
 * - 401: Unauthorized (handled by middleware)
 * - 404: Starting balance not configured
 * - 500: Internal server error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  const requestId = generateRequestId();

  try {
    // Step 1: Extract authenticated user and Supabase client
    const supabase = locals.supabase;

    // Verify user session exists
    const user = await getAuthenticatedUser();
    if (!user) {
      console.log(`[WARN] [${requestId}] Unauthorized access attempt to GET projection`);
      const error = createUnauthorizedError();
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = user;
    console.log(`[INFO] [${requestId}] Fetching projection for user ${userId}`);

    // Step 2: Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      date: url.searchParams.get("date"),
    };

    // Validate query parameter format
    const validation = getProjectionQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      console.log(`[WARN] [${requestId}] Query validation failed:`, validation.error);
      const errors = validation.error.flatten().fieldErrors;
      const details: Record<string, string> = {};

      for (const [field, messages] of Object.entries(errors)) {
        if (messages && messages.length > 0) {
          details[field] = messages[0];
        }
      }

      const error = createValidationError(details);
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const targetDate = validation.data.date;

    // Step 3: Fetch starting balance to validate date range
    let startingBalanceDate: string;

    try {
      // Try to get starting balance to validate date range
      const { data: startingBalance, error: sbError } = await supabase
        .from("starting_balances")
        .select("effective_date")
        .eq("user_id", userId)
        .single();

      if (sbError || !startingBalance) {
        console.log(`[WARN] [${requestId}] Starting balance not found for user ${userId}`);
        const error = createNotFoundError("No starting balance configured. Please set a starting balance first.");
        return new Response(JSON.stringify(error.body), {
          status: error.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      startingBalanceDate = startingBalance.effective_date;
    } catch (error) {
      console.log(`[WARN] [${requestId}] Error checking starting balance:`, error);
      const errorResponse = createNotFoundError("No starting balance configured. Please set a starting balance first.");
      return new Response(JSON.stringify(errorResponse.body), {
        status: errorResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate date range
    const dateRangeValidation = validateProjectionDateRange(targetDate, startingBalanceDate);

    if (!dateRangeValidation.valid) {
      console.log(`[WARN] [${requestId}] Date range validation failed:`, dateRangeValidation.error);
      const error = createValidationError({
        date: dateRangeValidation.error || "Invalid date range",
      });
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Call service layer to get projection
    const projectionService = new ProjectionService(supabase, userId);
    const projection = await projectionService.getProjection(targetDate);

    // Step 5: Return success response
    console.log(`[INFO] [${requestId}] Successfully computed projection for user ${userId}`);
    return new Response(JSON.stringify(projection), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("No starting balance")) {
        console.log(`[WARN] [${requestId}] Starting balance not found:`, error.message);
        const errorResponse = createNotFoundError(error.message);
        return new Response(JSON.stringify(errorResponse.body), {
          status: errorResponse.status,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Log and return generic error
    console.error(`[ERROR] [${requestId}] Error computing projection:`, error);
    const errorResponse = createInternalServerError(requestId);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
