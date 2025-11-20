
import React from "react";
import { useServerConnections } from "@/hooks/use-server-connections";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HardDrive, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const StorageTab: React.FC = () => {
  const { servers } = useServerConnections();
  const { user } = useAuth();
  const [expandedServer, setExpandedServer] = React.useState<string | null>(null);
  
  const toggleServer = (serverId: string) => {
    setExpandedServer(expandedServer === serverId ? null : serverId);
  };

  const isReadOnly = user?.role === "readonly";

  if (servers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storage</CardTitle>
          <CardDescription>
            No servers configured. Add servers in the Proxmox Servers tab to view storage.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HardDrive className="mr-2 h-5 w-5" />
            Storage Management
          </CardTitle>
          <CardDescription>
            Manage storage across your Proxmox servers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {servers.map((server) => (
              <Collapsible key={server.id} className="border rounded-md">
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex w-full justify-between px-4 py-2"
                    onClick={() => toggleServer(server.id)}
                  >
                    <span className="font-medium">{server.name} ({server.host})</span>
                    {expandedServer === server.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 pt-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Storage</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Content</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Used</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Filter mock data by server - in a real app would fetch from API */}
                        {mockStorageData
                          .filter(storage => storage.server === server.id)
                          .map((storage) => (
                            <TableRow key={storage.id}>
                              <TableCell className="font-medium">{storage.name}</TableCell>
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
                              <TableCell className="text-right">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  disabled={isReadOnly}
                                >
                                  Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        {mockStorageData.filter(storage => storage.server === server.id).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                              No storage data available for this server
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageTab;
