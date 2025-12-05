import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { EditScope } from "@/types";

interface EditScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScope: (scope: EditScope) => void;
}

export function EditScopeModal({
  isOpen,
  onClose,
  onSelectScope,
}: EditScopeModalProps) {
  const [scope, setScope] = React.useState<EditScope>("occurrence");

  const handleConfirm = () => {
    onSelectScope(scope);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Recurring Entry</DialogTitle>
          <DialogDescription>
            This is a recurring entry. How would you like to apply your changes?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup
            value={scope}
            onValueChange={(v) => setScope(v as EditScope)}
            className="grid gap-3"
          >
            <div className="flex items-center space-x-2 rounded-md border p-4 hover:bg-muted/50">
              <RadioGroupItem value="occurrence" id="occurrence" />
              <div className="flex-1 grid gap-1">
                <Label htmlFor="occurrence" className="font-medium">
                  This occurrence only
                </Label>
                <span className="text-xs text-muted-foreground">
                  Creates an exception for this specific date.
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-4 hover:bg-muted/50">
              <RadioGroupItem value="future" id="future" />
              <div className="flex-1 grid gap-1">
                <Label htmlFor="future" className="font-medium">
                  This and future occurrences
                </Label>
                <span className="text-xs text-muted-foreground">
                  Splits the series from this date forward.
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-4 hover:bg-muted/50">
              <RadioGroupItem value="entire" id="entire" />
              <div className="flex-1 grid gap-1">
                <Label htmlFor="entire" className="font-medium">
                  Entire series
                </Label>
                <span className="text-xs text-muted-foreground">
                  Updates all past and future occurrences.
                </span>
              </div>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

