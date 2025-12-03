import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type {
  EntrySeriesRow,
  EntryListResponseDTO,
  EntrySeriesDetailDTO,
  EntrySeriesDTO,
  SeriesExceptionDTO,
  OccurrenceEditResponseDTO,
  FutureEditResponseDTO,
  EntireEditResponseDTO,
  DeleteEntryResponseDTO,
  ExceptionResponseDTO,
  CreateEntryCommand,
  UpdateEntryCommand,
  GetEntriesQueryParams,
  EditScope,
  DeleteScope,
  AnalyticsEventType,
  AnalyticsEventMetadata,
} from "../../types";
import type { ExceptionType } from "../../types"; // For 'override' and 'skip'

// Define custom errors
class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class EntriesService {
  constructor(private supabase: SupabaseClient<Database>) {}

  private async getSeriesRow(
    userId: string,
    id: string,
  ): Promise<EntrySeriesRow | null> {
    const { data, error } = await this.supabase
      .from("entry_series")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is no rows
      throw error;
    }

    return data || null;
  }

  async findAll(
    userId: string,
    params: GetEntriesQueryParams,
  ): Promise<EntryListResponseDTO> {
    let query = this.supabase
      .from("entry_series")
      .select("*", { count: "exact", head: false })
      .eq("user_id", userId);

    if (params.entry_type) {
      query = query.eq("entry_type", params.entry_type);
    }
    if (params.recurrence_type) {
      query = query.eq("recurrence_type", params.recurrence_type);
    }
    if (params.start_date_from) {
      query = query.gte("start_date", params.start_date_from);
    }
    if (params.start_date_to) {
      query = query.lte("start_date", params.start_date_to);
    }
    if (params.sort_by && params.sort_order) {
      query = query.order(params.sort_by, {
        ascending: params.sort_order === "asc",
      });
    }

    const limit = params.limit ?? 50;
    const offset = params.offset ?? 0;

    const { data, count, error } = await query.range(
      offset,
      offset + limit - 1,
    );

    if (error) {
      throw error;
    }

    return {
      data: data as EntrySeriesDTO[],
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    };
  }

  async findById(
    userId: string,
    id: string,
  ): Promise<EntrySeriesDetailDTO | null> {
    const series = await this.getSeriesRow(userId, id);
    if (!series) {
      return null;
    }

    const { data: exceptionsRaw, error } = await this.supabase
      .from("series_exceptions")
      .select("*")
      .eq("series_id", id)
      .order("exception_date", { ascending: true });

    if (error) {
      throw error;
    }

    const exceptions: SeriesExceptionDTO[] = (exceptionsRaw || []).map(
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
      ({ series_id: _, user_id: __, created_at: ___, ...rest }) => rest,
    );

    return {
      ...series,
      exceptions,
    };
  }

  // Helper method to log analytics event
  private async logAnalyticsEvent(
    userId: string,
    eventType: AnalyticsEventType,
    metadata?: AnalyticsEventMetadata,
  ): Promise<void> {
    try {
      const { error } = await this.supabase.from("analytics_events").insert({
        user_id: userId,
        event_type: eventType,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });

      if (error) {
        console.error(
          `[WARN] Failed to log analytics event ${eventType}:`,
          error,
        );
      }
    } catch (err) {
      console.error(`[WARN] Error logging analytics event ${eventType}:`, err);
    }
  }

  async create(
    userId: string,
    command: CreateEntryCommand,
  ): Promise<EntrySeriesDTO> {
    const { data, error } = await this.supabase
      .from("entry_series")
      .insert({ ...command, user_id: userId })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log analytics event
    await this.logAnalyticsEvent(userId, "entry_created", {
      entry_type: command.entry_type,
      recurrence_type: command.recurrence_type,
      has_end_date: !!command.end_date,
    });

    return data;
  }

  async update(
    userId: string,
    id: string,
    command: UpdateEntryCommand,
    scope: EditScope,
    date?: string,
  ): Promise<
    OccurrenceEditResponseDTO | FutureEditResponseDTO | EntireEditResponseDTO
  > {
    const series = await this.getSeriesRow(userId, id);
    if (!series) {
      throw new NotFoundError(`Entry series with id ${id} not found`);
    }

    switch (scope) {
      case "occurrence": {
        if (!date) {
          throw new Error("Date is required for occurrence scope");
        }

        const insertData = {
          series_id: id,
          exception_date: date,
          exception_type: "override" as ExceptionType,
          title: command.title,
          description: command.description,
          amount: command.amount,
          user_id: userId,
        };

        const { data: exception, error } = await this.supabase
          .from("series_exceptions")
          .insert(insertData)
          .select()
          .single();

        if (error) {
          throw error;
        }

        // Log after success
        await this.logAnalyticsEvent(userId, "entry_updated", {
          entry_type: command.entry_type,
          recurrence_type: command.recurrence_type,
          edit_scope: "occurrence",
        });

        return {
          exception: exception as ExceptionResponseDTO,
        };
      }

      case "future": {
        if (!date) {
          throw new Error("Date is required for future scope");
        }

        const splitDate = new Date(date);
        if (splitDate < new Date(series.start_date)) {
          throw new ConflictError("Cannot split series before its start date");
        }

        if (series.end_date && splitDate > new Date(series.end_date)) {
          throw new ConflictError(
            "Cannot edit future occurrences beyond the series end date",
          );
        }

        // Update original series end_date to date - 1
        const prevEndDate = new Date(splitDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        const prevEndStr = prevEndDate.toISOString().split("T")[0];

        const { error: updateError } = await this.supabase
          .from("entry_series")
          .update({ end_date: prevEndStr })
          .eq("id", id)
          .eq("user_id", userId);

        if (updateError) {
          throw updateError;
        }

        // Create new series
        const newSeriesData = {
          ...command,
          start_date: date,
          parent_series_id: id,
          user_id: userId,
        };

        const { data: newSeries, error: insertError } = await this.supabase
          .from("entry_series")
          .insert(newSeriesData)
          .select()
          .single();

        if (insertError) {
          // Note: No rollback implemented; in production, use Supabase RPC for transactions
          throw insertError;
        }

        // Fetch updated original series for response
        const updatedOriginal = await this.getSeriesRow(userId, id);
        if (!updatedOriginal) {
          throw new Error("Original series not found after update");
        }

        // Log after success
        await this.logAnalyticsEvent(userId, "entry_updated", {
          entry_type: command.entry_type,
          recurrence_type: command.recurrence_type,
          edit_scope: "future",
        });

        return {
          original_series: {
            id: updatedOriginal.id,
            /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
            end_date: updatedOriginal.end_date!, // Non-null assertion: guaranteed by prior update to prevEndStr
            updated_at: updatedOriginal.updated_at,
          },
          new_series: newSeries as EntrySeriesDTO,
        };
      }

      case "entire": {
        const { data: updated, error } = await this.supabase
          .from("entry_series")
          .update({ ...command })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) {
          throw error;
        }

        if (!updated) {
          throw new NotFoundError(`Entry series with id ${id} not found`);
        }

        // Log after success
        await this.logAnalyticsEvent(userId, "entry_updated", {
          entry_type: command.entry_type,
          recurrence_type: command.recurrence_type,
          edit_scope: "entire",
        });

        return updated as EntireEditResponseDTO;
      }
    }
  }

  async delete(
    userId: string,
    id: string,
    scope: DeleteScope,
    date?: string,
  ): Promise<DeleteEntryResponseDTO> {
    const series = await this.getSeriesRow(userId, id);
    if (!series) {
      throw new NotFoundError(`Entry series with id ${id} not found`);
    }

    let seriesDeleted = false;
    let exceptionCreated = false;

    switch (scope) {
      case "occurrence": {
        if (!date) {
          throw new Error("Date is required for occurrence scope");
        }

        const { error } = await this.supabase.from("series_exceptions").insert({
          series_id: id,
          exception_date: date,
          exception_type: "skip" as ExceptionType,
          user_id: userId,
        });

        if (error) {
          throw error;
        }

        exceptionCreated = true;
        break;
      }

      case "future": {
        if (!date) {
          throw new Error("Date is required for future scope");
        }

        const splitDate = new Date(date);
        if (splitDate < new Date(series.start_date)) {
          throw new ConflictError(
            "Cannot truncate series before its start date",
          );
        }

        if (series.end_date && splitDate > new Date(series.end_date)) {
          throw new ConflictError(
            "Cannot delete future occurrences beyond the series end date",
          );
        }

        // Update end_date to date - 1
        const prevEndDate = new Date(splitDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        const prevEndStr = prevEndDate.toISOString().split("T")[0];

        const { error } = await this.supabase
          .from("entry_series")
          .update({ end_date: prevEndStr })
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          throw error;
        }

        break;
      }

      case "entire": {
        const { error } = await this.supabase
          .from("entry_series")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          throw error;
        }

        seriesDeleted = true;
        break;
      }
    }

    // Log after success
    await this.logAnalyticsEvent(userId, "entry_deleted", {
      edit_scope: scope,
    });

    return {
      message: "Entry deleted successfully",
      scope,
      affected: {
        series_deleted: seriesDeleted,
        exception_created: exceptionCreated,
      },
    };
  }
}
