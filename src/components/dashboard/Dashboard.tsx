import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity, 
  Database, 
  Monitor, 
  Server, 
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { proxmoxService } from "@/services/proxmoxService";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch servers
  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ['proxmox-servers'],
    queryFn: () => proxmoxService.getServers(),
    staleTime: 30 * 1000,
  });

  // Fetch VMs for all servers (only for stats calculation)
  const { data: allVMs, isLoading: vmsLoading, error } = useQuery({
    queryKey: ['proxmox-vms', servers],
    queryFn: async () => {
      if (!servers || servers.length === 0) return [];
      
      const vmPromises = servers.map(async (server) => {
        try {
          const vms = await proxmoxService.getVMs(server.id);
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

  // Calculate statistics
  const stats = {
    totalVMs: allVMs?.length || 0,
    runningVMs: (allVMs || []).filter(vm => vm.status === 'running').length,
    stoppedVMs: (allVMs || []).filter(vm => vm.status === 'stopped').length,
    totalServers: servers?.length || 0
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-4">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <div className="flex-1"></div>
          <p className="text-muted-foreground">
            Loading...
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-4">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <div className="flex-1"></div>
        </div>
        
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">Failed to load dashboard data</h3>
            </div>
            <p className="text-red-600 mt-2">
              {error.message || "An error occurred while loading the dashboard"}
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
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <div className="flex-1"></div>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total VMs</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVMs}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.totalServers} servers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running VMs</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.runningVMs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalVMs > 0 ? Math.round((stats.runningVMs / stats.totalVMs) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stopped VMs</CardTitle>
            <Monitor className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.stoppedVMs}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalVMs > 0 ? Math.round((stats.stoppedVMs / stats.totalVMs) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servers</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServers}</div>
            <p className="text-xs text-muted-foreground">
              Proxmox servers configured
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation to Virtual Machines */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Virtual Machine Management</h3>
              <p className="text-muted-foreground">
                View and manage all your virtual machines across all configured servers
              </p>
            </div>
            <Button 
              onClick={() => navigate('/virtual-machines')} 
              className="mt-4 sm:mt-0"
            >
              View All Virtual Machines
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;