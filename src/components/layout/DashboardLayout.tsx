import React from "react";
import { AppHeader } from "./AppHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <AppHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
};
