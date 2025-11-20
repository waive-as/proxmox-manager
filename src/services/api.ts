
import { toast } from "sonner";

// VM status types
export type VMStatus = "running" | "stopped" | "paused" | "error";

// VM interface
export interface VM {
  id: string;
  name: string;
  status: VMStatus;
  node: string;
  cpu: {
    cores: number;
    usage: number; // percentage
  };
  memory: {
    total: number; // in MB
    used: number; // in MB
    usage: number; // percentage
  };
  disk: {
    total: number; // in GB
    used: number; // in GB
    usage: number; // percentage
  };
  network: {
    in: number; // in Mbps
    out: number; // in Mbps
  };
  uptime: number; // in seconds
  description?: string;
  tags?: string[];
  ip?: string;
}

// Node interface
export interface Node {
  id: string;
  name: string;
  status: "online" | "offline";
  cpu: {
    cores: number;
    usage: number; // percentage
  };
  memory: {
    total: number; // in MB
    used: number; // in MB
    usage: number; // percentage
  };
  storage: {
    total: number; // in GB
    used: number; // in GB
    usage: number; // percentage
  };
  vms: number; // count of VMs
}

// Resource usage history point
export interface ResourcePoint {
  timestamp: number;
  value: number;
}

// Resource usage history
export interface ResourceHistory {
  cpu: ResourcePoint[];
  memory: ResourcePoint[];
  disk: ResourcePoint[];
  network: {
    in: ResourcePoint[];
    out: ResourcePoint[];
  };
}

// For development purposes, let's create some mock data
const mockVMs: VM[] = [
  {
    id: "100",
    name: "Web Server",
    status: "running",
    node: "pve-node-01",
    cpu: {
      cores: 4,
      usage: 23,
    },
    memory: {
      total: 8192,
      used: 3541,
      usage: 43,
    },
    disk: {
      total: 100,
      used: 42,
      usage: 42,
    },
    network: {
      in: 8.2,
      out: 3.5,
    },
    uptime: 1209600, // 14 days
    description: "Main web server",
    tags: ["production", "web"],
    ip: "10.0.0.10",
  },
  {
    id: "101",
    name: "Database Server",
    status: "running",
    node: "pve-node-01",
    cpu: {
      cores: 8,
      usage: 45,
    },
    memory: {
      total: 16384,
      used: 12288,
      usage: 75,
    },
    disk: {
      total: 500,
      used: 230,
      usage: 46,
    },
    network: {
      in: 4.7,
      out: 2.1,
    },
    uptime: 2419200, // 28 days
    description: "Primary database server",
    tags: ["production", "database"],
    ip: "10.0.0.11",
  },
  {
    id: "102",
    name: "Test Environment",
    status: "stopped",
    node: "pve-node-02",
    cpu: {
      cores: 2,
      usage: 0,
    },
    memory: {
      total: 4096,
      used: 0,
      usage: 0,
    },
    disk: {
      total: 50,
      used: 12,
      usage: 24,
    },
    network: {
      in: 0,
      out: 0,
    },
    uptime: 0,
    description: "Test environment for development",
    tags: ["test", "development"],
    ip: "10.0.0.20",
  },
  {
    id: "103",
    name: "Backup Server",
    status: "paused",
    node: "pve-node-02",
    cpu: {
      cores: 2,
      usage: 0,
    },
    memory: {
      total: 4096,
      used: 1024,
      usage: 25,
    },
    disk: {
      total: 1000,
      used: 750,
      usage: 75,
    },
    network: {
      in: 0.1,
      out: 0.1,
    },
    uptime: 604800, // 7 days (before pause)
    description: "Backup and archive server",
    tags: ["backup", "storage"],
    ip: "10.0.0.30",
  },
];

const mockNodes: Node[] = [
  {
    id: "pve-node-01",
    name: "pve-node-01",
    status: "online",
    cpu: {
      cores: 32,
      usage: 35,
    },
    memory: {
      total: 131072, // 128 GB
      used: 65536, // 64 GB
      usage: 50,
    },
    storage: {
      total: 10000, // 10 TB
      used: 5500, // 5.5 TB
      usage: 55,
    },
    vms: 10,
  },
  {
    id: "pve-node-02",
    name: "pve-node-02",
    status: "online",
    cpu: {
      cores: 16,
      usage: 25,
    },
    memory: {
      total: 65536, // 64 GB
      used: 32768, // 32 GB
      usage: 50,
    },
    storage: {
      total: 5000, // 5 TB
      used: 2000, // 2 TB
      usage: 40,
    },
    vms: 8,
  },
];

// Generate some random resource history data
const generateResourceHistory = (days = 7, pointsPerDay = 24): ResourceHistory => {
  const now = Date.now();
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const pointInterval = millisecondsPerDay / pointsPerDay;
  const totalPoints = days * pointsPerDay;
  
  const cpu: ResourcePoint[] = [];
  const memory: ResourcePoint[] = [];
  const disk: ResourcePoint[] = [];
  const networkIn: ResourcePoint[] = [];
  const networkOut: ResourcePoint[] = [];
  
  let lastCpu = Math.random() * 40 + 10; // Start between 10-50%
  let lastMemory = Math.random() * 30 + 30; // Start between 30-60%
  let lastDisk = Math.random() * 20 + 30; // Start between 30-50%
  let lastNetIn = Math.random() * 10; // Start between 0-10 Mbps
  let lastNetOut = Math.random() * 5; // Start between 0-5 Mbps
  
  for (let i = 0; i < totalPoints; i++) {
    const timestamp = now - (totalPoints - i) * pointInterval;
    
    // Simulate some realistic fluctuations
    lastCpu = Math.max(5, Math.min(95, lastCpu + (Math.random() - 0.5) * 10));
    lastMemory = Math.max(20, Math.min(90, lastMemory + (Math.random() - 0.5) * 5));
    lastDisk = Math.max(lastDisk, lastDisk + (Math.random() - 0.3) * 1); // Disk usage generally increases
    lastNetIn = Math.max(0.1, Math.min(30, lastNetIn + (Math.random() - 0.5) * 3));
    lastNetOut = Math.max(0.1, Math.min(20, lastNetOut + (Math.random() - 0.5) * 2));
    
    cpu.push({ timestamp, value: lastCpu });
    memory.push({ timestamp, value: lastMemory });
    disk.push({ timestamp, value: lastDisk });
    networkIn.push({ timestamp, value: lastNetIn });
    networkOut.push({ timestamp, value: lastNetOut });
  }
  
  return {
    cpu,
    memory,
    disk,
    network: {
      in: networkIn,
      out: networkOut,
    },
  };
};

// API class for Proxmox operations
export class ProxmoxAPI {
  private static instance: ProxmoxAPI;
  private authToken: string | null = null;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): ProxmoxAPI {
    if (!ProxmoxAPI.instance) {
      ProxmoxAPI.instance = new ProxmoxAPI();
    }
    return ProxmoxAPI.instance;
  }
  
  public async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
  }
  
  public async getVMs(): Promise<VM[]> {
    // In a real implementation, this would make an API call to Proxmox
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
    return [...mockVMs];
  }
  
  public async getVM(id: string): Promise<VM | null> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
    const vm = mockVMs.find(vm => vm.id === id);
    return vm ? { ...vm } : null;
  }
  
  public async getNodes(): Promise<Node[]> {
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
    return [...mockNodes];
  }
  
  public async getResourceHistory(vmId: string): Promise<ResourceHistory> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    return generateResourceHistory();
  }
  
  public async startVM(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    
    const vmIndex = mockVMs.findIndex(vm => vm.id === id);
    if (vmIndex !== -1) {
      mockVMs[vmIndex].status = "running";
      toast.success(`VM "${mockVMs[vmIndex].name}" has been started`);
      return true;
    }
    
    toast.error("Failed to start VM");
    return false;
  }
  
  public async stopVM(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    
    const vmIndex = mockVMs.findIndex(vm => vm.id === id);
    if (vmIndex !== -1) {
      mockVMs[vmIndex].status = "stopped";
      toast.success(`VM "${mockVMs[vmIndex].name}" has been stopped`);
      return true;
    }
    
    toast.error("Failed to stop VM");
    return false;
  }
  
  public async rebootVM(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
    
    const vmIndex = mockVMs.findIndex(vm => vm.id === id);
    if (vmIndex !== -1) {
      // Temporarily set to stopped to simulate reboot
      mockVMs[vmIndex].status = "stopped";
      toast.info(`VM "${mockVMs[vmIndex].name}" is rebooting...`);
      
      // Then set back to running after a delay
      setTimeout(() => {
        mockVMs[vmIndex].status = "running";
        toast.success(`VM "${mockVMs[vmIndex].name}" has been rebooted`);
      }, 3000);
      
      return true;
    }
    
    toast.error("Failed to reboot VM");
    return false;
  }
  
  public async pauseVM(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    
    const vmIndex = mockVMs.findIndex(vm => vm.id === id);
    if (vmIndex !== -1) {
      mockVMs[vmIndex].status = "paused";
      toast.success(`VM "${mockVMs[vmIndex].name}" has been paused`);
      return true;
    }
    
    toast.error("Failed to pause VM");
    return false;
  }
  
  public async resumeVM(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    
    const vmIndex = mockVMs.findIndex(vm => vm.id === id);
    if (vmIndex !== -1) {
      mockVMs[vmIndex].status = "running";
      toast.success(`VM "${mockVMs[vmIndex].name}" has been resumed`);
      return true;
    }
    
    toast.error("Failed to resume VM");
    return false;
  }
}

// Export a singleton instance
export const proxmoxAPI = ProxmoxAPI.getInstance();
