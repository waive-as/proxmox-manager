import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // IMPORTANT: Send cookies with requests
});

/**
 * Get CSRF token from cookie
 * CSRF token is stored in a readable cookie (not httpOnly)
 */
function getCSRFToken(): string | null {
  const name = 'XSRF-TOKEN=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }

  return null;
}

// Request interceptor: Add CSRF token and handle authentication
api.interceptors.request.use(
  (config) => {
    // Add CSRF token to header for state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers['X-XSRF-TOKEN'] = csrfToken;
      }
    }

    // DEPRECATED: Still support localStorage tokens for backward compatibility
    // TODO: Remove this after full migration to cookie-based auth
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Handle 401 Unauthorized - but don't automatically log out
    // Let components handle auth errors gracefully
    if (error.response?.status === 401) {
      // Only log warning, don't force logout
      console.warn('Received 401 Unauthorized response:', error.config?.url);

      // If it's the profile endpoint specifically, might indicate session expiry
      if (error.config?.url?.includes('/users/profile')) {
        console.warn('Profile fetch failed - possible session expiry');
      }

      // Don't automatically redirect or clear token - let AuthContext handle it
    }

    // Handle 403 CSRF errors
    if (error.response?.status === 403) {
      const errorData = error.response?.data as any;
      if (errorData?.error?.includes('CSRF')) {
        console.error('CSRF validation failed - please refresh the page');
      }
    }

    return Promise.reject(error);
  }
);

export { api };
export default api;
