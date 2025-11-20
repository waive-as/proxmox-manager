import api from '../lib/api';

// TypeScript interfaces
export interface ProxmoxServer {
  id: string;
  name: string;
  host: string;
  port: number;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddServerDto {
  name: string;
  host: string;
  port: number;
  tokenId: string;
  tokenSecret: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

class ProxmoxService {
  /**
   * Get all configured Proxmox servers
   */
  async getServers(): Promise<ProxmoxServer[]> {
    try {
      const response = await api.get<{
        success: boolean;
        data: ProxmoxServer[];
      }>('/servers');

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to fetch servers');
      }
    }
  }

  /**
   * Add a new Proxmox server
   */
  async addServer(serverData: AddServerDto): Promise<ProxmoxServer> {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data: ProxmoxServer;
      }>('/servers', serverData);

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to add server');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data.message || 'Invalid server data';
        throw new Error(errorMessage);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to add server');
      }
    }
  }

  /**
   * Update an existing Proxmox server
   */
  async updateServer(serverId: string, serverData: Partial<AddServerDto>): Promise<ProxmoxServer> {
    try {
      const response = await api.put<{
        success: boolean;
        message: string;
        data: ProxmoxServer;
      }>(`/servers/${serverId}`, serverData);

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update server');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 404) {
        throw new Error('Server not found');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data.message || 'Invalid server data';
        throw new Error(errorMessage);
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to update server');
      }
    }
  }

  /**
   * Delete a Proxmox server
   */
  async deleteServer(serverId: string): Promise<void> {
    try {
      const response = await api.delete<{
        success: boolean;
        message: string;
      }>(`/servers/${serverId}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete server');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 404) {
        throw new Error('Server not found');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to delete server');
      }
    }
  }

  /**
   * Test connection to a Proxmox server
   */
  async testConnection(serverId: string): Promise<TestConnectionResult> {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
        data?: {
          success: boolean;
          message: string;
        };
      }>(`/servers/${serverId}/test`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Connection test failed');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 404) {
        throw new Error('Server not found');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Connection test failed');
      }
    }
  }

  /**
   * Get VMs from a specific server
   */
  async getVMs(serverId: string): Promise<any[]> {
    try {
      const response = await api.get<{
        success: boolean;
        data: any[];
      }>(`/proxmox/servers/${serverId}/vms`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 404) {
        throw new Error('Server not found');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to fetch VMs');
      }
    }
  }

  /**
   * Get nodes from a specific server
   */
  async getNodes(serverId: string): Promise<any[]> {
    try {
      const response = await api.get<{
        success: boolean;
        data: any[];
      }>(`/proxmox/servers/${serverId}/nodes`);

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 404) {
        throw new Error('Server not found');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to fetch nodes');
      }
    }
  }

  /**
   * Start a VM
   */
  async startVM(serverId: string, node: string, vmid: number): Promise<void> {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
      }>(`/proxmox/servers/${serverId}/vms/${vmid}/start`, { node });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to start VM');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 404) {
        throw new Error('VM not found');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to start VM');
      }
    }
  }

  /**
   * Stop a VM
   */
  async stopVM(serverId: string, node: string, vmid: number): Promise<void> {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
      }>(`/proxmox/servers/${serverId}/vms/${vmid}/stop`, { node });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to stop VM');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 404) {
        throw new Error('VM not found');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to stop VM');
      }
    }
  }

  /**
   * Restart a VM
   */
  async restartVM(serverId: string, node: string, vmid: number): Promise<void> {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
      }>(`/proxmox/servers/${serverId}/vms/${vmid}/restart`, { node });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to restart VM');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 404) {
        throw new Error('VM not found');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to restart VM');
      }
    }
  }

  /**
   * Reset a VM (hard reboot)
   */
  async resetVM(serverId: string, node: string, vmid: number): Promise<void> {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
      }>(`/proxmox/servers/${serverId}/vms/${vmid}/reset`, { node });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to reset VM');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 404) {
        throw new Error('VM not found');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to reset VM');
      }
    }
  }

  /**
   * Shutdown a VM (graceful shutdown)
   */
  async shutdownVM(serverId: string, node: string, vmid: number): Promise<void> {
    try {
      const response = await api.post<{
        success: boolean;
        message: string;
      }>(`/proxmox/servers/${serverId}/vms/${vmid}/shutdown`, { node });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to shutdown VM');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication required');
      } else if (error.response?.status === 404) {
        throw new Error('VM not found');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Failed to shutdown VM');
      }
    }
  }
}

export const proxmoxService = new ProxmoxService();
