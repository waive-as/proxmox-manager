import { Router } from 'express';
import { serverController } from '@/controllers/serverController.js';
import { authenticateToken, requireAdminOrReadonly } from '@/middleware/auth.js';
import { validateRequest } from '@/middleware/validation.js';
import { CreateServerSchema, UpdateServerSchema } from '@/types/schemas.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Server management routes
router.get('/', serverController.getServers);
router.get('/:id', serverController.getServerById);
router.post('/',
  requireAdminOrReadonly,
  validateRequest(CreateServerSchema),
  serverController.createServer
);
router.put('/:id',
  requireAdminOrReadonly,
  validateRequest(UpdateServerSchema),
  serverController.updateServer
);
router.delete('/:id', requireAdminOrReadonly, serverController.deleteServer);
router.post('/:id/test', requireAdminOrReadonly, serverController.testConnection);

export default router;
