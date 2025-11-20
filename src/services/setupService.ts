import { api } from '@/lib/api';

export interface SetupStatus {
  needsSetup: boolean;
  message: string;
}

export interface InitializeSetupData {
  email: string;
  password: string;
  name: string;
}

export const setupService = {
  /**
   * Check if initial setup is needed
   */
  checkStatus: async (): Promise<SetupStatus> => {
    const response = await api.get<SetupStatus>('/setup/status');
    return response.data;
  },

  /**
   * Initialize the application with first admin user
   */
  initialize: async (data: InitializeSetupData) => {
    const response = await api.post('/setup/initialize', data);
    return response.data;
  }
};
