import type { APIRoute } from "astro";
import { exportCSVQuerySchema } from "@/lib/validation/export.validation";
import { generateCSVExport, generateCSVContent, generateCSVFilename } from "@/lib/services/export.service";
import { getStartingBalance } from "@/lib/services/starting-balance.service";
import {
  createUnauthorizedError,
  createNotFoundError,
  createInternalServerError,
  generateRequestId,
} from "@/lib/utils/error-response.utils";
import { getAuthenticatedUser } from "@/lib/utils/auth.utils";

export const prerender = false;

/**
 * GET /api/export/csv
 *
 * Exports all user occurrences as a downloadable CSV file
 *
 * Query Parameters:
 * - from_date (optional): Start date for export range (YYYY-MM-DD)
 * - to_date (optional): End date for export range (YYYY-MM-DD)
 * - entry_type (optional): Filter by entry type ('income' or 'expense')
 *
 * Response:
 * - 200 OK: CSV file with Content-Disposition header
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing or invalid authentication
 * - 404 Not Found: Starting balance not configured (when from_date not provided)
 * - 500 Internal Server Error: Unexpected error
 */
export const GET: APIRoute = async (context) => {
  const requestId = generateRequestId();

  try {
    // 1. Authentication check
    const user = await getAuthenticatedUser(context.locals.supabase);
    if (!user) {
      console.log(`[WARN] [${requestId}] Unauthorized access attempt to GET export/csv`);
      const error = createUnauthorizedError();
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = user;
    console.log(`[INFO] [${requestId}] Generating CSV export for user ${userId}`);

    // 2. Parse and validate query parameters
    const queryParams = Object.fromEntries(context.url.searchParams.entries());
    const validationResult = exportCSVQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join(".");
        details[path] = err.message;
      });

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { from_date, to_date, entry_type } = validationResult.data;

    // 3. Determine from_date default
    let fromDate = from_date;
    if (!fromDate) {
      const startingBalance = await getStartingBalance(context.locals.supabase, userId);

      if (!startingBalance) {
        const error = createNotFoundError("Starting balance not configured. Please set up a starting balance first.");
        return new Response(JSON.stringify(error.body), {
          status: error.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      fromDate = startingBalance.effective_date;
    }

    // 4. Determine to_date default (current date + 10 years)
    let toDate = to_date;
    if (!toDate) {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);
      toDate = futureDate.toISOString().split("T")[0];
    }

    // 5. Generate CSV export
    const occurrences = await generateCSVExport(context.locals.supabase, userId, fromDate, toDate, entry_type);

    // 6. Format as CSV
    const csvContent = generateCSVContent(occurrences);
    const filename = generateCSVFilename();

    // 7. Return CSV response
    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(`[ERROR] [${requestId}] Export CSV error:`, error);

    const errorResponse = createInternalServerError(requestId);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
