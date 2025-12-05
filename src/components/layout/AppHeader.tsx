import React from "react";
import { UserMenu } from "./UserMenu";

interface AppHeaderProps {
  user?: {
    email?: string;
    id: string;
  } | null;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ user }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="hidden font-bold sm:inline-block">10x Expense Plotter</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
};
