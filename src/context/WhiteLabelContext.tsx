import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WhiteLabelConfig, whiteLabelService } from '@/services/whiteLabelService';

interface WhiteLabelContextType {
  config: WhiteLabelConfig;
  isLoading: boolean;
  updateConfig: (config: Partial<WhiteLabelConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  uploadFavicon: (file: File) => Promise<void>;
  refreshConfig: () => Promise<void>;
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

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined);

interface WhiteLabelProviderProps {
  children: ReactNode;
}

export const WhiteLabelProvider = ({ children }: WhiteLabelProviderProps) => {
  const [config, setConfig] = useState<WhiteLabelConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch config from server on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const serverConfig = await whiteLabelService.getConfig();
        setConfig(serverConfig);

        // Apply page title and favicon
        document.title = serverConfig.companyName;
        if (serverConfig.faviconData) {
          whiteLabelService.updateFavicon(serverConfig.faviconData);
        }
      } catch (error) {
        console.error('Failed to load white label config:', error);
        // Keep default config on error
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const refreshConfig = async () => {
    try {
      const serverConfig = await whiteLabelService.getConfig();
      setConfig(serverConfig);
      document.title = serverConfig.companyName;
      if (serverConfig.faviconData) {
        whiteLabelService.updateFavicon(serverConfig.faviconData);
      }
    } catch (error) {
      console.error('Failed to refresh white label config:', error);
    }
  };

  const updateConfig = async (newConfig: Partial<WhiteLabelConfig>) => {
    try {
      const updated = await whiteLabelService.updateConfig(newConfig);
      setConfig(updated);
    } catch (error) {
      console.error('Failed to update config:', error);
      throw error;
    }
  };

  const resetConfig = async () => {
    try {
      const reset = await whiteLabelService.resetConfig();
      setConfig(reset);
    } catch (error) {
      console.error('Failed to reset config:', error);
      throw error;
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      const base64 = await whiteLabelService.uploadLogo(file);
      await updateConfig({ logoData: base64 });
    } catch (error) {
      console.error('Failed to upload logo:', error);
      throw error;
    }
  };

  const uploadFavicon = async (file: File) => {
    try {
      const base64 = await whiteLabelService.uploadFavicon(file);
      await updateConfig({ faviconData: base64 });
    } catch (error) {
      console.error('Failed to upload favicon:', error);
      throw error;
    }
  };

  return (
    <WhiteLabelContext.Provider
      value={{
        config,
        isLoading,
        updateConfig,
        resetConfig,
        uploadLogo,
        uploadFavicon,
        refreshConfig,
      }}
    >
      {children}
    </WhiteLabelContext.Provider>
  );
};

export const useWhiteLabel = () => {
  const context = useContext(WhiteLabelContext);
  if (context === undefined) {
    throw new Error('useWhiteLabel must be used within a WhiteLabelProvider');
  }
  return context;
};
