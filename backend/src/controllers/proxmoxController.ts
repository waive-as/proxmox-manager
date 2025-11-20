import { Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler.js';
import { AuthenticatedRequest } from '@/middleware/auth.js';
import { createProxmoxClient } from '@/services/proxmoxService.js';
import { serverService } from '@/services/serverService.js';

export const proxmoxController = {
  getNodes: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { serverId } = req.params;
    
    // Get server details from database
    const server = await serverService.findById(serverId);
    if (!server || !server.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Server not found or inactive'
      });
    }

    try {
      // Create Proxmox client and authenticate
      const client = createProxmoxClient(server.host, server.port, server.tokenId, server.tokenSecret);
      await client.authenticateWithToken();
      
      // Get nodes from Proxmox
      const nodes = await client.getNodes();
      
      res.json({
        success: true,
        data: nodes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get nodes'
      });
    }
  }),

  getVMs: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { serverId } = req.params;
    
    // Get server details from database
    const server = await serverService.getServerById(serverId, req.user!.userId);
    if (!server || !server.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Server not found or inactive'
      });
    }

    try {
      // Create Proxmox client and authenticate
      const client = createProxmoxClient(server.host, server.port, server.tokenId, server.tokenSecret);
      await client.authenticateWithToken();
      
      // Get all nodes first
      const nodes = await client.getNodes();
      const allVMs = [];
      
      // Get VMs from each node
      for (const node of nodes) {
        try {
          const nodeVMs = await client.getVMs(node.node);
          // Add node information to each VM
          const vmsWithNode = nodeVMs.map((vm: any) => ({
            ...vm,
            node: node.node
          }));
          allVMs.push(...vmsWithNode);
        } catch (error) {
          console.error(`Failed to get VMs from node ${node.node}:`, error);
          // Continue with other nodes even if one fails
        }
      }
      
      res.json({
        success: true,
        data: allVMs
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get VMs'
      });
    }
  }),

  getVMDetails: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { serverId, vmid } = req.params;
    const { node } = req.query;
    
    if (!node) {
      return res.status(400).json({
        success: false,
        message: 'Node parameter is required'
      });
    }

    // Get server details from database
    const server = await serverService.findById(serverId);
    if (!server || !server.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Server not found or inactive'
      });
    }

    try {
      // Create Proxmox client and authenticate
      const client = createProxmoxClient(server.host, server.port, server.tokenId, server.tokenSecret);
      await client.authenticateWithToken();
      
      // Get VM details from Proxmox
      const vmDetails = await client.getVMDetails(node as string, parseInt(vmid));
      
      res.json({
        success: true,
        data: vmDetails
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get VM details'
      });
    }
  }),

  startVM: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { serverId, vmid } = req.params;
    const { node } = req.body;
    
    if (!node) {
      return res.status(400).json({
        success: false,
        message: 'Node parameter is required'
      });
    }

    // Get server details from database
    const server = await serverService.getServerById(serverId, req.user!.userId);
    if (!server || !server.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Server not found or inactive'
      });
    }

    try {
      // Create Proxmox client and authenticate
      const client = createProxmoxClient(server.host, server.port, server.tokenId, server.tokenSecret);
      await client.authenticateWithToken();
      
      // Start VM
      await client.startVM(node, parseInt(vmid));
      
      res.json({
        success: true,
        message: `VM ${vmid} started successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start VM'
      });
    }
  }),

  stopVM: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { serverId, vmid } = req.params;
    const { node } = req.body;
    
    if (!node) {
      return res.status(400).json({
        success: false,
        message: 'Node parameter is required'
      });
    }

    // Get server details from database
    const server = await serverService.getServerById(serverId, req.user!.userId);
    if (!server || !server.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Server not found or inactive'
      });
    }

    try {
      // Create Proxmox client and authenticate
      const client = createProxmoxClient(server.host, server.port, server.tokenId, server.tokenSecret);
      await client.authenticateWithToken();
      
      // Stop VM
      await client.stopVM(node, parseInt(vmid));
      
      res.json({
        success: true,
        message: `VM ${vmid} stopped successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to stop VM'
      });
    }
  }),

  restartVM: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { serverId, vmid } = req.params;
    const { node } = req.body;
    
    if (!node) {
      return res.status(400).json({
        success: false,
        message: 'Node parameter is required'
      });
    }
    
    // Get server details from database
    const server = await serverService.getServerById(serverId, req.user!.userId);
    if (!server || !server.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Server not found or inactive'
      });
    }

    try {
      // Create Proxmox client and authenticate
      const client = createProxmoxClient(server.host, server.port, server.tokenId, server.tokenSecret);
      await client.authenticateWithToken();
      
      // Restart VM
      await client.restartVM(node, parseInt(vmid));
      
      res.json({
        success: true,
        message: `VM ${vmid} restarted successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to restart VM'
      });
    }
  }),

  resetVM: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { serverId, vmid } = req.params;
    const { node } = req.body;
    
    if (!node) {
      return res.status(400).json({
        success: false,
        message: 'Node parameter is required'
      });
    }
    
    // Get server details from database
    const server = await serverService.getServerById(serverId, req.user!.userId);
    if (!server || !server.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Server not found or inactive'
      });
    }

    try {
      // Create Proxmox client and authenticate
      const client = createProxmoxClient(server.host, server.port, server.tokenId, server.tokenSecret);
      await client.authenticateWithToken();
      
      // Reset VM (hard reboot)
      await client.resetVM(node, parseInt(vmid));
      
      res.json({
        success: true,
        message: `VM ${vmid} reset successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reset VM'
      });
    }
  }),

  shutdownVM: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { serverId, vmid } = req.params;
    const { node } = req.body;
    
    if (!node) {
      return res.status(400).json({
        success: false,
        message: 'Node parameter is required'
      });
    }
    
    // Get server details from database
    const server = await serverService.getServerById(serverId, req.user!.userId);
    if (!server || !server.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Server not found or inactive'
      });
    }

    try {
      // Create Proxmox client and authenticate
      const client = createProxmoxClient(server.host, server.port, server.tokenId, server.tokenSecret);
      await client.authenticateWithToken();
      
      // Shutdown VM (graceful shutdown)
      await client.shutdownVM(node, parseInt(vmid));
      
      res.json({
        success: true,
        message: `VM ${vmid} shutdown successfully`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to shutdown VM'
      });
    }
  }),

  getServerStats: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { serverId } = req.params;
    
    // Get server details from database
    const server = await serverService.findById(serverId);
    if (!server || !server.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Server not found or inactive'
      });
    }

    try {
      // Create Proxmox client and authenticate
      const client = createProxmoxClient(server.host, server.port, server.tokenId, server.tokenSecret);
      await client.authenticateWithToken();
      
      // Get cluster status
      const clusterStatus = await client.getClusterStatus();
      
      res.json({
        success: true,
        data: clusterStatus
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get server stats'
      });
    }
  })
};
