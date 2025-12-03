import type { SupabaseClient } from "@supabase/supabase-js";
import type { EntryType } from "@/types";

/**
 * CSV occurrence structure returned from expand_occurrences database function
 */
export interface CSVOccurrence {
  occurrence_id: string;
  series_id: string;
  entry_type: EntryType;
  title: string;
  description: string | null;
  occurrence_date: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

/**
 * Generates CSV export data by calling the expand_occurrences database function
 *
 * @param supabase - Supabase client instance
 * @param userId - Authenticated user ID
 * @param fromDate - Start date for export range (YYYY-MM-DD)
 * @param toDate - End date for export range (YYYY-MM-DD)
 * @param entryType - Optional filter by entry type (income or expense)
 * @returns Array of CSV occurrences
 * @throws Error if database function fails
 */
export async function generateCSVExport(
  supabase: SupabaseClient,
  userId: string,
  fromDate: string,
  toDate: string,
  entryType?: EntryType
): Promise<CSVOccurrence[]> {
  const { data, error } = await supabase.rpc("expand_occurrences", {
    p_user_id: userId,
    p_from_date: fromDate,
    p_to_date: toDate,
  });

  if (error) {
    throw new Error(`Failed to expand occurrences: ${error.message}`);
  }

  let occurrences = data as CSVOccurrence[];

  // Apply entry_type filter if provided
  if (entryType) {
    occurrences = occurrences.filter((occ) => occ.entry_type === entryType);
  }

  return occurrences;
}

/**
 * Escapes a CSV field to prevent formula injection and handle special characters
 *
 * Security measures:
 * - Prevents formula injection by prefixing with single quote
 * - Escapes quotes and wraps in quotes if contains special chars
 *
 * @param field - The field value to escape
 * @returns Escaped field value safe for CSV output
 */
export function escapeCsvField(field: string): string {
  // Prevent formula injection
  if (/^[=+\-@\t\r]/.test(field)) {
    field = "'" + field;
  }

  // Escape quotes and wrap in quotes if contains special chars
  if (field.includes('"') || field.includes(",") || field.includes("\n")) {
    field = '"' + field.replace(/"/g, '""') + '"';
  }

  return field;
}

/**
 * Formats a single CSV occurrence as a CSV row
 *
 * @param occ - CSV occurrence data
 * @returns Formatted CSV row string
 */
export function formatCsvRow(occ: CSVOccurrence): string {
  // Sign amount based on entry type (positive for income, negative for expense)
  const amount = occ.entry_type === "income" ? occ.amount : -occ.amount;

  return [
    occ.occurrence_id,
    occ.series_id,
    occ.entry_type,
    escapeCsvField(occ.title),
    escapeCsvField(occ.description || ""),
    occ.occurrence_date,
    amount.toFixed(2),
    occ.created_at,
    occ.updated_at,
  ].join(",");
}

/**
 * Generates complete CSV content with header and data rows
 *
 * @param occurrences - Array of CSV occurrences
 * @returns Complete CSV content as string
 */
export function generateCSVContent(occurrences: CSVOccurrence[]): string {
  const header = "occurrence_id,series_id,type,title,description,date,amount_pln,created_at,updated_at";
  const rows = occurrences.map(formatCsvRow);
  return [header, ...rows].join("\n");
}

/**
 * Generates a timestamped filename for CSV export
 *
 * @returns Filename in format: 10x-expense-plotter-export-YYYY-MM-DD.csv
 */
export function generateCSVFilename(): string {
  const today = new Date().toISOString().split("T")[0];
  return `10x-expense-plotter-export-${today}.csv`;
}
