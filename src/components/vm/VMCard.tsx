
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { VM, proxmoxAPI } from "@/services/api";
import StatusBadge from "../ui/StatusBadge";
import VMControls from "./VMControls";
import { Clock, Database, HardDrive, Cpu, Network } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUptime } from "@/utils/formatters";
import { useAuth } from "@/context/AuthContext";

interface VMCardProps {
  vm: VM;
}

const VMCard: React.FC<VMCardProps> = ({ vm }) => {
  const [loading, setLoading] = useState(false);
  const [currentVM, setCurrentVM] = useState<VM>(vm);
  const { user } = useAuth();

  const isReadOnly = user?.role === "readonly";

  const handleVMAction = async (action: 'start' | 'stop' | 'reboot' | 'pause' | 'resume') => {
    if (isReadOnly) return;
    
    setLoading(true);
    try {
      let success = false;
      
      switch (action) {
        case 'start':
          success = await proxmoxAPI.startVM(vm.id);
          break;
        case 'stop':
          success = await proxmoxAPI.stopVM(vm.id);
          break;
        case 'reboot':
          success = await proxmoxAPI.rebootVM(vm.id);
          break;
        case 'pause':
          success = await proxmoxAPI.pauseVM(vm.id);
          break;
        case 'resume':
          success = await proxmoxAPI.resumeVM(vm.id);
          break;
      }
      
      if (success) {
        // Refresh the VM data
        const updatedVM = await proxmoxAPI.getVM(vm.id);
        if (updatedVM) {
          setCurrentVM(updatedVM);
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} VM:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn(
      "glass-panel transition-all duration-300 hover-scale overflow-hidden",
      loading && "opacity-80"
    )}>
      <CardHeader className="pb-2 relative">
        <div className="absolute right-4 top-4">
          <StatusBadge status={currentVM.status} />
        </div>
        <CardTitle className="text-xl">{currentVM.name}</CardTitle>
        <CardDescription>{currentVM.description || 'No description'}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Cpu className="h-4 w-4 mr-2 text-blue-500" />
            <span className="text-muted-foreground mr-1">CPU:</span>
            <span>{currentVM.cpu.cores} cores</span>
            <div className="ml-auto flex items-center">
              <span className="font-medium">{currentVM.cpu.usage}%</span>
              <div className="w-16 h-1.5 bg-secondary ml-2 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500 ease-in-out rounded-full",
                    currentVM.cpu.usage < 50 ? "bg-blue-500" : currentVM.cpu.usage < 80 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${currentVM.cpu.usage}%` }} 
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center text-sm">
            <Database className="h-4 w-4 mr-2 text-purple-500" />
            <span className="text-muted-foreground mr-1">RAM:</span>
            <span>{(currentVM.memory.total / 1024).toFixed(1)} GB</span>
            <div className="ml-auto flex items-center">
              <span className="font-medium">{currentVM.memory.usage}%</span>
              <div className="w-16 h-1.5 bg-secondary ml-2 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500 ease-in-out rounded-full",
                    currentVM.memory.usage < 50 ? "bg-purple-500" : currentVM.memory.usage < 80 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${currentVM.memory.usage}%` }} 
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center text-sm">
            <HardDrive className="h-4 w-4 mr-2 text-green-500" />
            <span className="text-muted-foreground mr-1">Disk:</span>
            <span>{currentVM.disk.total} GB</span>
            <div className="ml-auto flex items-center">
              <span className="font-medium">{currentVM.disk.usage}%</span>
              <div className="w-16 h-1.5 bg-secondary ml-2 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500 ease-in-out rounded-full",
                    currentVM.disk.usage < 50 ? "bg-green-500" : currentVM.disk.usage < 80 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${currentVM.disk.usage}%` }} 
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center text-sm">
            <Network className="h-4 w-4 mr-2 text-indigo-500" />
            <span className="text-muted-foreground mr-1">Network:</span>
            <span>↓{currentVM.network.in} Mbps ↑{currentVM.network.out} Mbps</span>
          </div>
          
          {currentVM.uptime > 0 && (
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-teal-500" />
              <span className="text-muted-foreground mr-1">Uptime:</span>
              <span>{formatUptime(currentVM.uptime)}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <VMControls 
          status={currentVM.status} 
          onAction={handleVMAction} 
          loading={loading}
          isReadOnly={isReadOnly}
        />
      </CardFooter>
    </Card>
  );
};

export default VMCard;
