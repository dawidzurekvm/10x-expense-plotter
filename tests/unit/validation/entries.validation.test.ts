import { describe, it, expect } from "vitest";
import {
  createEntrySchema,
  updateEntrySchema,
  getEntriesQuerySchema,
  updateEntryQuerySchema,
  deleteEntryQuerySchema,
} from "@/lib/validation/entries.validation";

describe("entries.validation", () => {
  // ============================================================================
  // createEntrySchema
  // ============================================================================
  describe("createEntrySchema", () => {
    describe("valid inputs", () => {
      it("should accept valid one_time income entry", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "Salary Bonus",
          description: "Year-end bonus",
          amount: 1500.5,
          start_date: "2025-01-15",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.entry_type).toBe("income");
          expect(result.data.recurrence_type).toBe("one_time");
          expect(result.data.title).toBe("Salary Bonus");
          expect(result.data.amount).toBe(1500.5);
        }
      });

      it("should accept valid weekly expense entry", () => {
        // Arrange
        const input = {
          entry_type: "expense",
          recurrence_type: "weekly",
          title: "Grocery shopping",
          description: "Weekly groceries",
          amount: 200,
          start_date: "2025-01-01",
          end_date: "2025-12-31",
          weekday: 6, // Saturday
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.recurrence_type).toBe("weekly");
          expect(result.data.weekday).toBe(6);
          expect(result.data.day_of_month).toBeNull();
        }
      });

      it("should accept valid monthly income entry", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "monthly",
          title: "Monthly Salary",
          description: null,
          amount: 5000,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: 25,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.recurrence_type).toBe("monthly");
          expect(result.data.day_of_month).toBe(25);
          expect(result.data.weekday).toBeNull();
        }
      });

      it("should accept entry with null description", () => {
        // Arrange
        const input = {
          entry_type: "expense",
          recurrence_type: "one_time",
          title: "Car repair",
          description: null,
          amount: 350,
          start_date: "2025-02-10",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.description).toBeNull();
        }
      });

      it("should accept entry with same start_date and end_date", () => {
        // Arrange
        const input = {
          entry_type: "expense",
          recurrence_type: "one_time",
          title: "Conference fee",
          description: "Tech conference registration",
          amount: 299,
          start_date: "2025-06-15",
          end_date: "2025-06-15",
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept weekly entry with weekday 0 (Sunday)", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "weekly",
          title: "Sunday market sales",
          description: null,
          amount: 150,
          start_date: "2025-01-05",
          end_date: null,
          weekday: 0,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.weekday).toBe(0);
        }
      });

      it("should accept monthly entry with day_of_month 1", () => {
        // Arrange
        const input = {
          entry_type: "expense",
          recurrence_type: "monthly",
          title: "Rent payment",
          description: "Apartment rent",
          amount: 1200,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: 1,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.day_of_month).toBe(1);
        }
      });

      it("should accept monthly entry with day_of_month 31", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "monthly",
          title: "End of month bonus",
          description: null,
          amount: 500,
          start_date: "2025-01-31",
          end_date: null,
          weekday: null,
          day_of_month: 31,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.day_of_month).toBe(31);
        }
      });
    });

    describe("entry_type validation", () => {
      it("should reject invalid entry_type", () => {
        // Arrange
        const input = {
          entry_type: "transfer",
          recurrence_type: "one_time",
          title: "Transfer",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject empty entry_type", () => {
        // Arrange
        const input = {
          entry_type: "",
          recurrence_type: "one_time",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("recurrence_type validation", () => {
      it("should reject invalid recurrence_type", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "yearly",
          title: "Annual payment",
          description: null,
          amount: 1000,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("title validation", () => {
      it("should reject empty title", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should accept title with exactly 1 character", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "X",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept title with exactly 120 characters", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "A".repeat(120),
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should reject title exceeding 120 characters", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "A".repeat(121),
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("description validation", () => {
      it("should accept description with exactly 500 characters", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "Test Entry",
          description: "D".repeat(500),
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should reject description exceeding 500 characters", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "Test Entry",
          description: "D".repeat(501),
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("amount validation", () => {
      it("should accept positive decimal amount", () => {
        // Arrange
        const input = {
          entry_type: "expense",
          recurrence_type: "one_time",
          title: "Coffee",
          description: null,
          amount: 4.99,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(4.99);
        }
      });

      it("should accept very small positive amount", () => {
        // Arrange
        const input = {
          entry_type: "expense",
          recurrence_type: "one_time",
          title: "Tiny expense",
          description: null,
          amount: 0.01,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should reject zero amount", () => {
        // Arrange
        const input = {
          entry_type: "expense",
          recurrence_type: "one_time",
          title: "Zero expense",
          description: null,
          amount: 0,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject negative amount", () => {
        // Arrange
        const input = {
          entry_type: "expense",
          recurrence_type: "one_time",
          title: "Negative expense",
          description: null,
          amount: -100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("date format validation", () => {
      it("should reject invalid start_date format - wrong separator", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025/01/15",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("start_date must be YYYY-MM-DD");
        }
      });

      it("should reject invalid start_date format - day/month/year order", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "15-01-2025",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject invalid end_date format", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: "December 31, 2025",
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("end_date must be YYYY-MM-DD");
        }
      });

      it("should reject start_date with non-zero-padded month", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-1-15",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("date range validation", () => {
      it("should reject when end_date is before start_date", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-06-15",
          end_date: "2025-06-01",
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          const endDateError = result.error.issues.find((issue) => issue.path.includes("end_date"));
          expect(endDateError?.message).toBe("end_date must be greater than or equal to start_date");
        }
      });
    });

    describe("recurrence configuration validation", () => {
      it("should reject one_time with non-null weekday", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: 3,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          const recurrenceError = result.error.issues.find((issue) =>
            issue.path.includes("recurrence_type")
          );
          expect(recurrenceError?.message).toContain("Recurrence type requires specific weekday");
        }
      });

      it("should reject one_time with non-null day_of_month", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: 15,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject weekly with null weekday", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "weekly",
          title: "Weekly payment",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject weekly with non-null day_of_month", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "weekly",
          title: "Weekly payment",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: 5,
          day_of_month: 15,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject monthly with null day_of_month", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "monthly",
          title: "Monthly payment",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject monthly with non-null weekday", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "monthly",
          title: "Monthly payment",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: 3,
          day_of_month: 15,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("weekday validation", () => {
      it("should reject weekday below 0", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "weekly",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: -1,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject weekday above 6", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "weekly",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: 7,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject non-integer weekday", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "weekly",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: 3.5,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("day_of_month validation", () => {
      it("should reject day_of_month below 1", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "monthly",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: 0,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject day_of_month above 31", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "monthly",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: 32,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject non-integer day_of_month", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "monthly",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: 15.5,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("date transformation", () => {
      it("should transform dates to YYYY-MM-DD string format in output", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "Test Entry",
          description: null,
          amount: 100,
          start_date: "2025-03-15",
          end_date: "2025-06-30",
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(typeof result.data.start_date).toBe("string");
          expect(typeof result.data.end_date).toBe("string");
          expect(result.data.start_date).toBe("2025-03-15");
          expect(result.data.end_date).toBe("2025-06-30");
        }
      });

      it("should preserve null end_date after transformation", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.end_date).toBeNull();
        }
      });
    });

    describe("missing required fields", () => {
      it("should reject when entry_type is missing", () => {
        // Arrange
        const input = {
          recurrence_type: "one_time",
          title: "Test",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject when title is missing", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          description: null,
          amount: 100,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject when amount is missing", () => {
        // Arrange
        const input = {
          entry_type: "income",
          recurrence_type: "one_time",
          title: "Test",
          description: null,
          start_date: "2025-01-01",
          end_date: null,
          weekday: null,
          day_of_month: null,
        };

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject empty object", () => {
        // Arrange
        const input = {};

        // Act
        const result = createEntrySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================================================
  // updateEntrySchema
  // ============================================================================
  describe("updateEntrySchema", () => {
    it("should have same validation rules as createEntrySchema", () => {
      // Arrange
      const validInput = {
        entry_type: "expense",
        recurrence_type: "monthly",
        title: "Updated Rent",
        description: "Increased rent amount",
        amount: 1350,
        start_date: "2025-02-01",
        end_date: null,
        weekday: null,
        day_of_month: 1,
      };

      // Act
      const result = updateEntrySchema.safeParse(validInput);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should reject invalid update input same as create", () => {
      // Arrange
      const invalidInput = {
        entry_type: "expense",
        recurrence_type: "monthly",
        title: "",
        description: null,
        amount: -50,
        start_date: "2025-02-01",
        end_date: null,
        weekday: null,
        day_of_month: null,
      };

      // Act
      const result = updateEntrySchema.safeParse(invalidInput);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // getEntriesQuerySchema
  // ============================================================================
  describe("getEntriesQuerySchema", () => {
    describe("valid inputs", () => {
      it("should accept empty query (all optional)", () => {
        // Arrange
        const input = {};

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept all filter parameters", () => {
        // Arrange
        const input = {
          entry_type: "expense",
          recurrence_type: "monthly",
          start_date_from: "2025-01-01",
          start_date_to: "2025-12-31",
          limit: 50,
          offset: 10,
          sort_by: "amount",
          sort_order: "desc",
        };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({
            entry_type: "expense",
            recurrence_type: "monthly",
            start_date_from: "2025-01-01",
            start_date_to: "2025-12-31",
            limit: 50,
            offset: 10,
            sort_by: "amount",
            sort_order: "desc",
          });
        }
      });

      it("should accept income entry_type filter", () => {
        // Arrange
        const input = { entry_type: "income" };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.entry_type).toBe("income");
        }
      });

      it("should accept all recurrence_type values", () => {
        // Arrange & Act & Assert
        for (const type of ["one_time", "weekly", "monthly"]) {
          const result = getEntriesQuerySchema.safeParse({ recurrence_type: type });
          expect(result.success).toBe(true);
        }
      });

      it("should accept all sort_by values", () => {
        // Arrange & Act & Assert
        for (const sortBy of ["start_date", "created_at", "amount"]) {
          const result = getEntriesQuerySchema.safeParse({ sort_by: sortBy });
          expect(result.success).toBe(true);
        }
      });

      it("should accept all sort_order values", () => {
        // Arrange & Act & Assert
        for (const order of ["asc", "desc"]) {
          const result = getEntriesQuerySchema.safeParse({ sort_order: order });
          expect(result.success).toBe(true);
        }
      });
    });

    describe("date filter validation", () => {
      it("should reject invalid start_date_from format", () => {
        // Arrange
        const input = { start_date_from: "01/01/2025" };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("start_date_from must be YYYY-MM-DD");
        }
      });

      it("should reject invalid start_date_to format", () => {
        // Arrange
        const input = { start_date_to: "2025.12.31" };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("start_date_to must be YYYY-MM-DD");
        }
      });

      it("should transform date strings to proper format", () => {
        // Arrange
        const input = {
          start_date_from: "2025-03-15",
          start_date_to: "2025-06-30",
        };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.start_date_from).toBe("2025-03-15");
          expect(result.data.start_date_to).toBe("2025-06-30");
        }
      });
    });

    describe("limit validation", () => {
      it("should accept minimum limit of 1", () => {
        // Arrange
        const input = { limit: 1 };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(1);
        }
      });

      it("should accept maximum limit of 100", () => {
        // Arrange
        const input = { limit: 100 };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(100);
        }
      });

      it("should reject limit of 0", () => {
        // Arrange
        const input = { limit: 0 };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject limit exceeding 100", () => {
        // Arrange
        const input = { limit: 101 };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject negative limit", () => {
        // Arrange
        const input = { limit: -5 };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should coerce string limit to number", () => {
        // Arrange
        const input = { limit: "50" };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.limit).toBe(50);
          expect(typeof result.data.limit).toBe("number");
        }
      });
    });

    describe("offset validation", () => {
      it("should accept offset of 0", () => {
        // Arrange
        const input = { offset: 0 };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.offset).toBe(0);
        }
      });

      it("should accept large positive offset", () => {
        // Arrange
        const input = { offset: 10000 };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should reject negative offset", () => {
        // Arrange
        const input = { offset: -1 };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should coerce string offset to number", () => {
        // Arrange
        const input = { offset: "25" };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.offset).toBe(25);
          expect(typeof result.data.offset).toBe("number");
        }
      });
    });

    describe("invalid enum values", () => {
      it("should reject invalid entry_type", () => {
        // Arrange
        const input = { entry_type: "transfer" };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject invalid recurrence_type", () => {
        // Arrange
        const input = { recurrence_type: "yearly" };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject invalid sort_by value", () => {
        // Arrange
        const input = { sort_by: "title" };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject invalid sort_order value", () => {
        // Arrange
        const input = { sort_order: "ascending" };

        // Act
        const result = getEntriesQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================================================
  // updateEntryQuerySchema
  // ============================================================================
  describe("updateEntryQuerySchema", () => {
    describe("valid inputs", () => {
      it("should accept scope=entire without date", () => {
        // Arrange
        const input = { scope: "entire" };

        // Act
        const result = updateEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.scope).toBe("entire");
          expect(result.data.date).toBeUndefined();
        }
      });

      it("should accept scope=entire with date", () => {
        // Arrange
        const input = { scope: "entire", date: "2025-06-15" };

        // Act
        const result = updateEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.date).toBe("2025-06-15");
        }
      });

      it("should accept scope=occurrence with date", () => {
        // Arrange
        const input = { scope: "occurrence", date: "2025-06-15" };

        // Act
        const result = updateEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.scope).toBe("occurrence");
          expect(result.data.date).toBe("2025-06-15");
        }
      });

      it("should accept scope=future with date", () => {
        // Arrange
        const input = { scope: "future", date: "2025-06-15" };

        // Act
        const result = updateEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.scope).toBe("future");
          expect(result.data.date).toBe("2025-06-15");
        }
      });
    });

    describe("date requirement based on scope", () => {
      it("should reject scope=occurrence without date", () => {
        // Arrange
        const input = { scope: "occurrence" };

        // Act
        const result = updateEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          const dateError = result.error.issues.find((issue) => issue.path.includes("date"));
          expect(dateError?.message).toBe("date is required for scope=occurrence or scope=future");
        }
      });

      it("should reject scope=future without date", () => {
        // Arrange
        const input = { scope: "future" };

        // Act
        const result = updateEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          const dateError = result.error.issues.find((issue) => issue.path.includes("date"));
          expect(dateError?.message).toBe("date is required for scope=occurrence or scope=future");
        }
      });
    });

    describe("date format validation", () => {
      it("should reject invalid date format", () => {
        // Arrange
        const input = { scope: "occurrence", date: "15-06-2025" };

        // Act
        const result = updateEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("date must be YYYY-MM-DD");
        }
      });

      it("should reject date with wrong separator", () => {
        // Arrange
        const input = { scope: "future", date: "2025/06/15" };

        // Act
        const result = updateEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should transform valid date to ISO format", () => {
        // Arrange
        const input = { scope: "occurrence", date: "2025-03-20" };

        // Act
        const result = updateEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.date).toBe("2025-03-20");
        }
      });
    });

    describe("scope validation", () => {
      it("should reject invalid scope value", () => {
        // Arrange
        const input = { scope: "all" };

        // Act
        const result = updateEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject missing scope", () => {
        // Arrange
        const input = { date: "2025-06-15" };

        // Act
        const result = updateEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================================================
  // deleteEntryQuerySchema
  // ============================================================================
  describe("deleteEntryQuerySchema", () => {
    describe("valid inputs", () => {
      it("should accept scope=entire without date", () => {
        // Arrange
        const input = { scope: "entire" };

        // Act
        const result = deleteEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept scope=occurrence with date", () => {
        // Arrange
        const input = { scope: "occurrence", date: "2025-06-15" };

        // Act
        const result = deleteEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept scope=future with date", () => {
        // Arrange
        const input = { scope: "future", date: "2025-06-15" };

        // Act
        const result = deleteEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    describe("date requirement based on scope", () => {
      it("should reject scope=occurrence without date", () => {
        // Arrange
        const input = { scope: "occurrence" };

        // Act
        const result = deleteEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject scope=future without date", () => {
        // Arrange
        const input = { scope: "future" };

        // Act
        const result = deleteEntryQuerySchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    it("should have same validation rules as updateEntryQuerySchema", () => {
      // Arrange
      const validInput = { scope: "future", date: "2025-08-20" };
      const invalidInput = { scope: "occurrence" };

      // Act
      const validResult = deleteEntryQuerySchema.safeParse(validInput);
      const invalidResult = deleteEntryQuerySchema.safeParse(invalidInput);

      // Assert
      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
    });
  });

  // ============================================================================
  // Integration scenarios
  // ============================================================================
  describe("integration scenarios", () => {
    it("should validate complete create entry workflow for recurring expense", () => {
      // Arrange - typical monthly expense entry
      const createPayload = {
        entry_type: "expense",
        recurrence_type: "monthly",
        title: "Netflix Subscription",
        description: "Monthly streaming service",
        amount: 15.99,
        start_date: "2025-01-01",
        end_date: null,
        weekday: null,
        day_of_month: 15,
      };

      // Act
      const result = createEntrySchema.safeParse(createPayload);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recurrence_type).toBe("monthly");
        expect(result.data.day_of_month).toBe(15);
      }
    });

    it("should validate query parameters for filtering expenses", () => {
      // Arrange - typical query from URL params
      const queryParams = {
        entry_type: "expense",
        start_date_from: "2025-01-01",
        start_date_to: "2025-03-31",
        limit: "25",
        offset: "0",
        sort_by: "start_date",
        sort_order: "asc",
      };

      // Act
      const result = getEntriesQuerySchema.safeParse(queryParams);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(typeof result.data.limit).toBe("number");
      }
    });

    it("should validate update scope query for modifying single occurrence", () => {
      // Arrange - updating single occurrence of recurring entry
      const scopeQuery = {
        scope: "occurrence",
        date: "2025-06-15",
      };

      // Act
      const result = updateEntryQuerySchema.safeParse(scopeQuery);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should validate delete scope query for removing future occurrences", () => {
      // Arrange - deleting all future occurrences from a date
      const scopeQuery = {
        scope: "future",
        date: "2025-06-01",
      };

      // Act
      const result = deleteEntryQuerySchema.safeParse(scopeQuery);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should collect multiple validation errors", () => {
      // Arrange - multiple invalid fields
      const input = {
        entry_type: "invalid",
        recurrence_type: "one_time",
        title: "",
        description: "D".repeat(600),
        amount: -100,
        start_date: "invalid-date",
        end_date: null,
        weekday: null,
        day_of_month: null,
      };

      // Act
      const result = createEntrySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
      }
    });
  });
});

