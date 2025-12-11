import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateCSVExport,
  escapeCsvField,
  formatCsvRow,
  generateCSVContent,
  generateCSVFilename,
  type CSVOccurrence,
} from "@/lib/services/export.service";

// Factory for creating mock CSVOccurrence
function createMockOccurrence(overrides: Partial<CSVOccurrence> = {}): CSVOccurrence {
  return {
    occurrence_id: "occ-123",
    series_id: "series-456",
    entry_type: "expense",
    title: "Test Expense",
    description: "Test description",
    occurrence_date: "2025-01-15",
    amount: 100.5,
    created_at: "2025-01-01T10:00:00Z",
    updated_at: "2025-01-01T12:00:00Z",
    ...overrides,
  };
}

// Factory for creating mock Supabase client
function createMockSupabaseClient(rpcResult: { data: unknown; error: unknown }) {
  return {
    rpc: vi.fn().mockResolvedValue(rpcResult),
  } as unknown as SupabaseClient;
}

describe("export.service", () => {
  describe("escapeCsvField", () => {
    describe("formula injection prevention", () => {
      it("should prefix with single quote when field starts with =", () => {
        const result = escapeCsvField("=SUM(A1:A10)");
        expect(result).toBe("'=SUM(A1:A10)");
      });

      it("should prefix with single quote when field starts with +", () => {
        const result = escapeCsvField("+48123456789");
        expect(result).toBe("'+48123456789");
      });

      it("should prefix with single quote when field starts with -", () => {
        const result = escapeCsvField("-100");
        expect(result).toBe("'-100");
      });

      it("should prefix with single quote when field starts with @", () => {
        const result = escapeCsvField("@mention");
        expect(result).toBe("'@mention");
      });

      it("should prefix with single quote when field starts with tab", () => {
        const result = escapeCsvField("\tindented");
        expect(result).toBe("'\tindented");
      });

      it("should prefix with single quote when field starts with carriage return", () => {
        const result = escapeCsvField("\rtext");
        expect(result).toBe("'\rtext");
      });
    });

    describe("special character escaping", () => {
      it("should wrap in quotes and escape double quotes", () => {
        const result = escapeCsvField('He said "hello"');
        expect(result).toBe('"He said ""hello"""');
      });

      it("should wrap in quotes when field contains comma", () => {
        const result = escapeCsvField("one, two, three");
        expect(result).toBe('"one, two, three"');
      });

      it("should wrap in quotes when field contains newline", () => {
        const result = escapeCsvField("line1\nline2");
        expect(result).toBe('"line1\nline2"');
      });

      it("should handle multiple special characters together", () => {
        const result = escapeCsvField('He said "yes, no"\nmaybe');
        expect(result).toBe('"He said ""yes, no""\nmaybe"');
      });
    });

    describe("combined scenarios", () => {
      it("should handle formula injection with special characters", () => {
        // Input: =HYPERLINK("http://evil.com")
        // Step 1: Prefix with ' -> '=HYPERLINK("http://evil.com")
        // Step 2: Contains ", wrap and escape -> "'=HYPERLINK(""http://evil.com"")"
        const result = escapeCsvField('=HYPERLINK("http://evil.com")');
        expect(result).toBe("\"'=HYPERLINK(\"\"http://evil.com\"\")\"");
      });

      it("should return plain text unchanged", () => {
        const result = escapeCsvField("Normal text here");
        expect(result).toBe("Normal text here");
      });

      it("should handle empty string", () => {
        const result = escapeCsvField("");
        expect(result).toBe("");
      });
    });
  });

  describe("formatCsvRow", () => {
    it("should format expense with negative amount", () => {
      const occurrence = createMockOccurrence({
        entry_type: "expense",
        amount: 50.99,
      });

      const result = formatCsvRow(occurrence);

      expect(result).toContain("-50.99");
    });

    it("should format income with positive amount", () => {
      const occurrence = createMockOccurrence({
        entry_type: "income",
        amount: 1500,
      });

      const result = formatCsvRow(occurrence);

      expect(result).toContain("1500.00");
      expect(result).not.toContain("-1500.00");
    });

    it("should escape title with special characters", () => {
      const occurrence = createMockOccurrence({
        title: 'Expense, with "quotes"',
      });

      const result = formatCsvRow(occurrence);

      expect(result).toContain('"Expense, with ""quotes"""');
    });

    it("should handle null description", () => {
      const occurrence = createMockOccurrence({
        description: null,
      });

      const result = formatCsvRow(occurrence);
      const fields = result.split(",");

      // Description should be empty (5th field, index 4)
      expect(fields[4]).toBe("");
    });

    it("should include all fields in correct order", () => {
      const occurrence = createMockOccurrence({
        occurrence_id: "occ-001",
        series_id: "ser-002",
        entry_type: "income",
        title: "Salary",
        description: "Monthly",
        occurrence_date: "2025-02-01",
        amount: 5000,
        created_at: "2025-01-15T08:00:00Z",
        updated_at: "2025-01-15T09:00:00Z",
      });

      const result = formatCsvRow(occurrence);

      expect(result).toMatchInlineSnapshot(
        `"occ-001,ser-002,income,Salary,Monthly,2025-02-01,5000.00,2025-01-15T08:00:00Z,2025-01-15T09:00:00Z"`
      );
    });

    it("should format amount with exactly two decimal places", () => {
      const occurrence = createMockOccurrence({
        entry_type: "income",
        amount: 100,
      });

      const result = formatCsvRow(occurrence);

      expect(result).toContain("100.00");
    });
  });

  describe("generateCSVContent", () => {
    it("should generate CSV with header row", () => {
      const occurrences: CSVOccurrence[] = [];

      const result = generateCSVContent(occurrences);

      expect(result).toBe(
        "occurrence_id,series_id,type,title,description,date,amount_pln,created_at,updated_at"
      );
    });

    it("should generate CSV with header and data rows", () => {
      const occurrences = [
        createMockOccurrence({ occurrence_id: "1", title: "First" }),
        createMockOccurrence({ occurrence_id: "2", title: "Second" }),
      ];

      const result = generateCSVContent(occurrences);
      const lines = result.split("\n");

      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain("occurrence_id,series_id");
      expect(lines[1]).toContain("1,series-456");
      expect(lines[2]).toContain("2,series-456");
    });

    it("should preserve row order", () => {
      const occurrences = [
        createMockOccurrence({ title: "A" }),
        createMockOccurrence({ title: "B" }),
        createMockOccurrence({ title: "C" }),
      ];

      const result = generateCSVContent(occurrences);
      const lines = result.split("\n");

      expect(lines[1]).toContain("A");
      expect(lines[2]).toContain("B");
      expect(lines[3]).toContain("C");
    });
  });

  describe("generateCSVFilename", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should generate filename with current date", () => {
      vi.setSystemTime(new Date("2025-12-11T14:30:00Z"));

      const result = generateCSVFilename();

      expect(result).toBe("10x-expense-plotter-export-2025-12-11.csv");
    });

    it("should pad month and day with leading zeros", () => {
      vi.setSystemTime(new Date("2025-01-05T10:00:00Z"));

      const result = generateCSVFilename();

      expect(result).toBe("10x-expense-plotter-export-2025-01-05.csv");
    });

    it("should always have .csv extension", () => {
      vi.setSystemTime(new Date("2025-06-15"));

      const result = generateCSVFilename();

      expect(result).toMatch(/\.csv$/);
    });
  });

  describe("generateCSVExport", () => {
    const mockUserId = "user-123";
    const mockFromDate = "2025-01-01";
    const mockToDate = "2025-01-31";

    it("should call RPC with correct parameters", async () => {
      const mockOccurrences = [createMockOccurrence()];
      const supabase = createMockSupabaseClient({
        data: mockOccurrences,
        error: null,
      });

      await generateCSVExport(supabase, mockUserId, mockFromDate, mockToDate);

      expect(supabase.rpc).toHaveBeenCalledWith("expand_occurrences", {
        p_user_id: mockUserId,
        p_from_date: mockFromDate,
        p_to_date: mockToDate,
      });
    });

    it("should return all occurrences when no entry type filter", async () => {
      const mockOccurrences = [
        createMockOccurrence({ entry_type: "expense" }),
        createMockOccurrence({ entry_type: "income" }),
      ];
      const supabase = createMockSupabaseClient({
        data: mockOccurrences,
        error: null,
      });

      const result = await generateCSVExport(supabase, mockUserId, mockFromDate, mockToDate);

      expect(result).toHaveLength(2);
    });

    it("should filter by income entry type", async () => {
      const mockOccurrences = [
        createMockOccurrence({ occurrence_id: "1", entry_type: "expense" }),
        createMockOccurrence({ occurrence_id: "2", entry_type: "income" }),
        createMockOccurrence({ occurrence_id: "3", entry_type: "income" }),
      ];
      const supabase = createMockSupabaseClient({
        data: mockOccurrences,
        error: null,
      });

      const result = await generateCSVExport(
        supabase,
        mockUserId,
        mockFromDate,
        mockToDate,
        "income"
      );

      expect(result).toHaveLength(2);
      expect(result.every((occ) => occ.entry_type === "income")).toBe(true);
    });

    it("should filter by expense entry type", async () => {
      const mockOccurrences = [
        createMockOccurrence({ occurrence_id: "1", entry_type: "expense" }),
        createMockOccurrence({ occurrence_id: "2", entry_type: "income" }),
      ];
      const supabase = createMockSupabaseClient({
        data: mockOccurrences,
        error: null,
      });

      const result = await generateCSVExport(
        supabase,
        mockUserId,
        mockFromDate,
        mockToDate,
        "expense"
      );

      expect(result).toHaveLength(1);
      expect(result[0].entry_type).toBe("expense");
    });

    it("should return empty array when no matching entries", async () => {
      const mockOccurrences = [createMockOccurrence({ entry_type: "expense" })];
      const supabase = createMockSupabaseClient({
        data: mockOccurrences,
        error: null,
      });

      const result = await generateCSVExport(
        supabase,
        mockUserId,
        mockFromDate,
        mockToDate,
        "income"
      );

      expect(result).toEqual([]);
    });

    it("should throw error when RPC fails", async () => {
      const supabase = createMockSupabaseClient({
        data: null,
        error: { message: "Database connection failed" },
      });

      await expect(
        generateCSVExport(supabase, mockUserId, mockFromDate, mockToDate)
      ).rejects.toThrow("Failed to expand occurrences: Database connection failed");
    });

    it("should include error message from Supabase in thrown error", async () => {
      const errorMessage = "Permission denied for user";
      const supabase = createMockSupabaseClient({
        data: null,
        error: { message: errorMessage },
      });

      await expect(
        generateCSVExport(supabase, mockUserId, mockFromDate, mockToDate)
      ).rejects.toThrow(errorMessage);
    });

    it("should handle empty data from RPC", async () => {
      const supabase = createMockSupabaseClient({
        data: [],
        error: null,
      });

      const result = await generateCSVExport(supabase, mockUserId, mockFromDate, mockToDate);

      expect(result).toEqual([]);
    });
  });
});

