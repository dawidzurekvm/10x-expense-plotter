import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletSettings } from "./WalletSettings";
import { AccountSettings } from "./AccountSettings";
import { PrivacySettings } from "./PrivacySettings";
import type { StartingBalanceDTO } from "@/types";

interface SettingsPageProps {
  initialStartingBalance?: StartingBalanceDTO | null;
}

export function SettingsPage({ initialStartingBalance }: SettingsPageProps) {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <Tabs defaultValue="wallet" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="privacy">Data & Privacy</TabsTrigger>
        </TabsList>
        <TabsContent value="wallet">
          <WalletSettings initialStartingBalance={initialStartingBalance} />
        </TabsContent>
        <TabsContent value="account">
          <AccountSettings />
        </TabsContent>
        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

