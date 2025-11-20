import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'http://localhost:3002/api';

/**
 * MSW request handlers for mocking API responses in tests
 */
export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };

    // Mock successful login
    if (body.email === 'test@example.com' && body.password === 'TestPass123!') {
      return HttpResponse.json({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        },
        tokens: {
          expiresIn: 900
        }
      }, {
        status: 200,
        headers: {
          'Set-Cookie': 'access_token=mock-access-token; HttpOnly; Secure; SameSite=Strict',
        }
      });
    }

    // Mock failed login
    return HttpResponse.json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect'
    }, { status: 401 });
  }),

  http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string; name: string };

    // Mock user already exists
    if (body.email === 'existing@example.com') {
      return HttpResponse.json({
        error: 'User exists',
        message: 'An account with this email already exists'
      }, { status: 409 });
    }

    // Mock successful registration
    return HttpResponse.json({
      user: {
        id: '2',
        email: body.email,
        name: body.name,
        role: 'user'
      },
      tokens: {
        expiresIn: 900
      }
    }, { status: 201 });
  }),

  http.post(`${API_BASE_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      expiresIn: 900
    }, { status: 200 });
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({
      message: 'Logged out successfully'
    }, { status: 200 });
  }),

  http.get(`${API_BASE_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    const cookie = request.headers.get('Cookie');

    if (authHeader || cookie?.includes('access_token')) {
      return HttpResponse.json({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      }, { status: 200 });
    }

    return HttpResponse.json({
      error: 'Not authenticated'
    }, { status: 401 });
  }),

  http.get(`${API_BASE_URL}/auth/check`, ({ request }) => {
    const cookie = request.headers.get('Cookie');

    if (cookie?.includes('access_token')) {
      return HttpResponse.json({ authenticated: true }, { status: 200 });
    }

    return HttpResponse.json({ authenticated: false }, { status: 401 });
  }),

  // User management endpoints
  http.get(`${API_BASE_URL}/users`, () => {
    return HttpResponse.json({
      users: [
        {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user',
          isActive: true,
          createdAt: '2024-01-02T00:00:00Z'
        }
      ]
    }, { status: 200 });
  }),

  http.get(`${API_BASE_URL}/users/:id`, ({ params }) => {
    const { id } = params;

    if (id === '1') {
      return HttpResponse.json({
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z'
        }
      }, { status: 200 });
    }

    return HttpResponse.json({
      error: 'User not found'
    }, { status: 404 });
  }),

  http.post(`${API_BASE_URL}/users`, async ({ request }) => {
    const body = await request.json() as any;

    return HttpResponse.json({
      user: {
        id: '3',
        ...body,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    }, { status: 201 });
  }),

  http.put(`${API_BASE_URL}/users/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = await request.json() as any;

    return HttpResponse.json({
      user: {
        id,
        ...body,
        updatedAt: new Date().toISOString()
      }
    }, { status: 200 });
  }),

  http.delete(`${API_BASE_URL}/users/:id`, ({ params }) => {
    const { id } = params;

    return HttpResponse.json({
      message: `User ${id} deleted successfully`
    }, { status: 200 });
  }),

  // CSRF token endpoint
  http.get(`${API_BASE_URL}/csrf-token`, () => {
    return HttpResponse.json({
      csrfToken: 'mock-csrf-token'
    }, {
      status: 200,
      headers: {
        'Set-Cookie': 'XSRF-TOKEN=mock-csrf-token; Path=/; SameSite=Strict'
      }
    });
  }),

  // Proxmox API endpoints (mocked)
  http.get(`${API_BASE_URL}/proxmox/servers`, () => {
    return HttpResponse.json({
      servers: [
        {
          id: '1',
          name: 'Proxmox Server 1',
          host: 'proxmox1.example.com',
          port: 8006,
          status: 'online'
        }
      ]
    }, { status: 200 });
  }),

  http.get(`${API_BASE_URL}/proxmox/vms`, () => {
    return HttpResponse.json({
      vms: [
        {
          id: 'vm-100',
          name: 'Test VM',
          status: 'running',
          cpu: 2,
          memory: 4096,
          disk: 32
        }
      ]
    }, { status: 200 });
  }),

  // Rate limiting test endpoint
  http.post(`${API_BASE_URL}/test/rate-limit`, () => {
    return HttpResponse.json({
      error: 'Too many requests'
    }, {
      status: 429,
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '0',
        'Retry-After': '900'
      }
    });
  })
];
