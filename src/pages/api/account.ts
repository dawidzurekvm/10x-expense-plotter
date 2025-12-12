/**
 * Account Management API Endpoints
 * Handles DELETE operation for user account deletion
 */

import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { deleteAccountSchema } from "../../lib/validation/account.validation";
import {
  createUnauthorizedError,
  createInternalServerError,
  createValidationError,
  formatZodErrors,
  generateRequestId,
} from "../../lib/utils/error-response.utils";
import type { DeleteAccountResponseDTO } from "../../types";
import { getAuthenticatedUser } from "../../lib/utils/auth.utils";

// Helper to get env var from Cloudflare runtime or fallback to import.meta.env
function getEnvVar(name: string, runtimeEnv?: Record<string, string>): string {
  if (runtimeEnv && name in runtimeEnv) {
    return runtimeEnv[name];
  }
  return (import.meta.env as Record<string, string>)[name] ?? "";
}

// Disable prerendering for API routes
export const prerender = false;

/**
 * DELETE /api/account
 * Permanently delete the authenticated user's account and all associated data
 *
 * Requires explicit confirmation string to prevent accidental deletion.
 * Data deletion order respects foreign key constraints:
 * 1. series_exceptions (references entry_series)
 * 2. entry_series
 * 3. starting_balances
 * 4. analytics_events
 * 5. auth.users (via Supabase Edge Function)
 */
export const DELETE: APIRoute = async ({ request, locals }) => {
  const requestId = generateRequestId();

  // Get Cloudflare runtime env (available in production on Cloudflare Pages)
  const runtimeEnv = locals.runtime?.env as Record<string, string> | undefined;

  try {
    // Extract Supabase client from context
    const supabase = locals.supabase as SupabaseClient<Database>;

    // Verify user session exists
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      console.log(
        `[WARN] [${requestId}] Unauthorized access attempt to DELETE account`
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
    const validationResult = deleteAccountSchema.safeParse(body);
    if (!validationResult.success) {
      console.log(
        `[WARN] [${requestId}] Validation failed for user ${userId}:`,
        validationResult.error
      );
      const details = formatZodErrors(validationResult.error);
      const error = createValidationError(details);
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[INFO] [${requestId}] Starting account deletion for user ${userId}`
    );

    // Delete user data in correct order (respecting foreign key constraints)
    // Note: series_exceptions has FK to entry_series, so we need to handle this properly
    // The entry_series table may have cascade delete configured, but we delete explicitly for safety

    // 1. Delete series_exceptions (references entry_series via series_id)
    const { error: exceptionsError } = await supabase
      .from("series_exceptions")
      .delete()
      .eq("user_id", userId);

    if (exceptionsError) {
      console.error(
        `[ERROR] [${requestId}] Failed to delete series_exceptions for user ${userId}:`,
        exceptionsError
      );
      const errorResponse = createInternalServerError(requestId);
      return new Response(JSON.stringify(errorResponse.body), {
        status: errorResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[INFO] [${requestId}] Deleted series_exceptions for user ${userId}`
    );

    // 2. Delete entry_series (may have self-reference via parent_series_id)
    const { error: entriesError } = await supabase
      .from("entry_series")
      .delete()
      .eq("user_id", userId);

    if (entriesError) {
      console.error(
        `[ERROR] [${requestId}] Failed to delete entry_series for user ${userId}:`,
        entriesError
      );
      const errorResponse = createInternalServerError(requestId);
      return new Response(JSON.stringify(errorResponse.body), {
        status: errorResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[INFO] [${requestId}] Deleted entry_series for user ${userId}`
    );

    // 3. Delete starting_balances
    const { error: balanceError } = await supabase
      .from("starting_balances")
      .delete()
      .eq("user_id", userId);

    if (balanceError) {
      console.error(
        `[ERROR] [${requestId}] Failed to delete starting_balances for user ${userId}:`,
        balanceError
      );
      const errorResponse = createInternalServerError(requestId);
      return new Response(JSON.stringify(errorResponse.body), {
        status: errorResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[INFO] [${requestId}] Deleted starting_balances for user ${userId}`
    );

    // 4. Delete analytics_events
    const { error: analyticsError } = await supabase
      .from("analytics_events")
      .delete()
      .eq("user_id", userId);

    if (analyticsError) {
      console.error(
        `[ERROR] [${requestId}] Failed to delete analytics_events for user ${userId}:`,
        analyticsError
      );
      const errorResponse = createInternalServerError(requestId);
      return new Response(JSON.stringify(errorResponse.body), {
        status: errorResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[INFO] [${requestId}] Deleted analytics_events for user ${userId}`
    );

    // 5. Delete the user account from auth.users via Edge Function
    // Get the user's access token to authenticate with the Edge Function
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      console.error(
        `[ERROR] [${requestId}] No access token available for user ${userId}`
      );
      const errorResponse = createInternalServerError(requestId);
      return new Response(JSON.stringify(errorResponse.body), {
        status: errorResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Call the Edge Function to delete the auth user
    // Use SUPABASE_FUNCTIONS_URL for local development, fallback to SUPABASE_URL for production
    const functionsBaseUrl = getEnvVar("SUPABASE_FUNCTIONS_URL", runtimeEnv) || getEnvVar("SUPABASE_URL", runtimeEnv);
    const edgeFunctionUrl = `${functionsBaseUrl}/functions/v1/delete-account`;
    const edgeFunctionResponse = await fetch(edgeFunctionUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!edgeFunctionResponse.ok) {
      const errorData = await edgeFunctionResponse.json().catch(() => ({}));
      console.error(
        `[ERROR] [${requestId}] Edge Function failed to delete auth user ${userId}:`,
        errorData
      );
      const errorResponse = createInternalServerError(requestId);
      return new Response(JSON.stringify(errorResponse.body), {
        status: errorResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[INFO] [${requestId}] Deleted auth user for user ${userId}`
    );

    console.log(
      `[INFO] [${requestId}] Successfully deleted all data and account for user ${userId}`
    );

    const response: DeleteAccountResponseDTO = {
      message: "Account deleted successfully",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error with stack trace
    console.error(`[ERROR] [${requestId}] Error deleting account:`, error);
    const errorResponse = createInternalServerError(requestId);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};

