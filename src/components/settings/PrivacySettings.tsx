import React from "react";
import { ExportDataCard } from "./ExportDataCard";
import { DeleteAccountCard } from "./DeleteAccountCard";

export function PrivacySettings() {
  return (
    <div className="space-y-6">
      <ExportDataCard />
      <DeleteAccountCard />
    </div>
  );
}

