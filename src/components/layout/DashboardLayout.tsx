import React from "react";
import { AppHeader } from "./AppHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    email?: string;
    id: string;
  } | null;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, user }) => {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <AppHeader user={user} />
      <div className="flex-1">{children}</div>
    </div>
  );
};
