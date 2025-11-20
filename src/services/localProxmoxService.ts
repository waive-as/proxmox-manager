import { storageService, ProxmoxServer } from '../lib/localStorage';

/**
 * LocalProxmox Service - Proxmox server management using localStorage only
 * Use this when backend is not available
 *
 * Note: This only handles server configuration storage.
 * Actual Proxmox API calls (VMs, nodes, etc.) require backend proxy.
 */
class LocalProxmoxService {
  /**
   * Get all configured Proxmox servers
   */
  async getServers(): Promise<ProxmoxServer[]> {
    try {
      return storageService.getServers();
    } catch (error) {
      console.error('Failed to get servers:', error);
      throw new Error('Failed to fetch servers');
    }
  }

  /**
   * Add a new Proxmox server
   */
  async addServer(serverData: {
    name: string;
    host: string;
    port: number;
    username: string;
    realm: string;
  }): Promise<ProxmoxServer> {
    try {
      // Check if server with same host already exists
      const existingServers = storageService.getServers();
      const duplicate = existingServers.find(
        s => s.host === serverData.host && s.port === serverData.port
      );

      if (duplicate) {
        throw new Error('A server with this host and port already exists');
      }

      const newServer = storageService.addServer({
        name: serverData.name,
        host: serverData.host,
        port: serverData.port,
        username: serverData.username,
        realm: serverData.realm,
        isActive: true,
      });

      return newServer;
    } catch (error: any) {
      console.error('Failed to add server:', error);
      throw error;
    }
  }

  /**
   * Update an existing Proxmox server
   */
  async updateServer(
    serverId: string,
    serverData: {
      name?: string;
      host?: string;
      port?: number;
      username?: string;
      realm?: string;
      isActive?: boolean;
    }
  ): Promise<ProxmoxServer> {
    try {
      const success = storageService.updateServer(serverId, serverData);

      if (!success) {
        throw new Error('Server not found');
      }

      const servers = storageService.getServers();
      const updatedServer = servers.find(s => s.id === serverId);

      if (!updatedServer) {
        throw new Error('Server not found after update');
      }

      return updatedServer;
    } catch (error: any) {
      console.error('Failed to update server:', error);
      throw error;
    }
  }

  /**
   * Delete a Proxmox server
   */
  async deleteServer(serverId: string): Promise<void> {
    try {
      const success = storageService.deleteServer(serverId);

      if (!success) {
        throw new Error('Server not found');
      }
    } catch (error: any) {
      console.error('Failed to delete server:', error);
      throw error;
    }
  }

  /**
   * Test connection to a Proxmox server
   * Note: This always fails in standalone mode since we need backend proxy
   */
  async testConnection(serverId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'Connection testing requires backend server to be running'
    };
  }

  /**
   * Get VMs from a specific server
   * Note: This always returns empty in standalone mode since we need backend proxy
   */
  async getVMs(serverId: string): Promise<any[]> {
    // In standalone mode, we can't actually fetch VMs from Proxmox
    // Return empty array instead of throwing error
    console.warn('VM fetching requires backend server. Returning empty array.');
    return [];
  }

  /**
   * Get nodes from a specific server
   * Note: This always returns empty in standalone mode since we need backend proxy
   */
  async getNodes(serverId: string): Promise<any[]> {
    console.warn('Node fetching requires backend server. Returning empty array.');
    return [];
  }

  /**
   * VM control operations - all require backend proxy
   */
  async startVM(serverId: string, node: string, vmid: number): Promise<void> {
    throw new Error('VM control requires backend server to be running');
  }

  async stopVM(serverId: string, node: string, vmid: number): Promise<void> {
    throw new Error('VM control requires backend server to be running');
  }

  async restartVM(serverId: string, node: string, vmid: number): Promise<void> {
    throw new Error('VM control requires backend server to be running');
  }

  async resetVM(serverId: string, node: string, vmid: number): Promise<void> {
    throw new Error('VM control requires backend server to be running');
  }

  async shutdownVM(serverId: string, node: string, vmid: number): Promise<void> {
    throw new Error('VM control requires backend server to be running');
  }
}

export const localProxmoxService = new LocalProxmoxService();
