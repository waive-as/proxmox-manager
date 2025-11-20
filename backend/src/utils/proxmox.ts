import axios, { AxiosInstance } from 'axios';
import { config } from '@/config/index.js';

export class ProxmoxAPI {
  private client: AxiosInstance;
  private baseUrl: string;
  private ticket?: string;
  private csrfToken?: string;

  constructor(host: string, port: number = config.proxmoxDefaultPort, allowInsecure: boolean = false) {
    this.baseUrl = `https://${host}:${port}`;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.proxmoxTimeout,
      httpsAgent: new (require('https').Agent)({
        // SECURITY: Only allow insecure connections if explicitly enabled
        // For self-signed certificates, set allowInsecure=true when creating the client
        // In production with valid certificates, this should be false (default)
        rejectUnauthorized: !allowInsecure
      })
    });
  }

  async authenticate(username: string, password: string): Promise<void> {
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
      throw new Error(`Authentication failed: ${error}`);
    }
  }

  async getNodes(): Promise<any[]> {
    const response = await this.client.get('/api2/json/cluster/status');
    return response.data.data;
  }

  async getVMs(node: string): Promise<any[]> {
    const response = await this.client.get(`/api2/json/nodes/${node}/qemu`);
    return response.data.data;
  }

  async getVMDetails(node: string, vmid: number): Promise<any> {
    const response = await this.client.get(`/api2/json/nodes/${node}/qemu/${vmid}/status/current`);
    return response.data.data;
  }

  async startVM(node: string, vmid: number): Promise<void> {
    await this.client.post(`/api2/json/nodes/${node}/qemu/${vmid}/status/start`);
  }

  async stopVM(node: string, vmid: number): Promise<void> {
    await this.client.post(`/api2/json/nodes/${node}/qemu/${vmid}/status/stop`);
  }

  async restartVM(node: string, vmid: number): Promise<void> {
    await this.client.post(`/api2/json/nodes/${node}/qemu/${vmid}/status/reboot`);
  }

  async getNodeStats(node: string): Promise<any> {
    const response = await this.client.get(`/api2/json/nodes/${node}/status`);
    return response.data.data;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/api2/json/version');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const createProxmoxClient = (host: string, port?: number, allowInsecure?: boolean): ProxmoxAPI => {
  return new ProxmoxAPI(host, port, allowInsecure);
};
