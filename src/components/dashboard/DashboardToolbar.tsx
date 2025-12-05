import React from "react";
import { Button } from "@/components/ui/button";

export const DashboardToolbar = () => {
  return (
    <div className="flex items-center justify-between space-y-2 p-4">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="flex items-center space-x-2">
        {/* Placeholders for filters */}
        <Button>Add Entry</Button>
      </div>
    </div>
  );
};
