
import { toast } from "sonner";
import { ServerConnection } from "@/hooks/use-server-connections";

// Interface for Proxmox API Authentication response
interface ProxmoxAuthResponse {
  data?: {
    ticket: string;
    CSRFPreventionToken?: string;
    username?: string;
  };
  status?: {
    code: number;
    ok: boolean;
  };
}

/**
 * Handles connections and API calls to Proxmox VE servers
 */
export class ProxmoxApiService {
  // Base URL for a proxy if being used (empty by default for direct connections)
  private static proxyUrl = '';

  /**
   * Configure the proxy URL for all API requests
   * @param url The proxy URL to use for all requests
   */
  static setProxyUrl(url: string) {
    this.proxyUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  /**
   * Get the full API URL, using proxy if configured
   * @param server The server connection details
   * @param endpoint The API endpoint path
   * @returns The complete URL to use for the API request
   */
  private static getApiUrl(server: ServerConnection, endpoint: string): string {
    // If proxy is configured, use it
    if (this.proxyUrl) {
      // If using our custom proxy server
      if (this.proxyUrl.includes('/api/')) {
        return `${this.proxyUrl}/api/${server.id}${endpoint}`;
      }
      
      // If using a reverse proxy, assume it's configured to handle the API path
      return `${this.proxyUrl}/api/proxmox${endpoint}`;
    }
    
    // Otherwise use direct connection
    return `https://${server.host}:${server.port}${endpoint}`;
  }

  /**
   * Tests the connection to a Proxmox server
   * @param server The server connection details
   * @returns True if connection successful, false otherwise
   */
  static async testConnection(server: ServerConnection): Promise<boolean> {
    try {
      const { username, password } = server;
      
      // Use the API URL helper to generate the appropriate URL
      const apiUrl = this.getApiUrl(server, '/api2/json/access/ticket');
      
      console.log('Testing connection to:', apiUrl);
      
      // Prepare form data for Proxmox authentication
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password || '');
      
      // Attempt to authenticate with Proxmox
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      // Check if authentication was successful
      if (response.ok) {
        const data = await response.json();
        if (data && data.data && data.data.ticket) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Proxmox connection test failed:", error);
      return false;
    }
  }
  
  /**
   * Authenticate with a Proxmox server and get authentication ticket
   * @param server The server connection details
   * @returns Authentication response with ticket and CSRF token
   */
  static async authenticate(server: ServerConnection): Promise<ProxmoxAuthResponse> {
    try {
      const { username, password } = server;
      
      const apiUrl = this.getApiUrl(server, '/api2/json/access/ticket');
      
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password || '');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          data: data.data,
          status: {
            code: response.status,
            ok: true
          }
        };
      }
      
      return {
        status: {
          code: response.status,
          ok: false
        }
      };
    } catch (error) {
      console.error("Proxmox authentication failed:", error);
      return {
        status: {
          code: 500,
          ok: false
        }
      };
    }
  }

  /**
   * Get nodes from a Proxmox server
   * @param server The server connection details
   * @param ticket Authentication ticket
   * @returns List of Proxmox nodes
   */
  static async getNodes(server: ServerConnection, ticket: string): Promise<any[]> {
    try {
      const apiUrl = this.getApiUrl(server, '/api2/json/nodes');
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cookie': `PVEAuthCookie=${ticket}`
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data || [];
      }
      
      return [];
    } catch (error) {
      console.error("Failed to get Proxmox nodes:", error);
      return [];
    }
  }
}
