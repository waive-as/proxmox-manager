import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { proxmoxService } from "@/services/proxmoxService";
import { useAuth } from "@/context/AuthContext";

// Mock storage data - in a real app this would come from the Proxmox API
const mockStorageData = [
  {
    id: "local",
    name: "local",
    type: "dir",
    content: "images,iso,backup",
    available: "235.76 GB",
    used: "45.32 GB",
    total: "281.08 GB",
    status: "available",
    server: "pve1"
  },
  {
    id: "local-lvm",
    name: "local-lvm",
    type: "lvm",
    content: "images,rootdir",
    available: "142.55 GB",
    used: "89.45 GB",
    total: "232.00 GB",
    status: "available",
    server: "pve1"
  },
  {
    id: "ceph-pool",
    name: "ceph-pool",
    type: "rbd",
    content: "images",
    available: "1.52 TB",
    used: "486.32 GB",
    total: "2.00 TB",
    status: "available",
    server: "pve2"
  }
];

const Storage: React.FC = () => {
  const { user } = useAuth();
  const isReadOnly = user?.role === "readonly";

  const { data: servers = [], isLoading, error } = useQuery({
    queryKey: ['servers'],
    queryFn: () => proxmoxService.getServers(),
  });

  if (isLoading) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading servers...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">
              Failed to load servers. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No servers configured. Please add servers in the settings page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Storage</h1>
        <p className="text-muted-foreground">
          View and manage storage across your Proxmox infrastructure.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HardDrive className="mr-2 h-5 w-5" />
            Storage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Storage</TableHead>
                <TableHead>Server</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Used</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockStorageData.map((storage) => {
                const server = servers.find(s => s.id === storage.server);
                return (
                  <TableRow key={`${storage.server}-${storage.id}`}>
                    <TableCell className="font-medium">{storage.name}</TableCell>
                    <TableCell>{server?.name || storage.server}</TableCell>
                    <TableCell>{storage.type}</TableCell>
                    <TableCell>{storage.content}</TableCell>
                    <TableCell>{storage.available}</TableCell>
                    <TableCell>{storage.used}</TableCell>
                    <TableCell>{storage.total}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        storage.status === "available" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {storage.status}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Storage;
