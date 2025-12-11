import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getProjectionQuerySchema,
  validateProjectionDateRange,
} from "@/lib/validation/projection.validation";

describe("projection.validation", () => {
  // ============================================================================
  // getProjectionQuerySchema
  // ============================================================================
  describe("getProjectionQuerySchema", () => {
    describe("valid inputs", () => {
      it("should accept valid date in YYYY-MM-DD format", () => {
        // Arrange
        const input = { date: "2025-01-15" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.date).toBe("2025-01-15");
        }
      });

      it("should accept valid leap year date (February 29)", () => {
        // Arrange
        const input = { date: "2024-02-29" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.date).toBe("2024-02-29");
        }
      });

      it("should accept first day of year", () => {
        // Arrange
        const input = { date: "2025-01-01" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept last day of year", () => {
        // Arrange
        const input = { date: "2025-12-31" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept dates with single digit months and days (zero-padded)", () => {
        // Arrange
        const input = { date: "2025-03-05" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.date).toBe("2025-03-05");
        }
      });
    });

    describe("missing date parameter", () => {
      it("should reject empty object", () => {
        // Arrange
        const input = {};

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Date parameter is required"
          );
        }
      });

      it("should reject undefined date", () => {
        // Arrange
        const input = { date: undefined };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("invalid date format", () => {
      it("should reject date with slash separator", () => {
        // Arrange
        const input = { date: "2025/01/15" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            "Invalid date format"
          );
        }
      });

      it("should reject date with dot separator", () => {
        // Arrange
        const input = { date: "2025.01.15" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain(
            "Invalid date format"
          );
        }
      });

      it("should reject MM-DD-YYYY format", () => {
        // Arrange
        const input = { date: "01-15-2025" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject DD-MM-YYYY format", () => {
        // Arrange
        const input = { date: "15-01-2025" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject incomplete date - missing day", () => {
        // Arrange
        const input = { date: "2025-01" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject incomplete date - missing month and day", () => {
        // Arrange
        const input = { date: "2025" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject date with extra characters", () => {
        // Arrange
        const input = { date: "2025-01-15T00:00:00" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject date with non-zero-padded month", () => {
        // Arrange
        const input = { date: "2025-1-15" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject date with non-zero-padded day", () => {
        // Arrange
        const input = { date: "2025-01-5" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject empty string", () => {
        // Arrange
        const input = { date: "" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject whitespace only", () => {
        // Arrange
        const input = { date: "   " };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject non-numeric characters in date parts", () => {
        // Arrange
        const input = { date: "202X-01-15" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("invalid calendar dates", () => {
      it("should reject February 30th (never exists)", () => {
        // Arrange
        const input = { date: "2025-02-30" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid date");
        }
      });

      it("should reject February 29th in non-leap year", () => {
        // Arrange
        const input = { date: "2025-02-29" }; // 2025 is not a leap year

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Invalid date");
        }
      });

      it("should reject month 13", () => {
        // Arrange
        const input = { date: "2025-13-01" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject month 00", () => {
        // Arrange
        const input = { date: "2025-00-15" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject day 32", () => {
        // Arrange
        const input = { date: "2025-01-32" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject day 00", () => {
        // Arrange
        const input = { date: "2025-01-00" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject April 31st (April has 30 days)", () => {
        // Arrange
        const input = { date: "2025-04-31" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject September 31st (September has 30 days)", () => {
        // Arrange
        const input = { date: "2025-09-31" };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("type coercion", () => {
      it("should reject number instead of string", () => {
        // Arrange
        const input = { date: 20250115 };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject null", () => {
        // Arrange
        const input = { date: null };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject Date object", () => {
        // Arrange
        const input = { date: new Date("2025-01-15") };

        // Act
        const result = getProjectionQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================================================
  // validateProjectionDateRange
  // ============================================================================
  describe("validateProjectionDateRange", () => {
    describe("valid date ranges", () => {
      it("should accept target date equal to starting balance date", () => {
        // Arrange
        const targetDate = "2025-01-15";
        const startingBalanceDate = "2025-01-15";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it("should accept target date one day after starting balance date", () => {
        // Arrange
        const targetDate = "2025-01-16";
        const startingBalanceDate = "2025-01-15";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(true);
      });

      it("should accept target date several months after starting balance date", () => {
        // Arrange
        const targetDate = "2025-06-15";
        const startingBalanceDate = "2025-01-01";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(true);
      });

      it("should accept target date several years after starting balance date within 10 year limit", () => {
        // Arrange
        const targetDate = "2030-01-01";
        const startingBalanceDate = "2025-01-01";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(true);
      });
    });

    describe("target date before starting balance date", () => {
      it("should reject target date one day before starting balance date", () => {
        // Arrange
        const targetDate = "2025-01-14";
        const startingBalanceDate = "2025-01-15";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toBe(
          "Date must be on or after starting balance effective date (2025-01-15)"
        );
      });

      it("should reject target date several months before starting balance date", () => {
        // Arrange
        const targetDate = "2024-06-15";
        const startingBalanceDate = "2025-01-15";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toContain("2025-01-15");
      });

      it("should reject target date years before starting balance date", () => {
        // Arrange
        const targetDate = "2020-01-01";
        const startingBalanceDate = "2025-01-01";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(false);
      });
    });

    describe("10 year future limit", () => {
      // We need to mock the current date for deterministic tests
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("should accept target date exactly 10 years from now", () => {
        // Arrange
        vi.setSystemTime(new Date("2025-01-15"));
        const targetDate = "2035-01-15";
        const startingBalanceDate = "2025-01-01";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(true);
      });

      it("should accept target date one day before 10 year limit", () => {
        // Arrange
        vi.setSystemTime(new Date("2025-01-15"));
        const targetDate = "2035-01-14";
        const startingBalanceDate = "2025-01-01";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(true);
      });

      it("should reject target date one day after 10 year limit", () => {
        // Arrange
        vi.setSystemTime(new Date("2025-01-15"));
        const targetDate = "2035-01-16";
        const startingBalanceDate = "2025-01-01";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toContain("cannot be more than 10 years");
        expect(result.error).toContain("2035-01-15"); // max date
      });

      it("should reject target date several years beyond 10 year limit", () => {
        // Arrange
        vi.setSystemTime(new Date("2025-01-15"));
        const targetDate = "2040-01-01";
        const startingBalanceDate = "2025-01-01";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toContain("cannot be more than 10 years");
      });

      it("should calculate max date based on current date dynamically", () => {
        // Arrange
        vi.setSystemTime(new Date("2030-06-20"));
        const targetDate = "2040-06-20"; // exactly 10 years
        const startingBalanceDate = "2030-01-01";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(true);
      });

      it("should handle leap year in max date calculation", () => {
        // Arrange - Feb 29 in leap year
        vi.setSystemTime(new Date("2024-02-29"));
        const targetDate = "2034-02-28"; // 10 years later (2034 is not leap year)
        const startingBalanceDate = "2024-01-01";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(true);
      });
    });

    describe("edge cases", () => {
      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-06-15"));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("should prioritize starting balance error over 10 year error when both fail", () => {
        // Arrange
        // Target date is both before starting balance AND more than 10 years ago
        const targetDate = "2010-01-01";
        const startingBalanceDate = "2025-01-01";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(false);
        // The function checks starting balance first
        expect(result.error).toContain("starting balance effective date");
      });

      it("should handle end of year dates correctly", () => {
        // Arrange
        const targetDate = "2025-12-31";
        const startingBalanceDate = "2025-12-31";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(true);
      });

      it("should handle start of year dates correctly", () => {
        // Arrange
        const targetDate = "2026-01-01";
        const startingBalanceDate = "2025-01-01";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(true);
      });

      it("should handle cross-year date range validation", () => {
        // Arrange
        const targetDate = "2026-03-15";
        const startingBalanceDate = "2025-11-20";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.valid).toBe(true);
      });
    });

    describe("error message format", () => {
      beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-01-15"));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("should include starting balance date in error message", () => {
        // Arrange
        const targetDate = "2024-12-01";
        const startingBalanceDate = "2025-03-20";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.error).toBe(
          "Date must be on or after starting balance effective date (2025-03-20)"
        );
      });

      it("should include max date in 10 year limit error message", () => {
        // Arrange
        const targetDate = "2036-06-01";
        const startingBalanceDate = "2025-01-01";

        // Act
        const result = validateProjectionDateRange(
          targetDate,
          startingBalanceDate
        );

        // Assert
        expect(result.error).toBe(
          "Date cannot be more than 10 years in the future (max: 2035-01-15)"
        );
      });
    });
  });
});

