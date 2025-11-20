import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WhiteLabelConfig, whiteLabelService } from '@/services/whiteLabelService';

interface WhiteLabelContextType {
  config: WhiteLabelConfig;
  updateConfig: (config: Partial<WhiteLabelConfig>) => void;
  resetConfig: () => void;
  uploadLogo: (file: File) => Promise<void>;
  uploadFavicon: (file: File) => Promise<void>;
}

const WhiteLabelContext = createContext<WhiteLabelContextType | undefined>(undefined);

interface WhiteLabelProviderProps {
  children: ReactNode;
}

export const WhiteLabelProvider = ({ children }: WhiteLabelProviderProps) => {
  const [config, setConfig] = useState<WhiteLabelConfig>(whiteLabelService.getConfig());

  useEffect(() => {
    // Initialize page title and favicon on mount
    document.title = config.companyName;
  }, []);

  const updateConfig = (newConfig: Partial<WhiteLabelConfig>) => {
    const updated = whiteLabelService.updateConfig(newConfig);
    setConfig(updated);
  };

  const resetConfig = () => {
    const reset = whiteLabelService.resetConfig();
    setConfig(reset);
  };

  const uploadLogo = async (file: File) => {
    try {
      const base64 = await whiteLabelService.uploadLogo(file);
      updateConfig({ logoUrl: base64 });
    } catch (error) {
      console.error('Failed to upload logo:', error);
      throw error;
    }
  };

  const uploadFavicon = async (file: File) => {
    try {
      const base64 = await whiteLabelService.uploadFavicon(file);
      updateConfig({ faviconUrl: base64 });
    } catch (error) {
      console.error('Failed to upload favicon:', error);
      throw error;
    }
  };

  return (
    <WhiteLabelContext.Provider
      value={{
        config,
        updateConfig,
        resetConfig,
        uploadLogo,
        uploadFavicon,
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
