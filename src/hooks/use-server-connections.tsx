
import { useState, useEffect } from "react";
import { ProxmoxApiService } from "@/services/proxmoxApi";

// Define the server connection type
export interface ServerConnection {
  id: string;
  name: string;
  host: string;
  port: string;
  username: string;
  password?: string;
  status: "online" | "offline" | "unknown";
}

// Hook to manage server connections
export const useServerConnections = () => {
  const [servers, setServers] = useState<ServerConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load servers from localStorage on mount
  useEffect(() => {
    const storedServers = localStorage.getItem("proxmoxServers");
    if (storedServers) {
      try {
        setServers(JSON.parse(storedServers));
      } catch (error) {
        console.error("Failed to parse stored servers:", error);
      }
    }
    
    // Check if a proxy URL is stored
    const storedProxyUrl = localStorage.getItem("proxmoxProxyUrl");
    if (storedProxyUrl) {
      ProxmoxApiService.setProxyUrl(storedProxyUrl);
    }
  }, []);

  // Update localStorage when servers change
  useEffect(() => {
    localStorage.setItem("proxmoxServers", JSON.stringify(servers));
  }, [servers]);

  // Add a new server
  const addServer = (server: ServerConnection) => {
    setServers(prev => [...prev, server]);
  };

  // Update an existing server
  const updateServer = (id: string, data: Partial<ServerConnection>) => {
    setServers(prev => 
      prev.map(server => 
        server.id === id ? { ...server, ...data } : server
      )
    );
  };

  // Remove a server
  const removeServer = (id: string) => {
    setServers(prev => prev.filter(server => server.id !== id));
  };

  // Set proxy URL for development/testing purposes
  const setProxyUrl = (url: string) => {
    ProxmoxApiService.setProxyUrl(url);
    localStorage.setItem("proxmoxProxyUrl", url);
  };

  // Test connection to a server using the real Proxmox API
  const testConnection = async (id: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Find the server
      const server = servers.find(s => s.id === id);
      if (!server) {
        return false;
      }
      
      // Test connection using the Proxmox API service
      const success = await ProxmoxApiService.testConnection(server);
      
      // Update server status
      updateServer(id, { status: success ? "online" : "offline" });
      
      return success;
    } catch (error) {
      console.error("Connection test failed:", error);
      updateServer(id, { status: "offline" });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    servers,
    addServer,
    updateServer,
    removeServer,
    testConnection,
    setProxyUrl,
    isLoading
  };
};
