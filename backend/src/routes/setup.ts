import { Router } from 'express';
import { checkSetupStatus, initializeSetup } from '@/controllers/setupController.js';
import { asyncHandler } from '@/middleware/asyncHandler.js';

const router = Router();

/**
 * GET /api/setup/status
 * Check if initial setup is needed
 */
router.get('/status', asyncHandler(checkSetupStatus));

/**
 * POST /api/setup/initialize
 * Initialize the application with first admin user
 * Body: { email, password, name }
 */
router.post('/initialize', asyncHandler(initializeSetup));

export default router;
