import { Router } from 'express';
import { proxmoxController } from '@/controllers/proxmoxController.js';
import { authenticateToken, requireAdminOrReadonly } from '@/middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Proxmox API proxy routes
router.get('/servers/:serverId/nodes', requireAdminOrReadonly, proxmoxController.getNodes);
router.get('/servers/:serverId/vms', requireAdminOrReadonly, proxmoxController.getVMs);
router.get('/servers/:serverId/vms/:vmid', requireAdminOrReadonly, proxmoxController.getVMDetails);
router.post('/servers/:serverId/vms/:vmid/start', requireAdminOrReadonly, proxmoxController.startVM);
router.post('/servers/:serverId/vms/:vmid/stop', requireAdminOrReadonly, proxmoxController.stopVM);
router.post('/servers/:serverId/vms/:vmid/restart', requireAdminOrReadonly, proxmoxController.restartVM);
router.post('/servers/:serverId/vms/:vmid/reset', requireAdminOrReadonly, proxmoxController.resetVM);
router.post('/servers/:serverId/vms/:vmid/shutdown', requireAdminOrReadonly, proxmoxController.shutdownVM);
router.get('/servers/:serverId/stats', requireAdminOrReadonly, proxmoxController.getServerStats);

export default router;
