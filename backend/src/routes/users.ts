import { Router } from 'express';
import { userController } from '@/controllers/userController.js';
import { authenticateToken, requireAdmin } from '@/middleware/auth.js';
import { validateRequest } from '@/middleware/validation.js';
import { CreateUserSchema, UpdateUserSchema, ToggleUserStatusSchema } from '@/types/schemas.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// User profile routes (any authenticated user)
router.get('/profile', userController.getProfile);
router.put('/profile', 
  validateRequest(UpdateUserSchema),
  userController.updateProfile
);

// Admin-only user management routes
router.get('/', requireAdmin, userController.getAllUsers);
router.post('/', 
  requireAdmin,
  validateRequest(CreateUserSchema),
  userController.createUser
);
router.put('/:id', 
  requireAdmin,
  validateRequest(UpdateUserSchema),
  userController.updateUser
);
router.delete('/:id', requireAdmin, userController.deleteUser);
router.put('/:id/status', 
  requireAdmin,
  validateRequest(ToggleUserStatusSchema),
  userController.toggleUserStatus
);

export default router;
