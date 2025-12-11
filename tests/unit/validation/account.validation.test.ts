import { describe, it, expect } from "vitest";
import { deleteAccountSchema } from "@/lib/validation/account.validation";

describe("account.validation", () => {
  // ============================================================================
  // deleteAccountSchema
  // ============================================================================
  describe("deleteAccountSchema", () => {
    describe("valid inputs", () => {
      it("should accept exact confirmation string 'DELETE MY ACCOUNT'", () => {
        // Arrange
        const input = {
          confirmation: "DELETE MY ACCOUNT",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.confirmation).toBe("DELETE MY ACCOUNT");
        }
      });

      it("should accept valid input with extra fields (Zod strips by default)", () => {
        // Arrange
        const input = {
          confirmation: "DELETE MY ACCOUNT",
          extraField: "should be ignored",
          anotherField: 123,
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.confirmation).toBe("DELETE MY ACCOUNT");
          expect(result.data).not.toHaveProperty("extraField");
          expect(result.data).not.toHaveProperty("anotherField");
        }
      });
    });

    describe("invalid inputs - wrong confirmation text", () => {
      it("should reject lowercase confirmation string", () => {
        // Arrange
        const input = {
          confirmation: "delete my account",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject mixed case confirmation string", () => {
        // Arrange
        const input = {
          confirmation: "Delete My Account",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject confirmation with leading whitespace", () => {
        // Arrange
        const input = {
          confirmation: " DELETE MY ACCOUNT",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject confirmation with trailing whitespace", () => {
        // Arrange
        const input = {
          confirmation: "DELETE MY ACCOUNT ",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject confirmation with extra whitespace within", () => {
        // Arrange
        const input = {
          confirmation: "DELETE  MY  ACCOUNT",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject partial confirmation - missing word", () => {
        // Arrange
        const input = {
          confirmation: "DELETE ACCOUNT",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject partial confirmation - only first word", () => {
        // Arrange
        const input = {
          confirmation: "DELETE",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject completely different text", () => {
        // Arrange
        const input = {
          confirmation: "yes please delete",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject confirmation with extra text appended", () => {
        // Arrange
        const input = {
          confirmation: "DELETE MY ACCOUNT NOW",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject confirmation with extra text prepended", () => {
        // Arrange
        const input = {
          confirmation: "PLEASE DELETE MY ACCOUNT",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });
    });

    describe("invalid inputs - empty or missing values", () => {
      it("should reject empty string", () => {
        // Arrange
        const input = {
          confirmation: "",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject missing confirmation field", () => {
        // Arrange
        const input = {};

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject null confirmation", () => {
        // Arrange
        const input = {
          confirmation: null,
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject undefined confirmation", () => {
        // Arrange
        const input = {
          confirmation: undefined,
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject empty object", () => {
        // Arrange
        const input = {};

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("invalid inputs - wrong types", () => {
      it("should reject number instead of string", () => {
        // Arrange
        const input = {
          confirmation: 12345,
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject boolean instead of string", () => {
        // Arrange
        const input = {
          confirmation: true,
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject array instead of string", () => {
        // Arrange
        const input = {
          confirmation: ["DELETE MY ACCOUNT"],
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject object instead of string", () => {
        // Arrange
        const input = {
          confirmation: { text: "DELETE MY ACCOUNT" },
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject null input", () => {
        // Arrange
        const input = null;

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject undefined input", () => {
        // Arrange
        const input = undefined;

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });

      it("should reject string input instead of object", () => {
        // Arrange
        const input = "DELETE MY ACCOUNT";

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should reject confirmation with newline character", () => {
        // Arrange
        const input = {
          confirmation: "DELETE MY ACCOUNT\n",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject confirmation with tab character", () => {
        // Arrange
        const input = {
          confirmation: "DELETE\tMY\tACCOUNT",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject confirmation with unicode lookalike characters", () => {
        // Arrange - using full-width characters
        const input = {
          confirmation: "DELETE　MY　ACCOUNT", // Full-width spaces
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject confirmation with only whitespace", () => {
        // Arrange
        const input = {
          confirmation: "   ",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject typo in confirmation - DELET instead of DELETE", () => {
        // Arrange
        const input = {
          confirmation: "DELET MY ACCOUNT",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });

      it("should reject typo in confirmation - ACOUNT instead of ACCOUNT", () => {
        // Arrange
        const input = {
          confirmation: "DELETE MY ACOUNT",
        };

        // Act
        const result = deleteAccountSchema.safeParse(input);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe(
            'Confirmation must be exactly "DELETE MY ACCOUNT"'
          );
        }
      });
    });
  });
});

