import { Router } from 'express';
import { settingsController } from '@/controllers/settingsController.js';
import { authenticateToken, requireAdmin } from '@/middleware/auth.js';

const router = Router();

// Public route - get branding settings (needed before login)
router.get('/', settingsController.getSettings);

// Admin-only routes
router.put('/', authenticateToken, requireAdmin, settingsController.updateSettings);
router.post('/reset', authenticateToken, requireAdmin, settingsController.resetSettings);

export default router;
