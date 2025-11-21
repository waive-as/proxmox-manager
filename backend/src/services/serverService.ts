import prisma from './prisma.js';

export interface ProxmoxServer {
  id: string;
  name: string;
  host: string;
  port: number;
  tokenId: string;
  tokenSecret: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface CreateServerData {
  name: string;
  host: string;
  port: number;
  tokenId: string;
  tokenSecret: string;
  description?: string;
  userId: string;
}

export interface UpdateServerData {
  name?: string;
  host?: string;
  port?: number;
  tokenId?: string;
  tokenSecret?: string;
  description?: string;
  isActive?: boolean;
}

export const serverService = {
  getServersByUserId: async (userId: string): Promise<ProxmoxServer[]> => {
    try {
      const servers = await prisma.proxmoxServer.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      
      return servers.map((server: any) => ({
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        tokenId: server.tokenId,
        tokenSecret: server.tokenSecret,
        isActive: server.isActive,
        createdAt: server.createdAt,
        updatedAt: server.updatedAt,
        userId: server.userId
      }));
    } catch (error) {
      console.error('Error finding servers by user ID:', error);
      return [];
    }
  },

  getServerById: async (id: string, userId: string): Promise<ProxmoxServer | null> => {
    try {
      const server = await prisma.proxmoxServer.findFirst({
        where: { id, userId }
      });
      
      if (!server) return null;
      
      return {
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        tokenId: server.tokenId,
        tokenSecret: server.tokenSecret,
        isActive: server.isActive,
        createdAt: server.createdAt,
        updatedAt: server.updatedAt,
        userId: server.userId
      };
    } catch (error) {
      console.error('Error finding server by ID:', error);
      return null;
    }
  },

  getServerByHostAndPort: async (host: string, port: number, userId: string): Promise<ProxmoxServer | null> => {
    try {
      const server = await prisma.proxmoxServer.findFirst({
        where: { host, port, userId }
      });
      
      if (!server) return null;
      
      return {
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        tokenId: server.tokenId,
        tokenSecret: server.tokenSecret,
        isActive: server.isActive,
        createdAt: server.createdAt,
        updatedAt: server.updatedAt,
        userId: server.userId
      };
    } catch (error) {
      console.error('Error finding server by host and port:', error);
      return null;
    }
  },

  createServer: async (serverData: CreateServerData): Promise<ProxmoxServer> => {
    try {
      const server = await prisma.proxmoxServer.create({
        data: {
          name: serverData.name,
          host: serverData.host,
          port: serverData.port,
          username: '', // Empty for token-based auth
          tokenId: serverData.tokenId,
          tokenSecret: serverData.tokenSecret,
          isActive: true,
          userId: serverData.userId
        }
      });
      
      return {
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        tokenId: server.tokenId,
        tokenSecret: server.tokenSecret,
        isActive: server.isActive,
        createdAt: server.createdAt,
        updatedAt: server.updatedAt,
        userId: server.userId
      };
    } catch (error) {
      console.error('Error creating server:', error);
      throw error;
    }
  },

  updateServer: async (id: string, updates: UpdateServerData): Promise<ProxmoxServer> => {
    try {
      const server = await prisma.proxmoxServer.update({
        where: { id },
        data: {
          name: updates.name,
          host: updates.host,
          port: updates.port,
          tokenId: updates.tokenId,
          tokenSecret: updates.tokenSecret,
          isActive: updates.isActive
        }
      });
      
      return {
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        tokenId: server.tokenId,
        tokenSecret: server.tokenSecret,
        isActive: server.isActive,
        createdAt: server.createdAt,
        updatedAt: server.updatedAt,
        userId: server.userId
      };
    } catch (error) {
      console.error('Error updating server:', error);
      throw error;
    }
  },

  deleteServer: async (id: string): Promise<void> => {
    try {
      await prisma.proxmoxServer.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Error deleting server:', error);
      throw error;
    }
  }
};
