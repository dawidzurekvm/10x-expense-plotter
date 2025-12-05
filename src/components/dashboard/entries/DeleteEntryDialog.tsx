import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { DeleteScope } from "@/types";

interface DeleteEntryDialogProps {
  isOpen: boolean;
  isRecurring: boolean;
  onClose: () => void;
  onConfirm: (scope: DeleteScope) => void;
}

export function DeleteEntryDialog({
  isOpen,
  isRecurring,
  onClose,
  onConfirm,
}: DeleteEntryDialogProps) {
  const [scope, setScope] = React.useState<DeleteScope>("occurrence");

  const handleConfirm = () => {
    onConfirm(isRecurring ? scope : "occurrence"); // scope ignored if not recurring effectively
    onClose();
  };

  // If not recurring, we just show a simple confirmation
  // If recurring, we show options inside the content
  
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Entry</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this entry? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isRecurring && (
           <div className="grid gap-4 py-4">
             <Label>Select deletion scope:</Label>
             <RadioGroup
               value={scope}
               onValueChange={(v) => setScope(v as DeleteScope)}
               className="grid gap-3"
             >
               <div className="flex items-center space-x-2 rounded-md border p-4 hover:bg-muted/50">
                 <RadioGroupItem value="occurrence" id="del-occurrence" />
                 <div className="flex-1 grid gap-1">
                   <Label htmlFor="del-occurrence" className="font-medium">
                     This occurrence only
                   </Label>
                   <span className="text-xs text-muted-foreground">
                     Skips this specific date.
                   </span>
                 </div>
               </div>
               <div className="flex items-center space-x-2 rounded-md border p-4 hover:bg-muted/50">
                 <RadioGroupItem value="future" id="del-future" />
                 <div className="flex-1 grid gap-1">
                   <Label htmlFor="del-future" className="font-medium">
                     This and future occurrences
                   </Label>
                   <span className="text-xs text-muted-foreground">
                     Stops the series at the previous occurrence.
                   </span>
                 </div>
               </div>
               <div className="flex items-center space-x-2 rounded-md border p-4 hover:bg-muted/50">
                 <RadioGroupItem value="entire" id="del-entire" />
                 <div className="flex-1 grid gap-1">
                   <Label htmlFor="del-entire" className="font-medium">
                     Entire series
                   </Label>
                   <span className="text-xs text-muted-foreground">
                     Removes the series and all history.
                   </span>
                 </div>
               </div>
             </RadioGroup>
           </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-rose-600 hover:bg-rose-700">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

