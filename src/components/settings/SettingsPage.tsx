
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServersTab from "./ServersTab";
import StorageTab from "./StorageTab";
import BrandingTab from "./BrandingTab";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  
  // Only admin can access settings
  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your infrastructure settings.
        </p>
      </div>

      <Tabs defaultValue="servers" className="w-full">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="servers">Proxmox Servers</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="general">General Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="branding">
          <BrandingTab />
        </TabsContent>
        <TabsContent value="servers">
          <ServersTab />
        </TabsContent>
        <TabsContent value="storage">
          <StorageTab />
        </TabsContent>
        <TabsContent value="general">
          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-medium">General Settings</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Additional settings will be available in future updates.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
