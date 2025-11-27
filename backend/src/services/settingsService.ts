import prisma from './prisma.js';

export interface WhiteLabelConfig {
  companyName: string;
  logoData: string | null;
  faviconData: string | null;
  primaryColor: string | null;
  loginBackgroundData: string | null;
}

const DEFAULT_SETTINGS_ID = 'default';

const DEFAULT_CONFIG: WhiteLabelConfig = {
  companyName: 'Proxmox Manager Portal',
  logoData: null,
  faviconData: null,
  primaryColor: null,
  loginBackgroundData: null,
};

export const settingsService = {
  /**
   * Get current white label settings
   * Creates default settings if none exist
   */
  getSettings: async (): Promise<WhiteLabelConfig> => {
    try {
      let settings = await prisma.settings.findUnique({
        where: { id: DEFAULT_SETTINGS_ID }
      });

      // Create default settings if none exist
      if (!settings) {
        settings = await prisma.settings.create({
          data: {
            id: DEFAULT_SETTINGS_ID,
            companyName: DEFAULT_CONFIG.companyName,
          }
        });
      }

      return {
        companyName: settings.companyName,
        logoData: settings.logoData,
        faviconData: settings.faviconData,
        primaryColor: settings.primaryColor,
        loginBackgroundData: settings.loginBackgroundData,
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return DEFAULT_CONFIG;
    }
  },

  /**
   * Update white label settings
   */
  updateSettings: async (config: Partial<WhiteLabelConfig>): Promise<WhiteLabelConfig> => {
    try {
      const settings = await prisma.settings.upsert({
        where: { id: DEFAULT_SETTINGS_ID },
        update: {
          ...(config.companyName !== undefined && { companyName: config.companyName }),
          ...(config.logoData !== undefined && { logoData: config.logoData }),
          ...(config.faviconData !== undefined && { faviconData: config.faviconData }),
          ...(config.primaryColor !== undefined && { primaryColor: config.primaryColor }),
          ...(config.loginBackgroundData !== undefined && { loginBackgroundData: config.loginBackgroundData }),
        },
        create: {
          id: DEFAULT_SETTINGS_ID,
          companyName: config.companyName ?? DEFAULT_CONFIG.companyName,
          logoData: config.logoData ?? null,
          faviconData: config.faviconData ?? null,
          primaryColor: config.primaryColor ?? null,
          loginBackgroundData: config.loginBackgroundData ?? null,
        }
      });

      return {
        companyName: settings.companyName,
        logoData: settings.logoData,
        faviconData: settings.faviconData,
        primaryColor: settings.primaryColor,
        loginBackgroundData: settings.loginBackgroundData,
      };
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  /**
   * Reset settings to defaults
   */
  resetSettings: async (): Promise<WhiteLabelConfig> => {
    try {
      const settings = await prisma.settings.upsert({
        where: { id: DEFAULT_SETTINGS_ID },
        update: {
          companyName: DEFAULT_CONFIG.companyName,
          logoData: null,
          faviconData: null,
          primaryColor: null,
          loginBackgroundData: null,
        },
        create: {
          id: DEFAULT_SETTINGS_ID,
          companyName: DEFAULT_CONFIG.companyName,
        }
      });

      return {
        companyName: settings.companyName,
        logoData: settings.logoData,
        faviconData: settings.faviconData,
        primaryColor: settings.primaryColor,
        loginBackgroundData: settings.loginBackgroundData,
      };
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }
};
