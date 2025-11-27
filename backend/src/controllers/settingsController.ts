import { Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler.js';
import { AuthenticatedRequest } from '@/middleware/auth.js';
import { settingsService } from '@/services/settingsService.js';

export const settingsController = {
  /**
   * Get white label settings (public - no auth required for branding)
   */
  getSettings: asyncHandler(async (_req: Request, res: Response) => {
    const settings = await settingsService.getSettings();

    res.json({
      success: true,
      data: settings
    });
  }),

  /**
   * Update white label settings (admin only)
   */
  updateSettings: asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { companyName, logoData, faviconData, primaryColor, loginBackgroundData } = req.body;

    const settings = await settingsService.updateSettings({
      companyName,
      logoData,
      faviconData,
      primaryColor,
      loginBackgroundData,
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  }),

  /**
   * Reset settings to defaults (admin only)
   */
  resetSettings: asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const settings = await settingsService.resetSettings();

    res.json({
      success: true,
      message: 'Settings reset to defaults',
      data: settings
    });
  })
};
