/**
 * Entries API Endpoints - Detail, Update, Delete
 * Handles GET, PUT, DELETE for specific entry series by ID
 */

import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import { getAuthenticatedUser } from "../../../lib/utils/auth.utils";
import { EntriesService } from "../../../lib/services/entries.service";
import {
  updateEntryQuerySchema,
  deleteEntryQuerySchema,
  updateEntrySchema,
} from "../../../lib/validation/entries.validation";
import {
  createUnauthorizedError,
  createValidationError,
  createNotFoundError,
  createInternalServerError,
  formatZodErrors,
  generateRequestId,
} from "../../../lib/utils/error-response.utils";
import type { NotFoundErrorDTO, ConflictErrorDTO } from "../../../types";
import { z } from "zod";

// Disable prerendering for API routes
export const prerender = false;

// Validate ID as UUID (basic check)
const uuidSchema = z.string().uuid();

/**
 * GET /api/entries/:id
 * Retrieve details of a specific entry series including exceptions
 */
export const GET: APIRoute = async ({ locals, params }) => {
  const requestId = generateRequestId();

  try {
    // Extract Supabase client from context
    const supabase = locals.supabase as SupabaseClient<Database>;

    // Verify user session exists
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      console.log(
        `[WARN] [${requestId}] Unauthorized access attempt to GET entry ${params.id}`,
      );
      const error = createUnauthorizedError();
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = user;

    // Validate ID
    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      console.log(
        `[WARN] [${requestId}] Invalid ID format for user ${userId}: ${params.id}`,
      );
      const error = createValidationError({ id: "ID must be a valid UUID" });
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const id = idValidation.data;

    console.log(
      `[INFO] [${requestId}] Fetching entry details for user ${userId}, id ${id}`,
    );

    // Instantiate service and call findById
    const service = new EntriesService(supabase);
    const entryDetail = await service.findById(userId, id);

    if (!entryDetail) {
      console.log(
        `[WARN] [${requestId}] Entry not found for user ${userId}, id ${id}`,
      );
      const error = createNotFoundError(`Entry series with id ${id} not found`);
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(
      `[INFO] [${requestId}] Successfully retrieved entry details for user ${userId}, id ${id}`,
    );

    return new Response(JSON.stringify(entryDetail), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(
      `[ERROR] [${requestId}] Error retrieving entry details:`,
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
 * PUT /api/entries/:id
 * Update an entry series with scope handling
 */
export const PUT: APIRoute = async ({ request, locals, params }) => {
  const requestId = generateRequestId();

  try {
    // Extract Supabase client from context
    const supabase = locals.supabase as SupabaseClient<Database>;

    // Verify user session exists
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      console.log(
        `[WARN] [${requestId}] Unauthorized access attempt to PUT entry ${params.id}`,
      );
      const error = createUnauthorizedError();
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = user;

    // Validate ID
    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      console.log(
        `[WARN] [${requestId}] Invalid ID format for user ${userId}: ${params.id}`,
      );
      const error = createValidationError({ id: "ID must be a valid UUID" });
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const id = idValidation.data;

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const queryValidation = updateEntryQuerySchema.safeParse(queryParams);
    if (!queryValidation.success) {
      console.log(
        `[WARN] [${requestId}] Query validation failed for user ${userId}:`,
        queryValidation.error,
      );
      const details = formatZodErrors(queryValidation.error);
      const error = createValidationError(details);
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { scope, date } = queryValidation.data;

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
    const bodyValidation = updateEntrySchema.safeParse(body);
    if (!bodyValidation.success) {
      console.log(
        `[WARN] [${requestId}] Body validation failed for user ${userId}:`,
        bodyValidation.error,
      );
      const details = formatZodErrors(bodyValidation.error);
      const error = createValidationError(details);
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const command = bodyValidation.data;
    console.log(
      `[INFO] [${requestId}] Updating entry for user ${userId}, id ${id}, scope ${scope}`,
    );

    // Instantiate service and call update
    const service = new EntriesService(supabase);
    const updated = await service.update(userId, id, command, scope, date);

    console.log(
      `[INFO] [${requestId}] Successfully updated entry for user ${userId}, id ${id}, scope ${scope}`,
    );

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === "NotFoundError") {
      const dto: NotFoundErrorDTO = {
        error: "Not found",
        message: err.message,
      };
      return new Response(JSON.stringify(dto), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (err.name === "ConflictError") {
      const dto: ConflictErrorDTO = {
        error: "Conflict",
        message: err.message,
      };
      return new Response(JSON.stringify(dto), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error(`[ERROR] [${requestId}] Error updating entry:`, error);
    const errorResponse = createInternalServerError(requestId);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * DELETE /api/entries/:id
 * Delete an entry series with scope handling
 */
export const DELETE: APIRoute = async ({ request, locals, params }) => {
  const requestId = generateRequestId();

  try {
    // Extract Supabase client from context
    const supabase = locals.supabase as SupabaseClient<Database>;

    // Verify user session exists
    const user = await getAuthenticatedUser(supabase);
    if (!user) {
      console.log(
        `[WARN] [${requestId}] Unauthorized access attempt to DELETE entry ${params.id}`,
      );
      const error = createUnauthorizedError();
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { userId } = user;

    // Validate ID
    const idValidation = uuidSchema.safeParse(params.id);
    if (!idValidation.success) {
      console.log(
        `[WARN] [${requestId}] Invalid ID format for user ${userId}: ${params.id}`,
      );
      const error = createValidationError({ id: "ID must be a valid UUID" });
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const id = idValidation.data;

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const queryValidation = deleteEntryQuerySchema.safeParse(queryParams);
    if (!queryValidation.success) {
      console.log(
        `[WARN] [${requestId}] Query validation failed for user ${userId}:`,
        queryValidation.error,
      );
      const details = formatZodErrors(queryValidation.error);
      const error = createValidationError(details);
      return new Response(JSON.stringify(error.body), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { scope, date } = queryValidation.data;

    console.log(
      `[INFO] [${requestId}] Deleting entry for user ${userId}, id ${id}, scope ${scope}`,
    );

    // Instantiate service and call delete
    const service = new EntriesService(supabase);
    const deleted = await service.delete(userId, id, scope, date);

    console.log(
      `[INFO] [${requestId}] Successfully deleted entry for user ${userId}, id ${id}, scope ${scope}`,
    );

    return new Response(JSON.stringify(deleted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.name === "NotFoundError") {
      const dto: NotFoundErrorDTO = {
        error: "Not found",
        message: err.message,
      };
      return new Response(JSON.stringify(dto), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (err.name === "ConflictError") {
      const dto: ConflictErrorDTO = {
        error: "Conflict",
        message: err.message,
      };
      return new Response(JSON.stringify(dto), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error(`[ERROR] [${requestId}] Error deleting entry:`, error);
    const errorResponse = createInternalServerError(requestId);
    return new Response(JSON.stringify(errorResponse.body), {
      status: errorResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }
};
