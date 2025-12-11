import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateRequestId,
  createValidationError,
  createUnauthorizedError,
  createNotFoundError,
  createInternalServerError,
  formatZodErrors,
} from "@/lib/utils/error-response.utils";

describe("error-response.utils", () => {
  describe("generateRequestId", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should generate a request ID with correct prefix", () => {
      // Arrange & Act
      const requestId = generateRequestId();

      // Assert
      expect(requestId).toMatch(/^req_/);
    });

    it("should include timestamp in request ID", () => {
      // Arrange
      const mockDate = new Date("2025-12-11T14:30:45.123Z");
      vi.setSystemTime(mockDate);

      // Act
      const requestId = generateRequestId();

      // Assert
      expect(requestId).toContain("20251211T143045");
    });

    it("should include random suffix after timestamp", () => {
      // Arrange
      vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));

      // Act
      const requestId = generateRequestId();

      // Assert - format: req_YYYYMMDDTHHMMSS_xxxxxx
      expect(requestId).toMatch(/^req_\d{8}T\d{6}_[a-z0-9]{6}$/);
    });

    it("should generate unique request IDs", () => {
      // Arrange
      vi.useRealTimers(); // Need real randomness for uniqueness test
      const ids = new Set<string>();

      // Act
      for (let i = 0; i < 100; i++) {
        ids.add(generateRequestId());
      }

      // Assert
      expect(ids.size).toBe(100);
    });
  });

  describe("createValidationError", () => {
    it("should return status 400", () => {
      // Arrange
      const details = { email: "Invalid email format" };

      // Act
      const result = createValidationError(details);

      // Assert
      expect(result.status).toBe(400);
    });

    it("should return correct error message", () => {
      // Arrange
      const details = { field: "error" };

      // Act
      const result = createValidationError(details);

      // Assert
      expect(result.body.error).toBe("Validation failed");
    });

    it("should include provided details in body", () => {
      // Arrange
      const details = {
        email: "Invalid email format",
        password: "Password must be at least 8 characters",
      };

      // Act
      const result = createValidationError(details);

      // Assert
      expect(result.body.details).toEqual(details);
    });

    it("should handle empty details object", () => {
      // Arrange
      const details = {};

      // Act
      const result = createValidationError(details);

      // Assert
      expect(result.body.details).toEqual({});
    });

    it("should handle single field validation error", () => {
      // Arrange
      const details = { amount: "Amount must be positive" };

      // Act
      const result = createValidationError(details);

      // Assert
      expect(result.body.details).toHaveProperty("amount");
      expect(result.body.details.amount).toBe("Amount must be positive");
    });
  });

  describe("createUnauthorizedError", () => {
    it("should return status 401", () => {
      // Act
      const result = createUnauthorizedError();

      // Assert
      expect(result.status).toBe(401);
    });

    it("should return correct error type", () => {
      // Act
      const result = createUnauthorizedError();

      // Assert
      expect(result.body.error).toBe("Unauthorized");
    });

    it("should return correct error message", () => {
      // Act
      const result = createUnauthorizedError();

      // Assert
      expect(result.body.message).toBe("Invalid or missing authentication token");
    });

    it("should always return the same structure", () => {
      // Act
      const result1 = createUnauthorizedError();
      const result2 = createUnauthorizedError();

      // Assert
      expect(result1).toEqual(result2);
    });
  });

  describe("createNotFoundError", () => {
    it("should return status 404", () => {
      // Arrange
      const message = "Resource not found";

      // Act
      const result = createNotFoundError(message);

      // Assert
      expect(result.status).toBe(404);
    });

    it("should return correct error type", () => {
      // Arrange
      const message = "Entry not found";

      // Act
      const result = createNotFoundError(message);

      // Assert
      expect(result.body.error).toBe("Not found");
    });

    it("should include provided message in body", () => {
      // Arrange
      const message = "Entry with id 123 not found";

      // Act
      const result = createNotFoundError(message);

      // Assert
      expect(result.body.message).toBe(message);
    });

    it("should handle empty message", () => {
      // Arrange
      const message = "";

      // Act
      const result = createNotFoundError(message);

      // Assert
      expect(result.body.message).toBe("");
    });

    it("should preserve special characters in message", () => {
      // Arrange
      const message = "Entry <id='abc-123'> not found!";

      // Act
      const result = createNotFoundError(message);

      // Assert
      expect(result.body.message).toBe(message);
    });
  });

  describe("createInternalServerError", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return status 500", () => {
      // Act
      const result = createInternalServerError();

      // Assert
      expect(result.status).toBe(500);
    });

    it("should return correct error type", () => {
      // Act
      const result = createInternalServerError();

      // Assert
      expect(result.body.error).toBe("Internal server error");
    });

    it("should return correct error message", () => {
      // Act
      const result = createInternalServerError();

      // Assert
      expect(result.body.message).toBe(
        "An unexpected error occurred. Please try again later."
      );
    });

    it("should use provided request ID when given", () => {
      // Arrange
      const customRequestId = "req_custom_123456";

      // Act
      const result = createInternalServerError(customRequestId);

      // Assert
      expect(result.body.request_id).toBe(customRequestId);
    });

    it("should generate request ID when not provided", () => {
      // Arrange
      vi.setSystemTime(new Date("2025-12-11T10:00:00.000Z"));

      // Act
      const result = createInternalServerError();

      // Assert
      expect(result.body.request_id).toMatch(/^req_\d{8}T\d{6}_[a-z0-9]{6}$/);
    });

    it("should generate unique request IDs for each call without provided ID", () => {
      // Arrange
      vi.useRealTimers();

      // Act
      const result1 = createInternalServerError();
      const result2 = createInternalServerError();

      // Assert
      expect(result1.body.request_id).not.toBe(result2.body.request_id);
    });
  });

  describe("formatZodErrors", () => {
    it("should format single field error", () => {
      // Arrange
      const zodError = {
        errors: [{ path: ["email"], message: "Invalid email" }],
      };

      // Act
      const result = formatZodErrors(zodError);

      // Assert
      expect(result).toEqual({ email: "Invalid email" });
    });

    it("should format multiple field errors", () => {
      // Arrange
      const zodError = {
        errors: [
          { path: ["email"], message: "Invalid email" },
          { path: ["password"], message: "Too short" },
          { path: ["age"], message: "Must be positive" },
        ],
      };

      // Act
      const result = formatZodErrors(zodError);

      // Assert
      expect(result).toEqual({
        email: "Invalid email",
        password: "Too short",
        age: "Must be positive",
      });
    });

    it("should handle nested paths with dot notation", () => {
      // Arrange
      const zodError = {
        errors: [
          { path: ["address", "city"], message: "City is required" },
          { path: ["address", "zip"], message: "Invalid zip code" },
        ],
      };

      // Act
      const result = formatZodErrors(zodError);

      // Assert
      expect(result).toEqual({
        "address.city": "City is required",
        "address.zip": "Invalid zip code",
      });
    });

    it("should handle array indices in paths", () => {
      // Arrange
      const zodError = {
        errors: [
          { path: ["items", 0, "name"], message: "Name required" },
          { path: ["items", 1, "price"], message: "Invalid price" },
        ],
      };

      // Act
      const result = formatZodErrors(zodError);

      // Assert
      expect(result).toEqual({
        "items.0.name": "Name required",
        "items.1.price": "Invalid price",
      });
    });

    it("should handle deeply nested paths", () => {
      // Arrange
      const zodError = {
        errors: [
          {
            path: ["user", "profile", "settings", "notifications", "email"],
            message: "Invalid value",
          },
        ],
      };

      // Act
      const result = formatZodErrors(zodError);

      // Assert
      expect(result).toEqual({
        "user.profile.settings.notifications.email": "Invalid value",
      });
    });

    it("should return empty object for empty errors array", () => {
      // Arrange
      const zodError = { errors: [] };

      // Act
      const result = formatZodErrors(zodError);

      // Assert
      expect(result).toEqual({});
    });

    it("should handle root-level error (empty path)", () => {
      // Arrange
      const zodError = {
        errors: [{ path: [], message: "Invalid input" }],
      };

      // Act
      const result = formatZodErrors(zodError);

      // Assert
      expect(result).toEqual({ "": "Invalid input" });
    });

    it("should handle undefined errors property gracefully", () => {
      // Arrange
      const zodError = {} as { errors: { path: (string | number)[]; message: string }[] };

      // Act
      const result = formatZodErrors(zodError);

      // Assert
      expect(result).toEqual({});
    });

    it("should overwrite duplicate field errors with last occurrence", () => {
      // Arrange
      const zodError = {
        errors: [
          { path: ["email"], message: "First error" },
          { path: ["email"], message: "Second error" },
        ],
      };

      // Act
      const result = formatZodErrors(zodError);

      // Assert
      expect(result).toEqual({ email: "Second error" });
    });
  });

  describe("integration scenarios", () => {
    it("should work together: formatZodErrors → createValidationError", () => {
      // Arrange
      const zodError = {
        errors: [
          { path: ["title"], message: "Title is required" },
          { path: ["amount"], message: "Amount must be positive" },
        ],
      };

      // Act
      const formattedErrors = formatZodErrors(zodError);
      const response = createValidationError(formattedErrors);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Validation failed");
      expect(response.body.details).toEqual({
        title: "Title is required",
        amount: "Amount must be positive",
      });
    });

    it("should maintain type safety for all error responses", () => {
      // Arrange & Act
      const validationError = createValidationError({ field: "error" });
      const unauthorizedError = createUnauthorizedError();
      const notFoundError = createNotFoundError("Not found");
      const serverError = createInternalServerError("req_123");

      // Assert - TypeScript compile-time checks + runtime verification
      expect(validationError.status).toBe(400);
      expect(unauthorizedError.status).toBe(401);
      expect(notFoundError.status).toBe(404);
      expect(serverError.status).toBe(500);
    });
  });
});

