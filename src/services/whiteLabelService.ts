/**
 * White Label Service - Manages branding and customization
 * Now uses server-side storage instead of localStorage
 */

import { api } from '@/lib/api';

export interface WhiteLabelConfig {
  companyName: string;
  logoUrl: string | null;      // Kept for backward compatibility in UI
  logoData: string | null;     // Base64 data from server
  faviconUrl: string | null;   // Kept for backward compatibility in UI
  faviconData: string | null;  // Base64 data from server
  primaryColor?: string | null;
  loginBackgroundUrl?: string | null;  // Kept for backward compatibility
  loginBackgroundData?: string | null; // Base64 data from server
}

const DEFAULT_CONFIG: WhiteLabelConfig = {
  companyName: 'Proxmox Manager Portal',
  logoUrl: null,
  logoData: null,
  faviconUrl: null,
  faviconData: null,
  primaryColor: undefined,
  loginBackgroundUrl: null,
  loginBackgroundData: null,
};

class WhiteLabelService {
  /**
   * Get current white label configuration from server
   */
  async getConfig(): Promise<WhiteLabelConfig> {
    try {
      const response = await api.get('/settings');
      const data = response.data.data;

      return {
        companyName: data.companyName || DEFAULT_CONFIG.companyName,
        logoUrl: data.logoData,      // Use data as URL (base64)
        logoData: data.logoData,
        faviconUrl: data.faviconData,
        faviconData: data.faviconData,
        primaryColor: data.primaryColor,
        loginBackgroundUrl: data.loginBackgroundData,
        loginBackgroundData: data.loginBackgroundData,
      };
    } catch (error) {
      console.error('Failed to load white label config from server:', error);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Update white label configuration on server
   */
  async updateConfig(config: Partial<WhiteLabelConfig>): Promise<WhiteLabelConfig> {
    try {
      // Map UI fields to server fields
      const serverConfig: Record<string, any> = {};

      if (config.companyName !== undefined) {
        serverConfig.companyName = config.companyName;
      }
      if (config.logoData !== undefined || config.logoUrl !== undefined) {
        serverConfig.logoData = config.logoData ?? config.logoUrl;
      }
      if (config.faviconData !== undefined || config.faviconUrl !== undefined) {
        serverConfig.faviconData = config.faviconData ?? config.faviconUrl;
      }
      if (config.primaryColor !== undefined) {
        serverConfig.primaryColor = config.primaryColor;
      }
      if (config.loginBackgroundData !== undefined || config.loginBackgroundUrl !== undefined) {
        serverConfig.loginBackgroundData = config.loginBackgroundData ?? config.loginBackgroundUrl;
      }

      const response = await api.put('/settings', serverConfig);
      const data = response.data.data;

      const newConfig: WhiteLabelConfig = {
        companyName: data.companyName,
        logoUrl: data.logoData,
        logoData: data.logoData,
        faviconUrl: data.faviconData,
        faviconData: data.faviconData,
        primaryColor: data.primaryColor,
        loginBackgroundUrl: data.loginBackgroundData,
        loginBackgroundData: data.loginBackgroundData,
      };

      // Update page title
      this.updatePageTitle(newConfig.companyName);

      // Update favicon if provided
      if (newConfig.faviconData) {
        this.updateFavicon(newConfig.faviconData);
      }

      return newConfig;
    } catch (error) {
      console.error('Failed to update white label config:', error);
      throw error;
    }
  }

  /**
   * Reset to default configuration
   */
  async resetConfig(): Promise<WhiteLabelConfig> {
    try {
      const response = await api.post('/settings/reset');
      const data = response.data.data;

      this.updatePageTitle(data.companyName);

      return {
        companyName: data.companyName,
        logoUrl: data.logoData,
        logoData: data.logoData,
        faviconUrl: data.faviconData,
        faviconData: data.faviconData,
        primaryColor: data.primaryColor,
        loginBackgroundUrl: data.loginBackgroundData,
        loginBackgroundData: data.loginBackgroundData,
      };
    } catch (error) {
      console.error('Failed to reset white label config:', error);
      throw error;
    }
  }

  /**
   * Update page title dynamically
   */
  updatePageTitle(companyName: string): void {
    document.title = companyName;
  }

  /**
   * Update favicon dynamically
   */
  updateFavicon(faviconUrl: string): void {
    try {
      // Remove existing favicon
      const existingFavicon = document.querySelector("link[rel*='icon']");
      if (existingFavicon) {
        existingFavicon.remove();
      }

      // Add new favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = faviconUrl;
      document.head.appendChild(link);
    } catch (error) {
      console.error('Failed to update favicon:', error);
    }
  }

  /**
   * Upload and convert logo to base64
   */
  async uploadLogo(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        reject(new Error('File must be an image'));
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        reject(new Error('Image must be smaller than 2MB'));
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        resolve(base64);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload and convert favicon to base64
   */
  async uploadFavicon(file: File): Promise<string> {
    return this.uploadLogo(file); // Same logic
  }
}

export const whiteLabelService = new WhiteLabelService();
