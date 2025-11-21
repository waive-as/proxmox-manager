import axios, { AxiosInstance } from 'axios';
import https from 'https';
import { config } from '@/config/index.js';

export interface ProxmoxNode {
  node: string;
  status: string;
  cpu: number;
  maxcpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
}

export interface ProxmoxVM {
  vmid: number;
  name: string;
  status: string;
  cpu: number;
  maxcpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  template: boolean;
  node: string;
  ipAddress?: string | null;
  netin?: number;
  netout?: number;
  pid?: number;
}

export interface ProxmoxContainer {
  vmid: number;
  name: string;
  status: string;
  cpu: number;
  maxcpu: number;
  mem: number;
  maxmem: number;
  disk: number;
  maxdisk: number;
  uptime: number;
}

export interface ProxmoxAuthResponse {
  ticket: string;
  CSRFPreventionToken: string;
  username: string;
}

export interface ProxmoxError {
  code: number;
  message: string;
  data?: any;
}

export class ProxmoxClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private ticket?: string;
  private csrfToken?: string;
  private tokenId?: string;
  private tokenSecret?: string;

  constructor(host: string, port: number = config.proxmoxDefaultPort, tokenId?: string, tokenSecret?: string) {
    this.baseUrl = `https://${host}:${port}`;
    this.tokenId = tokenId;
    this.tokenSecret = tokenSecret;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.proxmoxTimeout,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false // Allow self-signed certificates in development
      })
    });
  }

  /**
   * Authenticate using username/password
   */
  async authenticateWithPassword(username: string, password: string): Promise<void> {
    try {
      const response = await this.client.post('/api2/json/access/ticket', {
        username,
        password
      });

      const data = response.data.data;
      this.ticket = data.ticket;
      this.csrfToken = data.CSRFPreventionToken;

      // Set default headers for authenticated requests
      this.client.defaults.headers.common['Authorization'] = `PVEAPIToken=${this.ticket}`;
      this.client.defaults.headers.common['CSRFPreventionToken'] = this.csrfToken;
    } catch (error) {
      throw new Error(`Authentication failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Authenticate using API token
   */
  async authenticateWithToken(): Promise<void> {
    if (!this.tokenId || !this.tokenSecret) {
      throw new Error('Token ID and secret are required for token authentication');
    }

    try {
      // Set token authentication header
      this.client.defaults.headers.common['Authorization'] = `PVEAPIToken=${this.tokenId}=${this.tokenSecret}`;
      
      // Test the connection
      await this.client.get('/api2/json/version');
    } catch (error) {
      throw new Error(`Token authentication failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Test connection to Proxmox server
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/api2/json/version');
      return true;
    } catch (error) {
      console.error('Connection test failed:', this.getErrorMessage(error));
      return false;
    }
  }

  /**
   * Get Proxmox version information
   */
  async getVersion(): Promise<any> {
    try {
      const response = await this.client.get('/api2/json/version');
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get version: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get all nodes
   */
  async getNodes(): Promise<ProxmoxNode[]> {
    try {
      const response = await this.client.get('/api2/json/nodes');
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get nodes: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get VMs for a specific node
   */
  async getVMs(node: string): Promise<ProxmoxVM[]> {
    try {
      const response = await this.client.get(`/api2/json/nodes/${node}/qemu`);
      const vms = response.data.data;
      
      // Enhance VM data with additional information
      const enhancedVMs = await Promise.all(
        vms.map(async (vm: any) => {
          const enhancedVM: ProxmoxVM = {
            ...vm,
            node: node,
            ipAddress: null,
            netin: vm.netin || 0,
            netout: vm.netout || 0,
            pid: vm.pid || undefined,
            maxcpu: vm.cpus || vm.maxcpu || 0  // Map cpus to maxcpu
          };

          // Try to get IP address if VM is running
          if (vm.status === 'running') {
            try {
              const ipAddress = await this.getVMIPAddress(node, vm.vmid);
              enhancedVM.ipAddress = ipAddress;
            } catch (error) {
              // IP address not available, keep as null
              enhancedVM.ipAddress = null;
            }
          }

          return enhancedVM;
        })
      );

      return enhancedVMs;
    } catch (error) {
      throw new Error(`Failed to get VMs for node ${node}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get containers for a specific node
   */
  async getContainers(node: string): Promise<ProxmoxContainer[]> {
    try {
      const response = await this.client.get(`/api2/json/nodes/${node}/lxc`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get containers for node ${node}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get VM details
   */
  async getVMDetails(node: string, vmid: number): Promise<any> {
    try {
      const response = await this.client.get(`/api2/json/nodes/${node}/qemu/${vmid}/status/current`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get VM ${vmid} details: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get VM configuration
   */
  async getVMConfig(node: string, vmid: number): Promise<any> {
    try {
      const response = await this.client.get(`/api2/json/nodes/${node}/qemu/${vmid}/config`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get VM ${vmid} config: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get VM IP address from guest agent
   */
  async getVMIPAddress(node: string, vmid: number): Promise<string | null> {
    try {
      // Try to get IP from guest agent first
      const response = await this.client.get(`/api2/json/nodes/${node}/qemu/${vmid}/agent/network-get-interfaces`);
      const interfaces = response.data.data.result;
      
      // Look for the first non-loopback interface with an IP
      for (const iface of interfaces) {
        if (iface['ip-addresses'] && iface['ip-addresses'].length > 0) {
          for (const ip of iface['ip-addresses']) {
            if (ip['ip-address-type'] === 'ipv4' && !ip['ip-address'].startsWith('127.')) {
              return ip['ip-address'];
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      // Guest agent not available or VM not running
      return null;
    }
  }

  /**
   * Get container details
   */
  async getContainerDetails(node: string, vmid: number): Promise<any> {
    try {
      const response = await this.client.get(`/api2/json/nodes/${node}/lxc/${vmid}/status/current`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get container ${vmid} details: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Start a VM
   */
  async startVM(node: string, vmid: number): Promise<void> {
    try {
      await this.client.post(`/api2/json/nodes/${node}/qemu/${vmid}/status/start`);
    } catch (error) {
      throw new Error(`Failed to start VM ${vmid}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Stop a VM
   */
  async stopVM(node: string, vmid: number): Promise<void> {
    try {
      await this.client.post(`/api2/json/nodes/${node}/qemu/${vmid}/status/stop`);
    } catch (error) {
      throw new Error(`Failed to stop VM ${vmid}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Restart a VM
   */
  async restartVM(node: string, vmid: number): Promise<void> {
    try {
      await this.client.post(`/api2/json/nodes/${node}/qemu/${vmid}/status/reboot`);
    } catch (error) {
      throw new Error(`Failed to restart VM ${vmid}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Reset a VM (hard reboot)
   */
  async resetVM(node: string, vmid: number): Promise<void> {
    try {
      await this.client.post(`/api2/json/nodes/${node}/qemu/${vmid}/status/reset`);
    } catch (error) {
      throw new Error(`Failed to reset VM ${vmid}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Shutdown a VM (graceful shutdown)
   */
  async shutdownVM(node: string, vmid: number): Promise<void> {
    try {
      await this.client.post(`/api2/json/nodes/${node}/qemu/${vmid}/status/shutdown`);
    } catch (error) {
      throw new Error(`Failed to shutdown VM ${vmid}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get VM status
   */
  async getVMStatus(node: string, vmid: number): Promise<any> {
    try {
      const response = await this.client.get(`/api2/json/nodes/${node}/qemu/${vmid}/status/current`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get VM ${vmid} status: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Start a container
   */
  async startContainer(node: string, vmid: number): Promise<void> {
    try {
      await this.client.post(`/api2/json/nodes/${node}/lxc/${vmid}/status/start`);
    } catch (error) {
      throw new Error(`Failed to start container ${vmid}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Stop a container
   */
  async stopContainer(node: string, vmid: number): Promise<void> {
    try {
      await this.client.post(`/api2/json/nodes/${node}/lxc/${vmid}/status/stop`);
    } catch (error) {
      throw new Error(`Failed to stop container ${vmid}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Restart a container
   */
  async restartContainer(node: string, vmid: number): Promise<void> {
    try {
      await this.client.post(`/api2/json/nodes/${node}/lxc/${vmid}/status/reboot`);
    } catch (error) {
      throw new Error(`Failed to restart container ${vmid}: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get node statistics
   */
  async getNodeStats(node: string): Promise<any> {
    try {
      const response = await this.client.get(`/api2/json/nodes/${node}/status`);
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get node ${node} stats: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get cluster status
   */
  async getClusterStatus(): Promise<any> {
    try {
      const response = await this.client.get('/api2/json/cluster/status');
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to get cluster status: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Extract error message from axios error
   */
  private getErrorMessage(error: any): string {
    if (error.response) {
      // Server responded with error status
      const data = error.response.data;
      if (data && data.errors) {
        return data.errors.map((err: any) => err.message).join(', ');
      }
      return data?.message || `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      // Request was made but no response received
      return 'No response from server - check connection and credentials';
    } else {
      // Something else happened
      return error.message || 'Unknown error occurred';
    }
  }
}

export const createProxmoxClient = (
  host: string, 
  port?: number, 
  tokenId?: string, 
  tokenSecret?: string
): ProxmoxClient => {
  return new ProxmoxClient(host, port, tokenId, tokenSecret);
};
