import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Activity, 
  Database, 
  Monitor, 
  Server, 
  Search, 
  Filter,
  Play,
  Square,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Plus,
  Power,
  PowerOff
} from "lucide-react";
import { localProxmoxService } from "@/services/localProxmoxService";
import { ProxmoxServer } from "@/lib/localStorage";
import { ProxmoxVM, VMWithServer } from "@/types/vm";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

const VirtualMachines: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serverFilter, setServerFilter] = useState<string>("all");
  
  const { canControlVMs } = usePermissions();

  // Fetch servers
  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ['proxmox-servers'],
    queryFn: () => localProxmoxService.getServers(),
    staleTime: 30 * 1000,
  });

  // Fetch VMs for all servers
  const { data: allVMs, isLoading: vmsLoading, error } = useQuery({
    queryKey: ['proxmox-vms', servers],
    queryFn: async () => {
      if (!servers || servers.length === 0) return [];
      
      const vmPromises = servers.map(async (server) => {
        try {
          const vms = await localProxmoxService.getVMs(server.id);
          return vms.map((vm: any) => ({
            vmid: vm.vmid,
            name: vm.name || `VM ${vm.vmid}`,
            status: vm.status || 'unknown',
            node: vm.node || 'unknown',
            serverId: server.id,
            serverName: server.name,
            cpu: vm.cpu || 0,
            maxcpu: vm.maxcpu || 0,
            mem: vm.mem || 0,
            maxmem: vm.maxmem || 0,
            maxdisk: vm.maxdisk || 0,
            uptime: vm.uptime || 0,
            template: vm.template || false,
            ipAddress: vm.ipAddress || null,
            netin: vm.netin || 0,
            netout: vm.netout || 0,
            pid: vm.pid || undefined
          }));
        } catch (error) {
          console.error(`Failed to fetch VMs for server ${server.name}:`, error);
          return [];
        }
      });
      
      const results = await Promise.all(vmPromises);
      return results.flat();
    },
    enabled: !!servers && servers.length > 0,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Auto-update every 30 seconds
  });

  const isLoading = serversLoading || vmsLoading;

  // VM action mutation
  const vmActionMutation = useMutation({
    mutationFn: async ({ action, vm }: { action: string, vm: VMWithServer }) => {
      if (action === 'start') {
        return localProxmoxService.startVM(vm.serverId, vm.node, vm.vmid);
      } else if (action === 'stop') {
        return localProxmoxService.stopVM(vm.serverId, vm.node, vm.vmid);
      } else if (action === 'restart') {
        return localProxmoxService.restartVM(vm.serverId, vm.node, vm.vmid);
      } else if (action === 'reset') {
        return localProxmoxService.resetVM(vm.serverId, vm.node, vm.vmid);
      } else if (action === 'shutdown') {
        return localProxmoxService.shutdownVM(vm.serverId, vm.node, vm.vmid);
      }
    },
    onSuccess: (_, { action, vm }) => {
      // Invalidate and refetch VM data after action
      queryClient.invalidateQueries({ queryKey: ['proxmox-vms'] });
      toast.success(`VM ${vm.name} ${action}ed successfully`);
    },
    onError: (error: any, { action, vm }) => {
      toast.error(`Failed to ${action} VM: ${error.message}`);
    },
  });

  const handleVMAction = (action: 'start' | 'stop' | 'restart' | 'reset' | 'shutdown', vm: VMWithServer) => {
    if (!canControlVMs) {
      toast.error("You don't have permission to control VMs");
      return;
    }
    
    vmActionMutation.mutate({ action, vm });
  };

  // Filter VMs based on search and filters
  const filteredVMs = (allVMs || [])
    .filter(vm => {
      const matchesSearch = vm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vm.vmid.toString().includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || vm.status === statusFilter;
      const matchesServer = serverFilter === 'all' || vm.serverId === serverFilter;
      
      return matchesSearch && matchesStatus && matchesServer;
    })
    .sort((a, b) => {
      // Sort by server name first, then by VM ID
      if (a.serverName !== b.serverName) {
        return a.serverName.localeCompare(b.serverName);
      }
      return a.vmid - b.vmid;
    });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500 hover:bg-green-600';
      case 'stopped':
        return 'bg-red-500 hover:bg-red-600';
      case 'paused':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const formatMemory = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return null; // Return null instead of 'N/A' to hide the field
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Virtual Machines</h1>
            <p className="text-muted-foreground">Manage your virtual machine infrastructure</p>
          </div>
          <div className="flex-1"></div>
          <p className="text-muted-foreground">
            Loading...
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Virtual Machines</h1>
            <p className="text-muted-foreground">Manage your virtual machine infrastructure</p>
          </div>
          <div className="flex-1"></div>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">Failed to load virtual machines</h3>
            </div>
            <p className="text-red-600 mt-2">
              {error.message || "An error occurred while loading the virtual machines"}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Virtual Machines</h1>
          <p className="text-muted-foreground">Manage your virtual machine infrastructure</p>
        </div>
        <div className="flex-1"></div>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {servers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Server className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Proxmox servers configured</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add a Proxmox server in Settings to get started
            </p>
            <Button onClick={() => window.location.href = '/settings'}>
              <Plus className="mr-2 h-4 w-4" />
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search VMs by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="running">Running</SelectItem>
                    <SelectItem value="stopped">Stopped</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={serverFilter} onValueChange={setServerFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Server" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Servers</SelectItem>
                    {servers.map(server => (
                      <SelectItem key={server.id} value={server.id}>
                        {server.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* VM Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVMs.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No VMs found</h3>
                  <p className="text-muted-foreground text-center">
                    {searchTerm || statusFilter !== 'all' || serverFilter !== 'all'
                      ? 'Try adjusting your filters or search terms'
                      : 'No virtual machines are configured on your servers'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredVMs.map((vm) => (
                <Card key={`${vm.serverId}-${vm.vmid}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{vm.name}</CardTitle>
                        <CardDescription>VM ID: {vm.vmid}</CardDescription>
                      </div>
                      <Badge className={getStatusBadgeColor(vm.status)}>
                        {vm.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Server className="h-4 w-4 mr-2 text-blue-500" />
                      <span className="text-muted-foreground mr-1">Server:</span>
                      <span>{vm.serverName}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Database className="h-4 w-4 mr-2 text-purple-500" />
                      <span className="text-muted-foreground mr-1">Node:</span>
                      <span>{vm.node}</span>
                    </div>
                    {vm.ipAddress && (
                      <div className="flex items-center text-sm">
                        <Activity className="h-4 w-4 mr-2 text-indigo-500" />
                        <span className="text-muted-foreground mr-1">IP:</span>
                        <span className="font-mono text-sm">{vm.ipAddress}</span>
                      </div>
                    )}
                    {vm.maxcpu > 0 && (
                      <div className="flex items-center text-sm">
                        <Monitor className="h-4 w-4 mr-2 text-orange-500" />
                        <span className="text-muted-foreground mr-1">CPU:</span>
                        <span>{vm.maxcpu} Cores</span>
                        {vm.cpu !== undefined && vm.cpu > 0 && vm.status === 'running' && (
                          <span className="ml-2 text-muted-foreground">
                            ({vm.cpu.toFixed(1)}% usage)
                          </span>
                        )}
                      </div>
                    )}
                    {vm.maxmem > 0 && (
                      <div className="flex items-center text-sm">
                        <Database className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-muted-foreground mr-1">Memory:</span>
                        <span>{formatMemory(vm.maxmem)}</span>
                        {vm.mem !== undefined && vm.mem > 0 && (
                          <span className="ml-2 text-muted-foreground">
                            ({formatMemory(vm.mem)} used)
                          </span>
                        )}
                      </div>
                    )}
                    {vm.uptime > 0 && (
                      <div className="flex items-center text-sm">
                        <Activity className="h-4 w-4 mr-2 text-teal-500" />
                        <span className="text-muted-foreground mr-1">Uptime:</span>
                        <span>{formatUptime(vm.uptime)}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVMAction('start', vm)}
                            disabled={vm.status === 'running' || !canControlVMs || vmActionMutation.isPending}
                          >
                            {vmActionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {vm.status === 'running' ? (
                            <p>VM is already running</p>
                          ) : !canControlVMs ? (
                            <p>You don't have permission to control VMs</p>
                          ) : vmActionMutation.isPending ? (
                            <p>Action in progress...</p>
                          ) : (
                            <>
                              <p>Start VM</p>
                              <p className="text-xs text-muted-foreground">Power on the virtual machine</p>
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVMAction('stop', vm)}
                            disabled={vm.status === 'stopped' || !canControlVMs || vmActionMutation.isPending}
                          >
                            {vmActionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {vm.status === 'stopped' ? (
                            <p>VM is already stopped</p>
                          ) : !canControlVMs ? (
                            <p>You don't have permission to control VMs</p>
                          ) : vmActionMutation.isPending ? (
                            <p>Action in progress...</p>
                          ) : (
                            <>
                              <p>Force Stop VM</p>
                              <p className="text-xs text-muted-foreground">Immediately power off (like unplugging)</p>
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVMAction('restart', vm)}
                            disabled={vm.status === 'stopped' || !canControlVMs || vmActionMutation.isPending}
                          >
                            {vmActionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {vm.status === 'stopped' ? (
                            <p>VM must be running to restart</p>
                          ) : !canControlVMs ? (
                            <p>You don't have permission to control VMs</p>
                          ) : vmActionMutation.isPending ? (
                            <p>Action in progress...</p>
                          ) : (
                            <>
                              <p>Restart VM (Graceful)</p>
                              <p className="text-xs text-muted-foreground">Soft reboot - OS shuts down cleanly</p>
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVMAction('reset', vm)}
                            disabled={vm.status === 'stopped' || !canControlVMs || vmActionMutation.isPending}
                          >
                            {vmActionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {vm.status === 'stopped' ? (
                            <p>VM must be running to reset</p>
                          ) : !canControlVMs ? (
                            <p>You don't have permission to control VMs</p>
                          ) : vmActionMutation.isPending ? (
                            <p>Action in progress...</p>
                          ) : (
                            <>
                              <p>Reset VM (Hard Reboot)</p>
                              <p className="text-xs text-muted-foreground">Immediate restart - like pressing reset button</p>
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVMAction('shutdown', vm)}
                            disabled={vm.status === 'stopped' || !canControlVMs || vmActionMutation.isPending}
                          >
                            {vmActionMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <PowerOff className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {vm.status === 'stopped' ? (
                            <p>VM must be running to shutdown</p>
                          ) : !canControlVMs ? (
                            <p>You don't have permission to control VMs</p>
                          ) : vmActionMutation.isPending ? (
                            <p>Action in progress...</p>
                          ) : (
                            <>
                              <p>Shutdown VM (Graceful)</p>
                              <p className="text-xs text-muted-foreground">Clean shutdown - OS shuts down properly</p>
                            </>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {!canControlVMs && (
                      <p className="text-xs text-muted-foreground mt-2">
                        You don't have permission to control VMs
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VirtualMachines;
