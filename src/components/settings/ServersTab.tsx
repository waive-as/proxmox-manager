import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Server, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Edit, 
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { proxmoxService } from "@/services/proxmoxService";
import { ProxmoxServer } from "@/lib/localStorage";
import { toast } from "sonner";

// Zod schema for form validation
const serverSchema = z.object({
  name: z.string().min(2, "Server name must be at least 2 characters"),
  host: z.string().min(1, "Host is required"),
  port: z.number().min(1).max(65535, "Port must be between 1 and 65535"),
  username: z.string().min(1, "Username is required"),
  realm: z.string().min(1, "Realm is required (e.g., pam, pve)"),
});

type ServerFormData = z.infer<typeof serverSchema>;

const ServersTab: React.FC = () => {
  const [servers, setServers] = useState<ProxmoxServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    trigger
  } = useForm<ServerFormData>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      name: "",
      host: "10.0.1.60",
      port: 8006,
      username: "root",
      realm: "pam",
    }
  });

  // Watch form values for test connection validation
  const watchedValues = watch();

  // Fetch servers on component mount
  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setIsLoading(true);
      const serverList = await proxmoxService.getServers();
      setServers(serverList);
    } catch (error: any) {
      console.error("Failed to fetch servers:", error);
      toast.error(error.message || "Failed to fetch servers");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    reset({
      name: "",
      host: "10.0.1.60",
      port: 8006,
      username: "root",
      realm: "pam",
    });
    setTestResult(null);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    resetForm();
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  const handleEdit = (server: ProxmoxServer) => {
    setValue("name", server.name);
    setValue("host", server.host);
    setValue("port", server.port);
    setValue("username", server.username);
    setValue("realm", server.realm);
    setEditingId(server.id);
    setIsAdding(true);
    setTestResult(null);
  };

  const handleDelete = async (server: ProxmoxServer) => {
    if (confirm(`Are you sure you want to remove "${server.name}"?\n\nVMs from this server will no longer be accessible.`)) {
      try {
        await proxmoxService.deleteServer(server.id);
        toast.success(`Server "${server.name}" removed successfully`);
        fetchServers(); // Refresh the list
      } catch (error: any) {
        console.error("Failed to delete server:", error);
        toast.error(error.message || "Failed to delete server");
      }
    }
  };

  const handleTestConnection = async () => {
    try {
      // Validate form before testing
      const isValid = await trigger();
      if (!isValid) {
        toast.error("Please fix form errors before testing connection");
        return;
      }

      setTestResult(null);

      // If editing, test the existing server
      if (editingId) {
        const result = await proxmoxService.testConnection(editingId);
        setTestResult(result);
        if (result.success) {
          toast.success("Connection test successful!");
        } else {
          toast.error(`Connection test failed: ${result.message}`);
        }
      } else {
        // For new servers, we can't test until they're saved
        toast.info("Save the server first, then test the connection");
      }
    } catch (error: any) {
      console.error("Connection test failed:", error);
      const errorResult = { success: false, message: error.message || "Connection test failed" };
      setTestResult(errorResult);
      toast.error(`Connection test failed: ${errorResult.message}`);
    }
  };

  const onSubmit = async (data: ServerFormData) => {
    try {
      const serverData = {
        name: data.name,
        host: data.host,
        port: data.port,
        username: data.username,
        realm: data.realm,
      };

      if (editingId) {
        await proxmoxService.updateServer(editingId, serverData);
        toast.success(`Server "${data.name}" updated successfully`);
      } else {
        await proxmoxService.addServer(serverData);
        toast.success(`Server "${data.name}" added successfully`);
      }

      setIsAdding(false);
      setEditingId(null);
      resetForm();
      fetchServers(); // Refresh the list
    } catch (error: any) {
      console.error("Failed to save server:", error);
      toast.error(error.message || "Failed to save server");
    }
  };

  const handleTestExistingServer = async (server: ProxmoxServer) => {
    try {
      setTestingId(server.id);
      const result = await proxmoxService.testConnection(server.id);

      if (result.success) {
        toast.success(`Successfully connected to "${server.name}"`);
      } else {
        toast.error(`Failed to connect to "${server.name}": ${result.message}`);
      }
    } catch (error: any) {
      console.error("Connection test failed:", error);
      toast.error(`Failed to connect to "${server.name}": ${error.message}`);
    } finally {
      setTestingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Proxmox Servers</CardTitle>
          <CardDescription>
            Add and manage your Proxmox server connections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {servers.length === 0 && !isAdding ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Server className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No servers configured</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Add your first Proxmox server to get started.
              </p>
              <Button onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" />
                Add Server
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!isAdding && (
                <Button onClick={handleAdd} className="mb-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Server
                </Button>
              )}
              
              {isAdding && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>{editingId ? "Edit Server" : "Add New Server"}</CardTitle>
                    <CardDescription>
                      Configure your Proxmox server connection details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Server Name</Label>
                          <Input
                            id="name"
                            placeholder="Mozart Server"
                            {...register("name")}
                          />
                          {errors.name && (
                            <p className="text-sm text-red-500">{errors.name.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="host">Host/IP Address</Label>
                          <Input
                            id="host"
                            placeholder="10.0.1.60"
                            {...register("host")}
                          />
                          {errors.host && (
                            <p className="text-sm text-red-500">{errors.host.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="port">Port</Label>
                          <Input
                            id="port"
                            type="number"
                            placeholder="8006"
                            {...register("port", { valueAsNumber: true })}
                          />
                          {errors.port && (
                            <p className="text-sm text-red-500">{errors.port.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            placeholder="root"
                            {...register("username")}
                          />
                          <p className="text-xs text-muted-foreground">
                            Proxmox username (e.g., root)
                          </p>
                          {errors.username && (
                            <p className="text-sm text-red-500">{errors.username.message}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="realm">Realm</Label>
                          <Input
                            id="realm"
                            placeholder="pam"
                            {...register("realm")}
                          />
                          <p className="text-xs text-muted-foreground">
                            Authentication realm (pam, pve, etc.)
                          </p>
                          {errors.realm && (
                            <p className="text-sm text-red-500">{errors.realm.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Test Connection Button */}
                      <div className="flex justify-between items-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTestConnection}
                          disabled={isSubmitting || !watchedValues.name || !watchedValues.host || !watchedValues.username || !watchedValues.realm}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Test Connection
                        </Button>
                      </div>

                      {/* Test Result Alert */}
                      {testResult && (
                        <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                          {testResult.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                            {testResult.message}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" type="button" onClick={handleCancel} disabled={isSubmitting}>
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              {editingId ? "Update" : "Add"} Server
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
              
              {!isAdding && servers.map((server) => (
                <Card key={server.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Server className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-lg">{server.name}</CardTitle>
                          <CardDescription>
                            {server.host}:{server.port}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge variant={server.isActive ? "default" : "secondary"}>
                          {server.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(server)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(server)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestExistingServer(server)}
                      className="ml-auto"
                      disabled={testingId === server.id}
                    >
                      {testingId === server.id ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Test Connection
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServersTab;