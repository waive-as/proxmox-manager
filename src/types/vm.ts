// VM interfaces for real Proxmox data
export interface ProxmoxVM {
  vmid: number;
  name: string;
  status: 'running' | 'stopped' | 'paused' | 'unknown';
  node: string;
  serverId: string;
  serverName: string;
  cpu?: number;
  maxcpu?: number;
  mem?: number;
  maxmem?: number;
  maxdisk?: number;
  uptime?: number;
  template?: boolean;
  ipAddress?: string | null;
  netin?: number;
  netout?: number;
  pid?: number;
}

export interface VMWithServer extends ProxmoxVM {
  serverId: string;
  serverName: string;
}
