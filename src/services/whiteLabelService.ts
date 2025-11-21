/**
 * White Label Service - Manages branding and customization
 * Allows customization of company name, logo, and other branding elements
 */

export interface WhiteLabelConfig {
  companyName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor?: string;
  loginBackgroundUrl?: string | null;
}

const DEFAULT_CONFIG: WhiteLabelConfig = {
  companyName: 'Proxmox Manager Portal',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: undefined,
  loginBackgroundUrl: null,
};

const STORAGE_KEY = 'white_label_config';

class WhiteLabelService {
  /**
   * Get current white label configuration
   */
  getConfig(): WhiteLabelConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        return { ...DEFAULT_CONFIG, ...config };
      }
      return DEFAULT_CONFIG;
    } catch (error) {
      console.error('Failed to load white label config:', error);
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Update white label configuration
   */
  updateConfig(config: Partial<WhiteLabelConfig>): WhiteLabelConfig {
    try {
      const currentConfig = this.getConfig();
      const newConfig = { ...currentConfig, ...config };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));

      // Update page title
      this.updatePageTitle(newConfig.companyName);

      // Update favicon if provided
      if (newConfig.faviconUrl) {
        this.updateFavicon(newConfig.faviconUrl);
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
  resetConfig(): WhiteLabelConfig {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.updatePageTitle(DEFAULT_CONFIG.companyName);
      return DEFAULT_CONFIG;
    } catch (error) {
      console.error('Failed to reset white label config:', error);
      throw error;
    }
  }

  /**
   * Update page title dynamically
   */
  private updatePageTitle(companyName: string): void {
    document.title = companyName;
  }

  /**
   * Update favicon dynamically
   */
  private updateFavicon(faviconUrl: string): void {
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
   * Upload and store logo as base64
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
   * Upload and store favicon as base64
   */
  async uploadFavicon(file: File): Promise<string> {
    return this.uploadLogo(file); // Same logic
  }
}

export const whiteLabelService = new WhiteLabelService();
