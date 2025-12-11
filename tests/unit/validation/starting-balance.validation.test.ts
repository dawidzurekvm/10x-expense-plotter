import { describe, it, expect } from "vitest";
import { upsertStartingBalanceSchema } from "@/lib/validation/starting-balance.validation";

describe("starting-balance.validation", () => {
  // ============================================================================
  // upsertStartingBalanceSchema
  // ============================================================================
  describe("upsertStartingBalanceSchema", () => {
    describe("valid inputs", () => {
      it("should accept valid input with all required fields", () => {
        // Arrange
        const input = {
          effective_date: "2025-01-01",
          amount: 1000.00,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.effective_date).toBe("2025-01-01");
          expect(result.data.amount).toBe(1000.00);
        }
      });

      it("should accept integer amount", () => {
        // Arrange
        const input = {
          effective_date: "2025-06-15",
          amount: 5000,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(5000);
        }
      });

      it("should accept amount with one decimal place", () => {
        // Arrange
        const input = {
          effective_date: "2025-03-20",
          amount: 1234.5,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(1234.5);
        }
      });

      it("should accept amount with two decimal places", () => {
        // Arrange
        const input = {
          effective_date: "2025-03-20",
          amount: 99.99,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(99.99);
        }
      });

      it("should accept zero amount", () => {
        // Arrange
        const input = {
          effective_date: "2025-01-01",
          amount: 0,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(0);
        }
      });

      it("should accept leap year date - February 29th", () => {
        // Arrange
        const input = {
          effective_date: "2024-02-29",
          amount: 500,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.effective_date).toBe("2024-02-29");
        }
      });

      it("should accept end of month dates", () => {
        // Arrange
        const input = {
          effective_date: "2025-12-31",
          amount: 100,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should accept very large amount", () => {
        // Arrange
        const input = {
          effective_date: "2025-01-01",
          amount: 999999999.99,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(999999999.99);
        }
      });
    });

    // ==========================================================================
    // effective_date validation
    // ==========================================================================
    describe("effective_date validation", () => {
      describe("date format validation", () => {
        it("should reject date with wrong separator - slash", () => {
          // Arrange
          const input = {
            effective_date: "2025/01/01",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toBe(
              "Must be a valid date in YYYY-MM-DD format"
            );
          }
        });

        it("should reject date in day/month/year order", () => {
          // Arrange
          const input = {
            effective_date: "01-01-2025",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject date with missing leading zeros", () => {
          // Arrange
          const input = {
            effective_date: "2025-1-1",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject date without hyphens", () => {
          // Arrange
          const input = {
            effective_date: "20250101",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject ISO datetime format", () => {
          // Arrange
          const input = {
            effective_date: "2025-01-01T00:00:00Z",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject empty string", () => {
          // Arrange
          const input = {
            effective_date: "",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject non-date string", () => {
          // Arrange
          const input = {
            effective_date: "not-a-date",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });
      });

      describe("invalid date values", () => {
        it("should reject February 30th", () => {
          // Arrange
          const input = {
            effective_date: "2025-02-30",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject February 29th in non-leap year", () => {
          // Arrange
          const input = {
            effective_date: "2023-02-29",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject April 31st", () => {
          // Arrange
          const input = {
            effective_date: "2025-04-31",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject month 13", () => {
          // Arrange
          const input = {
            effective_date: "2025-13-01",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject month 00", () => {
          // Arrange
          const input = {
            effective_date: "2025-00-01",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject day 00", () => {
          // Arrange
          const input = {
            effective_date: "2025-01-00",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject day 32", () => {
          // Arrange
          const input = {
            effective_date: "2025-01-32",
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });
      });

      describe("type validation", () => {
        it("should reject number for effective_date", () => {
          // Arrange
          const input = {
            effective_date: 20250101,
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toBe(
              "Effective date must be a string"
            );
          }
        });

        it("should reject null for effective_date", () => {
          // Arrange
          const input = {
            effective_date: null,
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject undefined for effective_date", () => {
          // Arrange
          const input = {
            effective_date: undefined,
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject Date object for effective_date", () => {
          // Arrange
          const input = {
            effective_date: new Date("2025-01-01"),
            amount: 100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });
      });
    });

    // ==========================================================================
    // amount validation
    // ==========================================================================
    describe("amount validation", () => {
      describe("negative values", () => {
        it("should reject negative amount", () => {
          // Arrange
          const input = {
            effective_date: "2025-01-01",
            amount: -100,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toBe(
              "Amount must be non-negative"
            );
          }
        });

        it("should reject small negative amount", () => {
          // Arrange
          const input = {
            effective_date: "2025-01-01",
            amount: -0.01,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });
      });

      describe("decimal places validation", () => {
        it("should reject amount with three decimal places", () => {
          // Arrange
          const input = {
            effective_date: "2025-01-01",
            amount: 100.123,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toBe(
              "Amount must have at most 2 decimal places"
            );
          }
        });

        it("should reject amount with many decimal places", () => {
          // Arrange
          const input = {
            effective_date: "2025-01-01",
            amount: 50.99999,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject very small amount with many decimals", () => {
          // Arrange
          const input = {
            effective_date: "2025-01-01",
            amount: 0.001,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });
      });

      describe("type validation", () => {
        it("should reject string for amount", () => {
          // Arrange
          const input = {
            effective_date: "2025-01-01",
            amount: "100",
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues[0].message).toBe(
              "Amount must be a number"
            );
          }
        });

        it("should reject null for amount", () => {
          // Arrange
          const input = {
            effective_date: "2025-01-01",
            amount: null,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject undefined for amount", () => {
          // Arrange
          const input = {
            effective_date: "2025-01-01",
            amount: undefined,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should reject NaN for amount", () => {
          // Arrange
          const input = {
            effective_date: "2025-01-01",
            amount: NaN,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert
          expect(result.success).toBe(false);
        });

        it("should accept Infinity for amount (edge case - no decimal places)", () => {
          // Arrange
          // Note: Infinity passes validation because:
          // 1. It's a valid JavaScript number (passes type check)
          // 2. It's >= 0 (passes min check)
          // 3. Infinity.toString() = "Infinity" has no decimal point (passes decimal check)
          const input = {
            effective_date: "2025-01-01",
            amount: Infinity,
          };

          // Act
          const result = upsertStartingBalanceSchema.safeParse(input);

          // Assert - This documents current behavior; consider adding explicit check if needed
          expect(result.success).toBe(true);
        });
      });
    });

    // ==========================================================================
    // missing required fields
    // ==========================================================================
    describe("missing required fields", () => {
      it("should reject when effective_date is missing", () => {
        // Arrange
        const input = {
          amount: 100,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          const effectiveDateError = result.error.issues.find(
            (issue) => issue.path[0] === "effective_date"
          );
          expect(effectiveDateError).toBeDefined();
        }
      });

      it("should reject when amount is missing", () => {
        // Arrange
        const input = {
          effective_date: "2025-01-01",
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          const amountError = result.error.issues.find(
            (issue) => issue.path[0] === "amount"
          );
          expect(amountError).toBeDefined();
        }
      });

      it("should reject empty object", () => {
        // Arrange
        const input = {};

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
        }
      });
    });

    // ==========================================================================
    // extra fields handling
    // ==========================================================================
    describe("extra fields handling", () => {
      it("should strip extra fields not in schema", () => {
        // Arrange
        const input = {
          effective_date: "2025-01-01",
          amount: 100,
          extra_field: "should be ignored",
          user_id: "123",
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).not.toHaveProperty("extra_field");
          expect(result.data).not.toHaveProperty("user_id");
          expect(Object.keys(result.data)).toHaveLength(2);
        }
      });
    });

    // ==========================================================================
    // multiple validation errors
    // ==========================================================================
    describe("multiple validation errors", () => {
      it("should collect all validation errors when multiple fields are invalid", () => {
        // Arrange
        const input = {
          effective_date: "invalid-date",
          amount: "not-a-number",
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
        }
      });

      it("should report both missing fields errors", () => {
        // Arrange
        const input = {};

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          const effectiveDateError = result.error.issues.find(
            (issue) => issue.path[0] === "effective_date"
          );
          const amountError = result.error.issues.find(
            (issue) => issue.path[0] === "amount"
          );
          expect(effectiveDateError).toBeDefined();
          expect(amountError).toBeDefined();
        }
      });
    });

    // ==========================================================================
    // edge cases
    // ==========================================================================
    describe("edge cases", () => {
      it("should handle very small positive amount with valid decimals", () => {
        // Arrange
        const input = {
          effective_date: "2025-01-01",
          amount: 0.01,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(0.01);
        }
      });

      it("should handle year 2000 date (Y2K)", () => {
        // Arrange
        const input = {
          effective_date: "2000-01-01",
          amount: 100,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should handle far future date", () => {
        // Arrange
        const input = {
          effective_date: "2099-12-31",
          amount: 100,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should handle century leap year - February 29th 2000", () => {
        // Arrange - 2000 is a leap year (divisible by 400)
        const input = {
          effective_date: "2000-02-29",
          amount: 100,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should reject February 29th 1900 (non-leap century year)", () => {
        // Arrange - 1900 is NOT a leap year (divisible by 100 but not 400)
        const input = {
          effective_date: "1900-02-29",
          amount: 100,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    // ==========================================================================
    // integration scenarios
    // ==========================================================================
    describe("integration scenarios", () => {
      it("should validate typical API request for setting starting balance", () => {
        // Arrange - simulating typical PUT /api/starting-balance body
        const requestBody = {
          effective_date: "2025-01-01",
          amount: 5000.50,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(requestBody);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({
            effective_date: "2025-01-01",
            amount: 5000.50,
          });
        }
      });

      it("should validate starting balance with today's date format", () => {
        // Arrange - simulate getting today's date in correct format
        const today = new Date();
        const formattedDate = today.toISOString().split("T")[0];
        const requestBody = {
          effective_date: formattedDate,
          amount: 1000,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(requestBody);

        // Assert
        expect(result.success).toBe(true);
      });

      it("should validate zero starting balance scenario", () => {
        // Arrange - user wants to start fresh with zero balance
        const requestBody = {
          effective_date: "2025-06-01",
          amount: 0,
        };

        // Act
        const result = upsertStartingBalanceSchema.safeParse(requestBody);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(0);
        }
      });
    });
  });
});

