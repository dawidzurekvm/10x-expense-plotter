/**
 * Error response helper utilities
 * Creates standardized error responses for API endpoints
 */

import type {
  ValidationErrorDTO,
  UnauthorizedErrorDTO,
  NotFoundErrorDTO,
  InternalServerErrorDTO,
} from "../../types";

/**
 * Generate a unique request ID for tracking errors
 */
export function generateRequestId(): string {
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * Create a validation error response (400 Bad Request)
 * @param details - Field-specific error messages
 */
export function createValidationError(details: Record<string, string>): {
  status: 400;
  body: ValidationErrorDTO;
} {
  return {
    status: 400,
    body: {
      error: "Validation failed",
      details,
    },
  };
}

/**
 * Create an unauthorized error response (401 Unauthorized)
 */
export function createUnauthorizedError(): {
  status: 401;
  body: UnauthorizedErrorDTO;
} {
  return {
    status: 401,
    body: {
      error: "Unauthorized",
      message: "Invalid or missing authentication token",
    },
  };
}

/**
 * Create a not found error response (404 Not Found)
 * @param message - Descriptive error message
 */
export function createNotFoundError(message: string): {
  status: 404;
  body: NotFoundErrorDTO;
} {
  return {
    status: 404,
    body: {
      error: "Not found",
      message,
    },
  };
}

/**
 * Create an internal server error response (500 Internal Server Error)
 * @param requestId - Optional request ID for tracking
 */
export function createInternalServerError(requestId?: string): {
  status: 500;
  body: InternalServerErrorDTO;
} {
  const finalRequestId = requestId || generateRequestId();
  return {
    status: 500,
    body: {
      error: "Internal server error",
      message: "An unexpected error occurred. Please try again later.",
      request_id: finalRequestId,
    },
  };
}

/**
 * Format Zod validation errors into field-specific error messages
 * @param error - Zod error object
 */
export function formatZodErrors(error: {
  errors: { path: (string | number)[]; message: string }[];
}): Record<string, string> {
  const details: Record<string, string> = {};

  if (error.errors && Array.isArray(error.errors)) {
    for (const err of error.errors) {
      const field = err.path.join(".");
      details[field] = err.message;
    }
  }

  return details;
}
