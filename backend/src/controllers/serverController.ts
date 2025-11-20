import { Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler.js';
import { AppError } from '@/middleware/errorHandler.js';
import { AuthenticatedRequest } from '@/middleware/auth.js';
import { serverService } from '@/services/serverService.js';
import { ProxmoxClient } from '@/services/proxmoxService.js';

export const serverController = {
  getServers: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const servers = await serverService.getServersByUserId(userId);
    
    res.json({
      success: true,
      data: servers.map(server => ({
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        isActive: server.isActive,
        createdAt: server.createdAt.toISOString(),
        updatedAt: server.updatedAt.toISOString()
      }))
    });
  }),

  getServerById: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const server = await serverService.getServerById(id, userId);
    
    if (!server) {
      throw new AppError('Server not found', 404);
    }

    res.json({
      success: true,
      data: {
        id: server.id,
        name: server.name,
        host: server.host,
        port: server.port,
        isActive: server.isActive,
        createdAt: server.createdAt.toISOString(),
        updatedAt: server.updatedAt.toISOString()
      }
    });
  }),

  createServer: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, host, port, tokenId, tokenSecret, description } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Check if server already exists for this user
    const existingServer = await serverService.getServerByHostAndPort(host, port, userId);
    if (existingServer) {
      throw new AppError('Server with this host and port already exists', 400);
    }

    const newServer = await serverService.createServer({
      name,
      host,
      port,
      tokenId,
      tokenSecret,
      description,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Server created successfully',
      data: {
        id: newServer.id,
        name: newServer.name,
        host: newServer.host,
        port: newServer.port,
        isActive: newServer.isActive,
        createdAt: newServer.createdAt.toISOString(),
        updatedAt: newServer.updatedAt.toISOString()
      }
    });
  }),

  updateServer: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, host, port, tokenId, tokenSecret, description, isActive } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const server = await serverService.getServerById(id, userId);
    if (!server) {
      throw new AppError('Server not found', 404);
    }

    // Check if host/port combination already exists (if changed)
    if (host && port && (host !== server.host || port !== server.port)) {
      const existingServer = await serverService.getServerByHostAndPort(host, port, userId);
      if (existingServer && existingServer.id !== id) {
        throw new AppError('Server with this host and port already exists', 400);
      }
    }

    const updatedServer = await serverService.updateServer(id, {
      name,
      host,
      port,
      tokenId,
      tokenSecret,
      description,
      isActive
    });

    res.json({
      success: true,
      message: 'Server updated successfully',
      data: {
        id: updatedServer.id,
        name: updatedServer.name,
        host: updatedServer.host,
        port: updatedServer.port,
        isActive: updatedServer.isActive,
        createdAt: updatedServer.createdAt.toISOString(),
        updatedAt: updatedServer.updatedAt.toISOString()
      }
    });
  }),

  deleteServer: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const server = await serverService.getServerById(id, userId);
    if (!server) {
      throw new AppError('Server not found', 404);
    }

    await serverService.deleteServer(id);

    res.json({
      success: true,
      message: 'Server deleted successfully'
    });
  }),

  testConnection: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const server = await serverService.getServerById(id, userId);
    if (!server) {
      throw new AppError('Server not found', 404);
    }

    try {
      // Create Proxmox client and test connection
      const proxmoxClient = new ProxmoxClient(server.host, server.port, server.tokenId, server.tokenSecret);
      await proxmoxClient.authenticateWithToken();
      
      // Test by getting nodes
      await proxmoxClient.getNodes();

      res.json({
        success: true,
        message: 'Connection successful',
        data: {
          success: true,
          message: 'Successfully connected to Proxmox server'
        }
      });
    } catch (error: any) {
      console.error('Connection test failed:', error);
      
      res.json({
        success: true,
        message: 'Connection test completed',
        data: {
          success: false,
          message: error.message || 'Failed to connect to Proxmox server'
        }
      });
    }
  })
};
