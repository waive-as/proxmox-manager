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

// Response interceptor: Handle errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // If we haven't tried to refresh yet, attempt token refresh
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the access token
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
          await axios.post(`${apiUrl}/auth/refresh`, {}, {
            withCredentials: true
          });

          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed - redirect to login
          // Clear legacy localStorage token
          localStorage.removeItem('auth_token');

          // Only redirect if not already on login/setup page
          if (!['/login', '/signup', '/setup'].includes(window.location.pathname)) {
            window.location.href = '/login';
          }

          return Promise.reject(refreshError);
        }
      }

      // Already tried refresh, redirect to login
      localStorage.removeItem('auth_token');
      if (!['/login', '/signup', '/setup'].includes(window.location.pathname)) {
        window.location.href = '/login';
      }
    }

    // Handle 403 CSRF errors
    if (error.response?.status === 403) {
      const errorData = error.response?.data as any;
      if (errorData?.error?.includes('CSRF')) {
        console.error('CSRF validation failed - please refresh the page');
        // Optionally refresh the page to get a new CSRF token
        // window.location.reload();
      }
    }

    return Promise.reject(error);
  }
);

export { api };
export default api;
