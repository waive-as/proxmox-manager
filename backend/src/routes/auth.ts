import { Router } from 'express';
import { authController } from '@/controllers/authController.js';
import { validateRequest } from '@/middleware/validation.js';
import { authRateLimiter } from '@/middleware/rateLimiter.js';
import { LoginSchema, CreateUserSchema } from '@/types/schemas.js';

const router = Router();

// Auth routes
router.post('/login', 
  authRateLimiter,
  validateRequest(LoginSchema),
  authController.login
);

router.post('/register',
  validateRequest(CreateUserSchema),
  authController.register
);

router.post('/logout',
  authController.logout
);

router.post('/refresh',
  authController.refreshToken
);

router.post('/forgot-password',
  authController.forgotPassword
);

router.post('/reset-password',
  authController.resetPassword
);

export default router;
