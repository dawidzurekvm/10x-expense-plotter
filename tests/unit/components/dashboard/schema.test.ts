import { describe, it, expect } from "vitest";
import {
  startingBalanceFormSchema,
  type StartingBalanceFormValues,
} from "@/components/dashboard/schema";

describe("dashboard/schema", () => {
  // ============================================================================
  // startingBalanceFormSchema
  // ============================================================================
  describe("startingBalanceFormSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid amount and effective_date", () => {
        // Arrange
        const input = {
          amount: 1000.5,
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(1000.5);
          expect(result.data.effective_date).toEqual(new Date("2025-01-15"));
        }
      });

      it("should accept minimum valid amount (just above zero)", () => {
        // Arrange
        const input = {
          amount: 0.01,
          effective_date: new Date("2025-01-01"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(0.01);
        }
      });

      it("should accept very small positive amount", () => {
        // Arrange
        const input = {
          amount: 0.001,
          effective_date: new Date("2025-06-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept maximum valid amount", () => {
        // Arrange
        const input = {
          amount: 9999999999.99,
          effective_date: new Date("2025-12-31"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(9999999999.99);
        }
      });

      it("should accept integer amount", () => {
        // Arrange
        const input = {
          amount: 500,
          effective_date: new Date("2025-03-20"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept past date", () => {
        // Arrange
        const input = {
          amount: 100,
          effective_date: new Date("2020-01-01"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept future date", () => {
        // Arrange
        const input = {
          amount: 100,
          effective_date: new Date("2030-12-31"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept date created with timestamp", () => {
        // Arrange
        const timestamp = Date.now();
        const input = {
          amount: 250.75,
          effective_date: new Date(timestamp),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    describe("invalid amount inputs", () => {
      it("should reject missing amount field", () => {
        // Arrange
        const input = {
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount is required");
        }
      });

      it("should reject undefined amount", () => {
        // Arrange
        const input = {
          amount: undefined,
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount is required");
        }
      });

      it("should reject null amount", () => {
        // Arrange
        const input = {
          amount: null,
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount must be a number");
        }
      });

      it("should reject zero amount", () => {
        // Arrange
        const input = {
          amount: 0,
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount must be positive");
        }
      });

      it("should reject negative amount", () => {
        // Arrange
        const input = {
          amount: -100,
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount must be positive");
        }
      });

      it("should reject amount exceeding maximum", () => {
        // Arrange
        const input = {
          amount: 10000000000,
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount is too large");
        }
      });

      it("should reject amount just over maximum", () => {
        // Arrange
        const input = {
          amount: 9999999999.991,
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount is too large");
        }
      });

      it("should reject string instead of number for amount", () => {
        // Arrange
        const input = {
          amount: "1000",
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount must be a number");
        }
      });

      it("should reject NaN for amount", () => {
        // Arrange
        const input = {
          amount: NaN,
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
        }
      });

      it("should reject Infinity for amount", () => {
        // Arrange
        const input = {
          amount: Infinity,
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
        }
      });

      it("should reject negative Infinity for amount", () => {
        // Arrange
        const input = {
          amount: -Infinity,
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
        }
      });

      it("should reject object for amount", () => {
        // Arrange
        const input = {
          amount: { value: 100 },
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount must be a number");
        }
      });

      it("should reject array for amount", () => {
        // Arrange
        const input = {
          amount: [100],
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount must be a number");
        }
      });

      it("should reject boolean for amount", () => {
        // Arrange
        const input = {
          amount: true,
          effective_date: new Date("2025-01-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("amount");
          expect(result.error.issues[0].message).toBe("Amount must be a number");
        }
      });
    });

    describe("invalid effective_date inputs", () => {
      it("should reject missing effective_date field", () => {
        // Arrange
        const input = {
          amount: 1000,
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("effective_date");
          expect(result.error.issues[0].message).toBe("Date is required");
        }
      });

      it("should reject undefined effective_date", () => {
        // Arrange
        const input = {
          amount: 1000,
          effective_date: undefined,
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("effective_date");
          expect(result.error.issues[0].message).toBe("Date is required");
        }
      });

      it("should reject null effective_date", () => {
        // Arrange
        const input = {
          amount: 1000,
          effective_date: null,
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("effective_date");
          expect(result.error.issues[0].message).toBe("Date is invalid");
        }
      });

      it("should reject string instead of Date for effective_date", () => {
        // Arrange
        const input = {
          amount: 1000,
          effective_date: "2025-01-15",
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("effective_date");
          expect(result.error.issues[0].message).toBe("Date is invalid");
        }
      });

      it("should reject number timestamp for effective_date", () => {
        // Arrange
        const input = {
          amount: 1000,
          effective_date: Date.now(),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("effective_date");
          expect(result.error.issues[0].message).toBe("Date is invalid");
        }
      });

      it("should reject object for effective_date", () => {
        // Arrange
        const input = {
          amount: 1000,
          effective_date: { year: 2025, month: 1, day: 15 },
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("effective_date");
          expect(result.error.issues[0].message).toBe("Date is invalid");
        }
      });

      it("should reject array for effective_date", () => {
        // Arrange
        const input = {
          amount: 1000,
          effective_date: [2025, 1, 15],
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("effective_date");
          expect(result.error.issues[0].message).toBe("Date is invalid");
        }
      });

      it("should reject boolean for effective_date", () => {
        // Arrange
        const input = {
          amount: 1000,
          effective_date: true,
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("effective_date");
          expect(result.error.issues[0].message).toBe("Date is invalid");
        }
      });

      it("should reject Invalid Date object", () => {
        // Arrange
        const input = {
          amount: 1000,
          effective_date: new Date("invalid-date-string"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].path).toContain("effective_date");
        }
      });
    });

    describe("edge cases", () => {
      it("should reject empty object", () => {
        // Arrange
        const input = {};

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBe(2);
          const paths = result.error.issues.map((issue) => issue.path[0]);
          expect(paths).toContain("amount");
          expect(paths).toContain("effective_date");
        }
      });

      it("should reject with both invalid values", () => {
        // Arrange
        const input = {
          amount: "invalid",
          effective_date: "invalid",
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBe(2);
        }
      });

      it("should strip extra fields", () => {
        // Arrange
        const input = {
          amount: 500,
          effective_date: new Date("2025-05-01"),
          extraField: "should be ignored",
          anotherExtra: 123,
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).not.toHaveProperty("extraField");
          expect(result.data).not.toHaveProperty("anotherExtra");
          expect(Object.keys(result.data)).toEqual(["amount", "effective_date"]);
        }
      });

      it("should handle Date at epoch (1970-01-01)", () => {
        // Arrange
        const input = {
          amount: 100,
          effective_date: new Date(0),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should handle very small positive decimal amount", () => {
        // Arrange
        const input = {
          amount: 0.000001,
          effective_date: new Date("2025-01-01"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should handle amount with many decimal places", () => {
        // Arrange
        const input = {
          amount: 123.456789012345,
          effective_date: new Date("2025-01-01"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(123.456789012345);
        }
      });
    });

    describe("type inference", () => {
      it("should correctly type the parsed result", () => {
        // Arrange
        const input = {
          amount: 1500,
          effective_date: new Date("2025-06-15"),
        };

        // Act
        const result = startingBalanceFormSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          const data: StartingBalanceFormValues = result.data;
          expect(typeof data.amount).toBe("number");
          expect(data.effective_date instanceof Date).toBe(true);
        }
      });
    });
  });
});

