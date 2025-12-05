import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntryForm } from "./EntryForm";
import type { EntryFormValues } from "./schema";
import type { EntrySeriesDetailDTO } from "@/types";

interface AddEditEntryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: EntrySeriesDetailDTO | null;
  onSubmit: (data: EntryFormValues) => Promise<void>;
}

export function AddEditEntryDialog({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
}: AddEditEntryDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (data: EntryFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to submit entry:", error);
      // Error handling should ideally be done in the parent or via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultValues: Partial<EntryFormValues> | undefined = initialData
    ? {
        entry_type: initialData.entry_type,
        title: initialData.title,
        amount: initialData.amount,
        description: initialData.description || "",
        start_date: new Date(initialData.start_date),
        recurrence_type: initialData.recurrence_type,
        end_date: initialData.end_date ? new Date(initialData.end_date) : undefined,
        weekday: initialData.weekday ?? undefined,
        day_of_month: initialData.day_of_month ?? undefined,
      }
    : undefined;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Entry" : "Add New Entry"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update the details of this entry."
              : "Create a new income or expense entry."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <EntryForm
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

