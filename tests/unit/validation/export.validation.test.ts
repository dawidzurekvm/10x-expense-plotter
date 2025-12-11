import { describe, it, expect } from "vitest";
import { exportCSVQuerySchema } from "@/lib/validation/export.validation";

describe("export.validation", () => {
  // ============================================================================
  // exportCSVQuerySchema
  // ============================================================================
  describe("exportCSVQuerySchema", () => {
    // --------------------------------------------------------------------------
    // Valid inputs
    // --------------------------------------------------------------------------
    describe("valid inputs", () => {
      it("should accept empty object (all fields optional)", () => {
        // Arrange
        const input = {};

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept only from_date", () => {
        // Arrange
        const input = { from_date: "2025-01-15" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.from_date).toBe("2025-01-15");
          expect(result.data.to_date).toBeUndefined();
          expect(result.data.entry_type).toBeUndefined();
        }
      });

      it("should accept only to_date", () => {
        // Arrange
        const input = { to_date: "2025-12-31" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.to_date).toBe("2025-12-31");
          expect(result.data.from_date).toBeUndefined();
        }
      });

      it("should accept only entry_type income", () => {
        // Arrange
        const input = { entry_type: "income" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.entry_type).toBe("income");
        }
      });

      it("should accept only entry_type expense", () => {
        // Arrange
        const input = { entry_type: "expense" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.entry_type).toBe("expense");
        }
      });

      it("should accept all fields together", () => {
        // Arrange
        const input = {
          from_date: "2025-01-01",
          to_date: "2025-12-31",
          entry_type: "income",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.from_date).toBe("2025-01-01");
          expect(result.data.to_date).toBe("2025-12-31");
          expect(result.data.entry_type).toBe("income");
        }
      });

      it("should accept same date for from_date and to_date", () => {
        // Arrange
        const input = {
          from_date: "2025-06-15",
          to_date: "2025-06-15",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept date range just under 100 years", () => {
        // Arrange - 99 years is safely under 36500 days
        const input = {
          from_date: "2000-01-01",
          to_date: "2099-01-01",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept leap year date (February 29)", () => {
        // Arrange
        const input = {
          from_date: "2024-02-29",
          to_date: "2024-03-15",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept first day of year", () => {
        // Arrange
        const input = { from_date: "2025-01-01" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept last day of year", () => {
        // Arrange
        const input = { to_date: "2025-12-31" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept dates with zero-padded single digit months and days", () => {
        // Arrange
        const input = {
          from_date: "2025-03-05",
          to_date: "2025-09-08",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept from_date and entry_type without to_date", () => {
        // Arrange
        const input = {
          from_date: "2025-01-01",
          entry_type: "expense",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept to_date and entry_type without from_date", () => {
        // Arrange
        const input = {
          to_date: "2025-12-31",
          entry_type: "income",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    // --------------------------------------------------------------------------
    // Invalid date formats - from_date
    // --------------------------------------------------------------------------
    describe("invalid from_date formats", () => {
      it("should reject from_date with wrong separator (slash)", () => {
        // Arrange
        const input = { from_date: "2025/01/15" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Invalid date format. Expected YYYY-MM-DD"
          );
        }
      });

      it("should reject from_date with wrong separator (dot)", () => {
        // Arrange
        const input = { from_date: "2025.01.15" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Invalid date format. Expected YYYY-MM-DD"
          );
        }
      });

      it("should reject from_date in DD-MM-YYYY format", () => {
        // Arrange
        const input = { from_date: "15-01-2025" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Invalid date format. Expected YYYY-MM-DD"
          );
        }
      });

      it("should reject from_date in MM-DD-YYYY format", () => {
        // Arrange
        const input = { from_date: "01-15-2025" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Invalid date format. Expected YYYY-MM-DD"
          );
        }
      });

      it("should reject from_date with non-padded month", () => {
        // Arrange
        const input = { from_date: "2025-1-15" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject from_date with non-padded day", () => {
        // Arrange
        const input = { from_date: "2025-01-5" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject from_date with 2-digit year", () => {
        // Arrange
        const input = { from_date: "25-01-15" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject from_date as empty string", () => {
        // Arrange
        const input = { from_date: "" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject from_date as non-date string", () => {
        // Arrange
        const input = { from_date: "not-a-date" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject from_date as number", () => {
        // Arrange
        const input = { from_date: 20250115 };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject from_date as Date object", () => {
        // Arrange
        const input = { from_date: new Date("2025-01-15") };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject from_date with extra characters", () => {
        // Arrange
        const input = { from_date: "2025-01-15T00:00:00" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject from_date with whitespace", () => {
        // Arrange
        const input = { from_date: " 2025-01-15 " };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // Invalid date formats - to_date
    // --------------------------------------------------------------------------
    describe("invalid to_date formats", () => {
      it("should reject to_date with wrong separator (slash)", () => {
        // Arrange
        const input = { to_date: "2025/12/31" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Invalid date format. Expected YYYY-MM-DD"
          );
        }
      });

      it("should reject to_date in DD-MM-YYYY format", () => {
        // Arrange
        const input = { to_date: "31-12-2025" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject to_date as empty string", () => {
        // Arrange
        const input = { to_date: "" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject to_date as number", () => {
        // Arrange
        const input = { to_date: 20251231 };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // Invalid entry_type values
    // --------------------------------------------------------------------------
    describe("invalid entry_type values", () => {
      it("should reject invalid entry_type value", () => {
        // Arrange
        const input = { entry_type: "other" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Invalid entry type. Must be 'income' or 'expense'"
          );
        }
      });

      it("should reject entry_type as empty string", () => {
        // Arrange
        const input = { entry_type: "" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Invalid entry type. Must be 'income' or 'expense'"
          );
        }
      });

      it("should reject entry_type as number", () => {
        // Arrange
        const input = { entry_type: 1 };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject entry_type with uppercase", () => {
        // Arrange
        const input = { entry_type: "INCOME" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Invalid entry type. Must be 'income' or 'expense'"
          );
        }
      });

      it("should reject entry_type with mixed case", () => {
        // Arrange
        const input = { entry_type: "Income" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject entry_type with whitespace", () => {
        // Arrange
        const input = { entry_type: " income " };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject entry_type as boolean", () => {
        // Arrange
        const input = { entry_type: true };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // Date range validation - to_date must be >= from_date
    // --------------------------------------------------------------------------
    describe("date range validation (to_date >= from_date)", () => {
      it("should reject when to_date is before from_date", () => {
        // Arrange
        const input = {
          from_date: "2025-12-31",
          to_date: "2025-01-01",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "End date must be greater than or equal to start date"
          );
          expect(result.error.issues[0].path).toContain("to_date");
        }
      });

      it("should reject when to_date is one day before from_date", () => {
        // Arrange
        const input = {
          from_date: "2025-06-16",
          to_date: "2025-06-15",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "End date must be greater than or equal to start date"
          );
        }
      });

      it("should accept when to_date equals from_date", () => {
        // Arrange
        const input = {
          from_date: "2025-06-15",
          to_date: "2025-06-15",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept when to_date is one day after from_date", () => {
        // Arrange
        const input = {
          from_date: "2025-06-15",
          to_date: "2025-06-16",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should skip date comparison when only from_date is provided", () => {
        // Arrange
        const input = { from_date: "2025-12-31" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should skip date comparison when only to_date is provided", () => {
        // Arrange
        const input = { to_date: "2025-01-01" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should reject to_date before from_date across year boundary", () => {
        // Arrange
        const input = {
          from_date: "2026-01-01",
          to_date: "2025-12-31",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "End date must be greater than or equal to start date"
          );
        }
      });

      it("should accept date range spanning multiple years", () => {
        // Arrange
        const input = {
          from_date: "2020-01-01",
          to_date: "2025-12-31",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    // --------------------------------------------------------------------------
    // Date range validation - maximum 100 years
    // --------------------------------------------------------------------------
    describe("date range validation (maximum 100 years)", () => {
      it("should reject date range exceeding 100 years", () => {
        // Arrange - more than 36500 days
        const input = {
          from_date: "1900-01-01",
          to_date: "2025-01-01",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Date range cannot exceed 100 years"
          );
          expect(result.error.issues[0].path).toContain("to_date");
        }
      });

      it("should accept date range at exactly 36500 days", () => {
        // Arrange - exactly 36500 days from 2000-01-01
        // 36500 days = 2000-01-01 + 36500 days = ~2099-12-05 (accounting for leap years)
        const input = {
          from_date: "2000-01-01",
          to_date: "2099-12-05",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should reject date range at 101 years", () => {
        // Arrange
        const input = {
          from_date: "2000-01-01",
          to_date: "2101-01-01",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "Date range cannot exceed 100 years"
          );
        }
      });

      it("should skip 100-year check when only from_date is provided", () => {
        // Arrange
        const input = { from_date: "1900-01-01" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should skip 100-year check when only to_date is provided", () => {
        // Arrange
        const input = { to_date: "2100-12-31" };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept 50-year date range", () => {
        // Arrange
        const input = {
          from_date: "2000-01-01",
          to_date: "2050-01-01",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept 1-year date range", () => {
        // Arrange
        const input = {
          from_date: "2025-01-01",
          to_date: "2025-12-31",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    // --------------------------------------------------------------------------
    // Combined validation errors
    // --------------------------------------------------------------------------
    describe("combined validation errors", () => {
      it("should report multiple errors for invalid from_date and entry_type", () => {
        // Arrange
        const input = {
          from_date: "invalid",
          entry_type: "invalid",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
        }
      });

      it("should report multiple errors for invalid from_date and to_date", () => {
        // Arrange
        const input = {
          from_date: "bad-date",
          to_date: "another-bad-date",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
        }
      });

      it("should validate date format before date range comparison", () => {
        // Arrange - invalid format, so range comparison shouldn't matter
        const input = {
          from_date: "2025/12/31",
          to_date: "2025/01/01",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          // Should have format errors, not range errors
          const hasFormatError = result.error.issues.some((issue) =>
            issue.message.includes("Invalid date format")
          );
          expect(hasFormatError).toBe(true);
        }
      });
    });

    // --------------------------------------------------------------------------
    // Edge cases
    // --------------------------------------------------------------------------
    describe("edge cases", () => {
      it("should handle null values as invalid", () => {
        // Arrange
        const input = {
          from_date: null,
          to_date: null,
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should ignore extra properties (strip unknown)", () => {
        // Arrange
        const input = {
          from_date: "2025-01-01",
          to_date: "2025-12-31",
          unknown_field: "should be ignored",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).not.toHaveProperty("unknown_field");
        }
      });

      it("should handle far future dates", () => {
        // Arrange
        const input = {
          from_date: "9999-01-01",
          to_date: "9999-12-31",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should handle historical dates", () => {
        // Arrange
        const input = {
          from_date: "1900-01-01",
          to_date: "1900-12-31",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should handle month boundary dates", () => {
        // Arrange
        const input = {
          from_date: "2025-01-31",
          to_date: "2025-02-01",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept February 28 in non-leap year", () => {
        // Arrange - 2025 is not a leap year
        const input = {
          from_date: "2025-02-28",
          to_date: "2025-03-01",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept entry_type with valid dates", () => {
        // Arrange
        const input = {
          from_date: "2025-01-01",
          to_date: "2025-12-31",
          entry_type: "expense",
        };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.entry_type).toBe("expense");
        }
      });
    });

    // --------------------------------------------------------------------------
    // Type coercion behavior
    // --------------------------------------------------------------------------
    describe("type coercion behavior", () => {
      it("should not coerce number to string for dates", () => {
        // Arrange
        const input = { from_date: 2025 };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should not coerce boolean to string for entry_type", () => {
        // Arrange
        const input = { entry_type: false };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should not coerce array to valid input", () => {
        // Arrange
        const input = { from_date: ["2025-01-01"] };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should not coerce object to string for dates", () => {
        // Arrange
        const input = { from_date: { year: 2025, month: 1, day: 15 } };

        // Act
        const result = exportCSVQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });
  });
});

