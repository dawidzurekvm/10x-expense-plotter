import { describe, it, expect } from "vitest";
import {
  entryFormSchema,
  ENTRY_TYPES,
  RECURRENCE_TYPES,
  type EntryFormValues,
} from "@/components/dashboard/entries/schema";

describe("dashboard/entries/schema", () => {
  // ============================================================================
  // Constants
  // ============================================================================
  describe("ENTRY_TYPES constant", () => {
    it("should contain exactly 'income' and 'expense'", () => {
      // Assert
      expect(ENTRY_TYPES).toEqual(["income", "expense"]);
    });

    it("should have length of 2", () => {
      // Assert
      expect(ENTRY_TYPES).toHaveLength(2);
    });

    it("should be readonly tuple", () => {
      // Assert - verify it's the expected type structure
      expect(ENTRY_TYPES[0]).toBe("income");
      expect(ENTRY_TYPES[1]).toBe("expense");
    });
  });

  describe("RECURRENCE_TYPES constant", () => {
    it("should contain exactly 'one_time', 'weekly', and 'monthly'", () => {
      // Assert
      expect(RECURRENCE_TYPES).toEqual(["one_time", "weekly", "monthly"]);
    });

    it("should have length of 3", () => {
      // Assert
      expect(RECURRENCE_TYPES).toHaveLength(3);
    });

    it("should be readonly tuple", () => {
      // Assert - verify it's the expected type structure
      expect(RECURRENCE_TYPES[0]).toBe("one_time");
      expect(RECURRENCE_TYPES[1]).toBe("weekly");
      expect(RECURRENCE_TYPES[2]).toBe("monthly");
    });
  });

  // ============================================================================
  // entryFormSchema
  // ============================================================================
  describe("entryFormSchema", () => {
    // Helper function for creating valid base input
    const createValidInput = (
      overrides: Partial<EntryFormValues> = {}
    ): Record<string, unknown> => ({
      entry_type: "expense",
      title: "Test Entry",
      amount: 100,
      description: "",
      start_date: new Date("2025-01-15"),
      recurrence_type: "one_time",
      end_date: undefined,
      weekday: undefined,
      day_of_month: undefined,
      ...overrides,
    });

    // --------------------------------------------------------------------------
    // Valid inputs
    // --------------------------------------------------------------------------
    describe("valid inputs", () => {
      it("should accept valid one_time expense entry", () => {
        // Arrange
        const input = createValidInput({
          entry_type: "expense",
          recurrence_type: "one_time",
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.entry_type).toBe("expense");
          expect(result.data.recurrence_type).toBe("one_time");
        }
      });

      it("should accept valid one_time income entry", () => {
        // Arrange
        const input = createValidInput({
          entry_type: "income",
          title: "Salary Bonus",
          amount: 2500.5,
          recurrence_type: "one_time",
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.entry_type).toBe("income");
          expect(result.data.amount).toBe(2500.5);
        }
      });

      it("should accept valid weekly entry with weekday", () => {
        // Arrange
        const input = createValidInput({
          recurrence_type: "weekly",
          weekday: 3, // Wednesday
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-12-31"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.recurrence_type).toBe("weekly");
          expect(result.data.weekday).toBe(3);
        }
      });

      it("should accept valid monthly entry with day_of_month", () => {
        // Arrange
        const input = createValidInput({
          recurrence_type: "monthly",
          day_of_month: 15,
          start_date: new Date("2025-01-01"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.recurrence_type).toBe("monthly");
          expect(result.data.day_of_month).toBe(15);
        }
      });

      it("should accept entry with description", () => {
        // Arrange
        const input = createValidInput({
          description: "This is a detailed description of the entry",
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.description).toBe(
            "This is a detailed description of the entry"
          );
        }
      });

      it("should accept entry with empty string description", () => {
        // Arrange
        const input = createValidInput({
          description: "",
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.description).toBe("");
        }
      });

      it("should accept entry without description (undefined)", () => {
        // Arrange
        const input = createValidInput();
        delete input.description;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept entry with end_date after start_date", () => {
        // Arrange
        const input = createValidInput({
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-06-30"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.end_date).toEqual(new Date("2025-06-30"));
        }
      });

      it("should accept entry with end_date equal to start_date", () => {
        // Arrange
        const sameDate = new Date("2025-03-15");
        const input = createValidInput({
          start_date: sameDate,
          end_date: sameDate,
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept entry without end_date", () => {
        // Arrange
        const input = createValidInput({
          end_date: undefined,
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.end_date).toBeUndefined();
        }
      });

      it("should accept weekday value of 0 (Sunday)", () => {
        // Arrange
        const input = createValidInput({
          recurrence_type: "weekly",
          weekday: 0,
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.weekday).toBe(0);
        }
      });

      it("should accept weekday value of 6 (Saturday)", () => {
        // Arrange
        const input = createValidInput({
          recurrence_type: "weekly",
          weekday: 6,
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.weekday).toBe(6);
        }
      });

      it("should accept day_of_month value of 1", () => {
        // Arrange
        const input = createValidInput({
          recurrence_type: "monthly",
          day_of_month: 1,
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.day_of_month).toBe(1);
        }
      });

      it("should accept day_of_month value of 31", () => {
        // Arrange
        const input = createValidInput({
          recurrence_type: "monthly",
          day_of_month: 31,
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.day_of_month).toBe(31);
        }
      });
    });

    // --------------------------------------------------------------------------
    // entry_type validation
    // --------------------------------------------------------------------------
    describe("entry_type validation", () => {
      it("should accept 'income' entry_type", () => {
        // Arrange
        const input = createValidInput({ entry_type: "income" });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.entry_type).toBe("income");
        }
      });

      it("should accept 'expense' entry_type", () => {
        // Arrange
        const input = createValidInput({ entry_type: "expense" });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.entry_type).toBe("expense");
        }
      });

      it("should reject invalid entry_type", () => {
        // Arrange
        const input = createValidInput();
        input.entry_type = "invalid_type";

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("entry_type");
        }
      });

      it("should reject missing entry_type", () => {
        // Arrange
        const input = createValidInput();
        delete input.entry_type;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("entry_type");
        }
      });

      it("should reject null entry_type", () => {
        // Arrange
        const input = createValidInput();
        input.entry_type = null;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject number for entry_type", () => {
        // Arrange
        const input = createValidInput();
        input.entry_type = 1;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // title validation
    // --------------------------------------------------------------------------
    describe("title validation", () => {
      it("should accept valid title", () => {
        // Arrange
        const input = createValidInput({ title: "Monthly Rent" });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe("Monthly Rent");
        }
      });

      it("should accept minimum length title (1 character)", () => {
        // Arrange
        const input = createValidInput({ title: "A" });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe("A");
        }
      });

      it("should accept maximum length title (120 characters)", () => {
        // Arrange
        const maxTitle = "A".repeat(120);
        const input = createValidInput({ title: maxTitle });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe(maxTitle);
          expect(result.data.title.length).toBe(120);
        }
      });

      it("should reject empty title", () => {
        // Arrange
        const input = createValidInput({ title: "" });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("title");
          expect(result.error.issues[0].message).toBe("Title is required");
        }
      });

      it("should reject title exceeding maximum length", () => {
        // Arrange
        const tooLongTitle = "A".repeat(121);
        const input = createValidInput({ title: tooLongTitle });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("title");
          expect(result.error.issues[0].message).toBe(
            "Title must be 120 characters or less"
          );
        }
      });

      it("should reject missing title", () => {
        // Arrange
        const input = createValidInput();
        delete input.title;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("title");
        }
      });

      it("should reject null title", () => {
        // Arrange
        const input = createValidInput();
        input.title = null;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject number for title", () => {
        // Arrange
        const input = createValidInput();
        input.title = 12345;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should accept title with special characters", () => {
        // Arrange
        const input = createValidInput({
          title: "Rent - Apartment #42 (Monthly)",
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe("Rent - Apartment #42 (Monthly)");
        }
      });

      it("should accept title with unicode characters", () => {
        // Arrange
        const input = createValidInput({ title: "Czynsz za mieszkanie 🏠" });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe("Czynsz za mieszkanie 🏠");
        }
      });
    });

    // --------------------------------------------------------------------------
    // amount validation
    // --------------------------------------------------------------------------
    describe("amount validation", () => {
      it("should accept valid positive amount", () => {
        // Arrange
        const input = createValidInput({ amount: 150.75 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(150.75);
        }
      });

      it("should accept integer amount", () => {
        // Arrange
        const input = createValidInput({ amount: 500 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(500);
        }
      });

      it("should accept very small positive amount", () => {
        // Arrange
        const input = createValidInput({ amount: 0.01 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(0.01);
        }
      });

      it("should accept large amount", () => {
        // Arrange
        const input = createValidInput({ amount: 999999999.99 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(999999999.99);
        }
      });

      it("should coerce string to number", () => {
        // Arrange
        const input = createValidInput();
        input.amount = "250.50";

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(250.5);
          expect(typeof result.data.amount).toBe("number");
        }
      });

      it("should reject zero amount", () => {
        // Arrange
        const input = createValidInput({ amount: 0 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount must be positive");
        }
      });

      it("should reject negative amount", () => {
        // Arrange
        const input = createValidInput({ amount: -100 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount must be positive");
        }
      });

      it("should reject non-numeric string for amount", () => {
        // Arrange
        const input = createValidInput();
        input.amount = "not-a-number";

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount must be a number");
        }
      });

      it("should reject null amount", () => {
        // Arrange
        const input = createValidInput();
        input.amount = null;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
        }
      });

      it("should reject missing amount", () => {
        // Arrange
        const input = createValidInput();
        delete input.amount;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject NaN for amount", () => {
        // Arrange
        const input = createValidInput({ amount: NaN });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should accept Infinity for amount (coerced number allows it)", () => {
        // Arrange
        const input = createValidInput({ amount: Infinity });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        // Note: z.coerce.number().positive() accepts Infinity as a valid positive number
        expect(result.success).toBe(true);
      });

      it("should reject object for amount", () => {
        // Arrange
        const input = createValidInput();
        input.amount = { value: 100 };

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe("Amount must be a number");
        }
      });
    });

    // --------------------------------------------------------------------------
    // description validation
    // --------------------------------------------------------------------------
    describe("description validation", () => {
      it("should accept valid description", () => {
        // Arrange
        const input = createValidInput({
          description: "Monthly payment for apartment rent",
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.description).toBe(
            "Monthly payment for apartment rent"
          );
        }
      });

      it("should accept empty string description", () => {
        // Arrange
        const input = createValidInput({ description: "" });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.description).toBe("");
        }
      });

      it("should accept undefined description", () => {
        // Arrange
        const input = createValidInput({ description: undefined });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept maximum length description (500 characters)", () => {
        // Arrange
        const maxDescription = "A".repeat(500);
        const input = createValidInput({ description: maxDescription });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.description).toBe(maxDescription);
          expect(result.data.description?.length).toBe(500);
        }
      });

      it("should reject description exceeding maximum length", () => {
        // Arrange
        const tooLongDescription = "A".repeat(501);
        const input = createValidInput({ description: tooLongDescription });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("description");
          expect(result.error.issues[0].message).toBe(
            "Description must be 500 characters or less"
          );
        }
      });

      it("should accept description with special characters", () => {
        // Arrange
        const input = createValidInput({
          description: "Payment for: Apartment #42, Floor 5 (2025)",
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept description with line breaks", () => {
        // Arrange
        const input = createValidInput({
          description: "Line 1\nLine 2\nLine 3",
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.description).toBe("Line 1\nLine 2\nLine 3");
        }
      });
    });

    // --------------------------------------------------------------------------
    // start_date validation
    // --------------------------------------------------------------------------
    describe("start_date validation", () => {
      it("should accept valid Date object", () => {
        // Arrange
        const input = createValidInput({
          start_date: new Date("2025-06-15"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.start_date).toEqual(new Date("2025-06-15"));
        }
      });

      it("should accept past date", () => {
        // Arrange
        const input = createValidInput({
          start_date: new Date("2020-01-01"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept future date", () => {
        // Arrange
        const input = createValidInput({
          start_date: new Date("2030-12-31"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should reject missing start_date", () => {
        // Arrange
        const input = createValidInput();
        delete input.start_date;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("start_date");
          expect(result.error.issues[0].message).toBe("Start date is required");
        }
      });

      it("should reject undefined start_date", () => {
        // Arrange
        const input = createValidInput({ start_date: undefined });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("start_date");
          expect(result.error.issues[0].message).toBe("Start date is required");
        }
      });

      it("should reject null start_date", () => {
        // Arrange
        const input = createValidInput();
        input.start_date = null;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("start_date");
          expect(result.error.issues[0].message).toBe("Invalid date");
        }
      });

      it("should reject string for start_date", () => {
        // Arrange
        const input = createValidInput();
        input.start_date = "2025-01-15";

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("start_date");
          expect(result.error.issues[0].message).toBe("Invalid date");
        }
      });

      it("should reject number timestamp for start_date", () => {
        // Arrange
        const input = createValidInput();
        input.start_date = Date.now();

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("start_date");
          expect(result.error.issues[0].message).toBe("Invalid date");
        }
      });

      it("should reject Invalid Date object", () => {
        // Arrange
        const input = createValidInput({
          start_date: new Date("invalid-date-string"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // recurrence_type validation
    // --------------------------------------------------------------------------
    describe("recurrence_type validation", () => {
      it("should accept 'one_time' recurrence_type", () => {
        // Arrange
        const input = createValidInput({ recurrence_type: "one_time" });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.recurrence_type).toBe("one_time");
        }
      });

      it("should accept 'weekly' recurrence_type", () => {
        // Arrange
        const input = createValidInput({ recurrence_type: "weekly" });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.recurrence_type).toBe("weekly");
        }
      });

      it("should accept 'monthly' recurrence_type", () => {
        // Arrange
        const input = createValidInput({ recurrence_type: "monthly" });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.recurrence_type).toBe("monthly");
        }
      });

      it("should reject invalid recurrence_type", () => {
        // Arrange
        const input = createValidInput();
        input.recurrence_type = "daily";

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("recurrence_type");
        }
      });

      it("should reject missing recurrence_type", () => {
        // Arrange
        const input = createValidInput();
        delete input.recurrence_type;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("recurrence_type");
        }
      });

      it("should reject null recurrence_type", () => {
        // Arrange
        const input = createValidInput();
        input.recurrence_type = null;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject number for recurrence_type", () => {
        // Arrange
        const input = createValidInput();
        input.recurrence_type = 1;

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // end_date validation
    // --------------------------------------------------------------------------
    describe("end_date validation", () => {
      it("should accept valid end_date", () => {
        // Arrange
        const input = createValidInput({
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-12-31"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.end_date).toEqual(new Date("2025-12-31"));
        }
      });

      it("should accept undefined end_date", () => {
        // Arrange
        const input = createValidInput({ end_date: undefined });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.end_date).toBeUndefined();
        }
      });

      it("should reject string for end_date", () => {
        // Arrange
        const input = createValidInput();
        input.end_date = "2025-12-31";

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject Invalid Date for end_date", () => {
        // Arrange
        const input = createValidInput({
          end_date: new Date("invalid"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // weekday validation
    // --------------------------------------------------------------------------
    describe("weekday validation", () => {
      it("should accept weekday 0 (Sunday)", () => {
        // Arrange
        const input = createValidInput({ weekday: 0 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.weekday).toBe(0);
        }
      });

      it("should accept weekday 6 (Saturday)", () => {
        // Arrange
        const input = createValidInput({ weekday: 6 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.weekday).toBe(6);
        }
      });

      it("should accept weekday 3 (Wednesday)", () => {
        // Arrange
        const input = createValidInput({ weekday: 3 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.weekday).toBe(3);
        }
      });

      it("should accept undefined weekday", () => {
        // Arrange
        const input = createValidInput({ weekday: undefined });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should reject weekday less than 0", () => {
        // Arrange
        const input = createValidInput({ weekday: -1 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("weekday");
        }
      });

      it("should reject weekday greater than 6", () => {
        // Arrange
        const input = createValidInput({ weekday: 7 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("weekday");
        }
      });

      it("should accept non-integer weekday (schema does not enforce integer)", () => {
        // Arrange
        const input = createValidInput({ weekday: 3.5 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        // Note: z.number().min(0).max(6) does not enforce integers, only range
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.weekday).toBe(3.5);
        }
      });

      it("should reject string for weekday", () => {
        // Arrange
        const input = createValidInput();
        input.weekday = "Monday";

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // day_of_month validation
    // --------------------------------------------------------------------------
    describe("day_of_month validation", () => {
      it("should accept day_of_month 1", () => {
        // Arrange
        const input = createValidInput({ day_of_month: 1 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.day_of_month).toBe(1);
        }
      });

      it("should accept day_of_month 31", () => {
        // Arrange
        const input = createValidInput({ day_of_month: 31 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.day_of_month).toBe(31);
        }
      });

      it("should accept day_of_month 15", () => {
        // Arrange
        const input = createValidInput({ day_of_month: 15 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.day_of_month).toBe(15);
        }
      });

      it("should accept undefined day_of_month", () => {
        // Arrange
        const input = createValidInput({ day_of_month: undefined });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should reject day_of_month less than 1", () => {
        // Arrange
        const input = createValidInput({ day_of_month: 0 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("day_of_month");
        }
      });

      it("should reject day_of_month greater than 31", () => {
        // Arrange
        const input = createValidInput({ day_of_month: 32 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("day_of_month");
        }
      });

      it("should reject negative day_of_month", () => {
        // Arrange
        const input = createValidInput({ day_of_month: -5 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should accept non-integer day_of_month (schema does not enforce integer)", () => {
        // Arrange
        const input = createValidInput({ day_of_month: 15.5 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        // Note: z.number().min(1).max(31) does not enforce integers, only range
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.day_of_month).toBe(15.5);
        }
      });

      it("should reject string for day_of_month", () => {
        // Arrange
        const input = createValidInput();
        input.day_of_month = "15th";

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    // --------------------------------------------------------------------------
    // Refinement: end_date >= start_date
    // --------------------------------------------------------------------------
    describe("refinement: end_date must be after or equal to start_date", () => {
      it("should accept when end_date is after start_date", () => {
        // Arrange
        const input = createValidInput({
          start_date: new Date("2025-01-01"),
          end_date: new Date("2025-12-31"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept when end_date equals start_date", () => {
        // Arrange
        const sameDate = new Date("2025-06-15");
        const input = createValidInput({
          start_date: sameDate,
          end_date: sameDate,
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept when end_date is undefined", () => {
        // Arrange
        const input = createValidInput({
          start_date: new Date("2025-01-01"),
          end_date: undefined,
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should reject when end_date is before start_date", () => {
        // Arrange
        const input = createValidInput({
          start_date: new Date("2025-06-15"),
          end_date: new Date("2025-01-01"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("end_date");
          expect(result.error.issues[0].message).toBe(
            "End date must be after or equal to start date"
          );
        }
      });

      it("should reject when end_date is one day before start_date", () => {
        // Arrange
        const input = createValidInput({
          start_date: new Date("2025-06-15"),
          end_date: new Date("2025-06-14"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            "End date must be after or equal to start date"
          );
        }
      });

      it("should accept when end_date is one day after start_date", () => {
        // Arrange
        const input = createValidInput({
          start_date: new Date("2025-06-14"),
          end_date: new Date("2025-06-15"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    // --------------------------------------------------------------------------
    // Edge cases
    // --------------------------------------------------------------------------
    describe("edge cases", () => {
      it("should reject empty object", () => {
        // Arrange
        const input = {};

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          const paths = result.error.issues.map((issue) => issue.path[0]);
          expect(paths).toContain("entry_type");
          expect(paths).toContain("title");
          expect(paths).toContain("start_date");
          expect(paths).toContain("recurrence_type");
        }
      });

      it("should strip extra fields not in schema", () => {
        // Arrange
        const input = {
          ...createValidInput(),
          extraField: "should be ignored",
          anotherExtra: 123,
        };

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).not.toHaveProperty("extraField");
          expect(result.data).not.toHaveProperty("anotherExtra");
        }
      });

      it("should handle Date at epoch (1970-01-01)", () => {
        // Arrange
        const input = createValidInput({
          start_date: new Date(0),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should handle far future date", () => {
        // Arrange
        const input = createValidInput({
          start_date: new Date("2099-12-31"),
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should handle amount with many decimal places", () => {
        // Arrange
        const input = createValidInput({ amount: 123.456789012345 });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(123.456789012345);
        }
      });

      it("should validate complete weekly recurring entry", () => {
        // Arrange
        const input = createValidInput({
          entry_type: "expense",
          title: "Weekly Groceries",
          amount: 200,
          description: "Weekly shopping at the supermarket",
          start_date: new Date("2025-01-06"), // Monday
          recurrence_type: "weekly",
          end_date: new Date("2025-12-29"),
          weekday: 1, // Monday
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.recurrence_type).toBe("weekly");
          expect(result.data.weekday).toBe(1);
          expect(result.data.day_of_month).toBeUndefined();
        }
      });

      it("should validate complete monthly recurring entry", () => {
        // Arrange
        const input = createValidInput({
          entry_type: "income",
          title: "Monthly Salary",
          amount: 5000,
          description: "Monthly salary payment",
          start_date: new Date("2025-01-25"),
          recurrence_type: "monthly",
          end_date: undefined,
          day_of_month: 25,
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.recurrence_type).toBe("monthly");
          expect(result.data.day_of_month).toBe(25);
          expect(result.data.weekday).toBeUndefined();
        }
      });
    });

    // --------------------------------------------------------------------------
    // Type inference
    // --------------------------------------------------------------------------
    describe("type inference", () => {
      it("should correctly type the parsed result", () => {
        // Arrange
        const input = createValidInput();

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          const data: EntryFormValues = result.data;
          expect(typeof data.entry_type).toBe("string");
          expect(typeof data.title).toBe("string");
          expect(typeof data.amount).toBe("number");
          expect(data.start_date instanceof Date).toBe(true);
          expect(typeof data.recurrence_type).toBe("string");
        }
      });

      it("should include all expected fields in parsed result", () => {
        // Arrange
        const input = createValidInput({
          description: "Test description",
          end_date: new Date("2025-12-31"),
          weekday: 3,
          day_of_month: 15,
        });

        // Act
        const result = entryFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          const expectedKeys = [
            "entry_type",
            "title",
            "amount",
            "description",
            "start_date",
            "recurrence_type",
            "end_date",
            "weekday",
            "day_of_month",
          ];
          expectedKeys.forEach((key) => {
            expect(result.data).toHaveProperty(key);
          });
        }
      });
    });
  });
});

