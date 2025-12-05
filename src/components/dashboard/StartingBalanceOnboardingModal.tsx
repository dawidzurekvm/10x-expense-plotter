import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { StartingBalanceForm } from "./StartingBalanceForm";
import { type UpsertStartingBalanceCommand } from "@/types";

interface StartingBalanceOnboardingModalProps {
  isOpen: boolean;
  onSubmit: (data: UpsertStartingBalanceCommand) => Promise<void>;
}

export const StartingBalanceOnboardingModal: React.FC<StartingBalanceOnboardingModalProps> = ({ isOpen, onSubmit }) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Welcome to 10x Expense Plotter</DialogTitle>
          <DialogDescription>
            To get started, please enter your current account balance and the date it is effective from.
          </DialogDescription>
        </DialogHeader>
        <StartingBalanceForm onSubmit={onSubmit} />
      </DialogContent>
    </Dialog>
  );
};
