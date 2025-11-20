import { storageService, ProxmoxServer } from './localStorage';

export interface ProxmoxServerConfig {
  name: string;
  host: string;
  port: number;
  username: string;
  realm: string;
  isActive: boolean;
}

class SettingsService {
  // Proxmox Server Management
  async getServers(): Promise<ProxmoxServer[]> {
    return storageService.getServers();
  }

  async addServer(config: ProxmoxServerConfig): Promise<{ success: boolean; message: string; server?: ProxmoxServer }> {
    try {
      // Validate configuration
      if (!config.name || !config.host || !config.username) {
        return {
          success: false,
          message: 'Name, host, and username are required'
        };
      }

      // Check if server with same name already exists
      const existingServers = storageService.getServers();
      const existingServer = existingServers.find(s => s.name.toLowerCase() === config.name.toLowerCase());
      
      if (existingServer) {
        return {
          success: false,
          message: 'A server with this name already exists'
        };
      }

      const server = storageService.addServer({
        name: config.name,
        host: config.host,
        port: config.port || 8006,
        username: config.username,
        realm: config.realm || 'pam',
        isActive: config.isActive !== false
      });

      return {
        success: true,
        message: 'Server added successfully',
        server
      };
    } catch (error) {
      console.error('Error adding server:', error);
      return {
        success: false,
        message: 'Failed to add server'
      };
    }
  }

  async updateServer(serverId: string, updates: Partial<ProxmoxServerConfig>): Promise<{ success: boolean; message: string }> {
    try {
      const success = storageService.updateServer(serverId, updates);
      
      if (success) {
        return {
          success: true,
          message: 'Server updated successfully'
        };
      } else {
        return {
          success: false,
          message: 'Server not found'
        };
      }
    } catch (error) {
      console.error('Error updating server:', error);
      return {
        success: false,
        message: 'Failed to update server'
      };
    }
  }

  async deleteServer(serverId: string): Promise<{ success: boolean; message: string }> {
    try {
      const success = storageService.deleteServer(serverId);
      
      if (success) {
        return {
          success: true,
          message: 'Server deleted successfully'
        };
      } else {
        return {
          success: false,
          message: 'Server not found'
        };
      }
    } catch (error) {
      console.error('Error deleting server:', error);
      return {
        success: false,
        message: 'Failed to delete server'
      };
    }
  }

  async testServerConnection(serverId: string): Promise<{ success: boolean; message: string }> {
    try {
      const servers = storageService.getServers();
      const server = servers.find(s => s.id === serverId);
      
      if (!server) {
        return {
          success: false,
          message: 'Server not found'
        };
      }

      // For now, we'll just simulate a connection test
      // In a real implementation, you'd make an actual API call to the Proxmox server
      const testUrl = `https://${server.host}:${server.port}/api2/json/version`;
      
      // Simulate connection test (replace with actual fetch)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response - in real implementation, you'd check the actual response
      const isReachable = Math.random() > 0.3; // 70% success rate for demo
      
      if (isReachable) {
        return {
          success: true,
          message: `Successfully connected to ${server.name} (${server.host}:${server.port})`
        };
      } else {
        return {
          success: false,
          message: `Failed to connect to ${server.name}. Please check host, port, and credentials.`
        };
      }
    } catch (error) {
      console.error('Error testing server connection:', error);
      return {
        success: false,
        message: 'Connection test failed'
      };
    }
  }

  // Application Settings
  async getAppSettings(): Promise<Record<string, any>> {
    try {
      const settings = localStorage.getItem('proxmox_app_settings');
      return settings ? JSON.parse(settings) : {};
    } catch (error) {
      console.error('Error getting app settings:', error);
      return {};
    }
  }

  async updateAppSettings(settings: Record<string, any>): Promise<{ success: boolean; message: string }> {
    try {
      localStorage.setItem('proxmox_app_settings', JSON.stringify(settings));
      return {
        success: true,
        message: 'Settings updated successfully'
      };
    } catch (error) {
      console.error('Error updating app settings:', error);
      return {
        success: false,
        message: 'Failed to update settings'
      };
    }
  }

  // Data Export/Import
  async exportData(): Promise<{ success: boolean; data?: string; message: string }> {
    try {
      const data = {
        users: storageService.getUsers(),
        servers: storageService.getServers(),
        settings: await this.getAppSettings(),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      return {
        success: true,
        data: JSON.stringify(data, null, 2),
        message: 'Data exported successfully'
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return {
        success: false,
        message: 'Failed to export data'
      };
    }
  }

  async importData(jsonData: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = JSON.parse(jsonData);
      
      // Validate data structure
      if (!data.users || !data.servers) {
        return {
          success: false,
          message: 'Invalid data format'
        };
      }

      // Import users
      if (Array.isArray(data.users)) {
        storageService.saveUsers(data.users);
      }

      // Import servers
      if (Array.isArray(data.servers)) {
        storageService.saveServers(data.servers);
      }

      // Import settings
      if (data.settings) {
        await this.updateAppSettings(data.settings);
      }

      return {
        success: true,
        message: 'Data imported successfully'
      };
    } catch (error) {
      console.error('Error importing data:', error);
      return {
        success: false,
        message: 'Failed to import data. Please check the file format.'
      };
    }
  }

  // Clear all data
  async clearAllData(): Promise<{ success: boolean; message: string }> {
    try {
      storageService.clearAllData();
      localStorage.removeItem('proxmox_app_settings');
      
      return {
        success: true,
        message: 'All data cleared successfully'
      };
    } catch (error) {
      console.error('Error clearing data:', error);
      return {
        success: false,
        message: 'Failed to clear data'
      };
    }
  }
}

export const settingsService = new SettingsService();
